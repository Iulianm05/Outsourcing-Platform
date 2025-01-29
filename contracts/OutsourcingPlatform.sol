
// pragma solidity ^0.8.0;

// contract OutsourcingPlatform {
//     struct Project {
//         address employer;
//         uint budget;
//         string description;
//         address freelancer;
//         bool completed;
//     }

//     uint public projectCount;
//     mapping(uint => Project) public projects;

//     event ProjectCreated(uint projectId, address employer, uint budget, string description);

//     function createProject(string memory description, uint budget) external payable {
//         require(msg.value == budget, "Budget must match sent value");

//         projects[projectCount] = Project({
//             employer: msg.sender,
//             budget: budget,
//             description: description,
//             freelancer: address(0),
//             completed: false
//         });

//         emit ProjectCreated(projectCount, msg.sender, budget, description);
//         projectCount++;
//     }
// }


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OutsourcingPlatform {
    struct Project {
        address employer; // Angajator
        uint budget; // Buget
        string description; // Descriere
        address freelancer; // Freelancer selectat
        uint deadline; // Termen limită
        bool completed; // Dacă este complet
    }

    uint public projectCount;
    mapping(uint => Project) public projects;

    event ProjectCreated(uint indexed projectId, address indexed employer, uint budget, string description, uint deadline);
    event FreelancerAssigned(uint indexed projectId, address indexed freelancer);
    event PaymentTransferred(uint indexed projectId, address indexed freelancer, uint amount);

    modifier onlyEmployer(uint projectId) {
        require(msg.sender == projects[projectId].employer, "Not the employer");
        _;
    }

    modifier noReentrancy() {
        require(!locked, "Reentrancy detected");
        locked = true;
        _;
        locked = false;
    }

    bool private locked;

    function createProject(string memory description, uint budget, uint deadline) external payable {
        require(msg.value == budget, "Budget must match sent ETH");
        require(bytes(description).length > 10, "Description too short");
        require(deadline > block.timestamp, "Deadline must be in the future");

        projects[projectCount] = Project({
            employer: msg.sender,
            budget: budget,
            description: description,
            freelancer: address(0),
            deadline: deadline,
            completed: false
        });

        emit ProjectCreated(projectCount, msg.sender, budget, description, deadline);
        projectCount++;
    }

    function assignFreelancer(uint projectId, address freelancer) external onlyEmployer(projectId) {
        Project storage project = projects[projectId];
        require(project.freelancer == address(0), "Freelancer already assigned");
        require(block.timestamp < project.deadline, "Project deadline passed");

        project.freelancer = freelancer;
        emit FreelancerAssigned(projectId, freelancer);
    }

    function completeProject(uint projectId) external onlyEmployer(projectId) noReentrancy {
        Project storage project = projects[projectId];
        require(!project.completed, "Project already completed");
        require(project.freelancer != address(0), "Freelancer not assigned");

        project.completed = true;

        (bool success, ) = project.freelancer.call{value: project.budget}("");
        require(success, "Transfer failed");

        emit PaymentTransferred(projectId, project.freelancer, project.budget);
    }

    function calculateFee(uint amount) public pure returns (uint) {
        return (amount * 5) / 100; // Taxă de 5%
    }

    function getProjectDetails(uint projectId) public view returns (Project memory) {
        return projects[projectId];
    }
}
