
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
    // Structură pentru un proiect
    struct Project {
        address employer; // Adresa angajatorului
        uint budget;      // Bugetul proiectului
        string description; // Descrierea proiectului
        address freelancer; // Adresa freelancerului selectat
        bool completed;    // Dacă proiectul este complet
    }

    uint public projectCount; // Număr total de proiecte
    mapping(uint => Project) public projects; // Mapping pentru stocarea proiectelor
    mapping(address => uint) public balances; // Mapping pentru balanțele utilizatorilor

    // Evenimente
    event ProjectCreated(uint projectId, address indexed employer, uint budget, string description);
    event FreelancerAssigned(uint projectId, address indexed freelancer);
    event PaymentTransferred(uint projectId, address indexed freelancer, uint amount);

    // Modifiers
    modifier onlyEmployer(uint projectId) {
        require(msg.sender == projects[projectId].employer, "Not the employer");
        _;
    }

    modifier onlyFreelancer(uint projectId) {
        require(msg.sender == projects[projectId].freelancer, "Not the freelancer");
        _;
    }

    // Funcție pentru crearea unui proiect
    function createProject(string memory description, uint budget) external payable {
        require(msg.value == budget, "Budget must match the sent value");

        projects[projectCount] = Project({
            employer: msg.sender,
            budget: budget,
            description: description,
            freelancer: address(0),
            completed: false
        });

        emit ProjectCreated(projectCount, msg.sender, budget, description);
        projectCount++;
    }

    // Funcție pentru asignarea unui freelancer
    function assignFreelancer(uint projectId, address freelancer) external onlyEmployer(projectId) {
        Project storage project = projects[projectId];
        require(project.freelancer == address(0), "Freelancer already assigned");

        project.freelancer = freelancer;

        emit FreelancerAssigned(projectId, freelancer);
    }

    // Funcție pentru completarea unui proiect și transfer ETH
    function completeProject(uint projectId) external onlyEmployer(projectId) {
        Project storage project = projects[projectId];
        require(!project.completed, "Project already completed");
        require(project.freelancer != address(0), "Freelancer not assigned");

        project.completed = true;

        // Transfer ETH către freelancer
        (bool success, ) = project.freelancer.call{value: project.budget}("");
        require(success, "Transfer failed");

        emit PaymentTransferred(projectId, project.freelancer, project.budget);
    }

    // Funcție `pure`
    function calculateFee(uint amount) public pure returns (uint) {
        return (amount * 5) / 100; // Taxa este de 5%
    }

    // Funcție `view`
    function getProjectDetails(uint projectId) public view returns (Project memory) {
        return projects[projectId];
    }
}
