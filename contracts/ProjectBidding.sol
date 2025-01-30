// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OutsourcingPlatform.sol";

contract ProjectBidding {
    struct Bid {
        address freelancer;
        uint bidAmount;
        uint timestamp;
    }

    mapping(uint => Bid[]) public projectBids;
    mapping(uint => bool) public projectEscrow; // Fonduri depuse
    mapping(uint => bool) public finalizedProjects; // Starea finalizării

    OutsourcingPlatform public platform;

    event BidPlaced(uint indexed projectId, address indexed freelancer, uint bidAmount);
    event BidFinalized(uint indexed projectId, address indexed freelancer, uint bidAmount);

    modifier onlyEmployer(uint projectId) {
        OutsourcingPlatform.Project memory project = platform.getProjectDetails(projectId);
        require(msg.sender == project.employer, "Not the employer");
        _;
    }

    constructor(address _platform) {
        platform = OutsourcingPlatform(_platform);
        platform.setBiddingContract(address(this)); // Înregistrăm contractul de licitație în OutsourcingPlatform
    }

    function placeBid(uint projectId, uint bidAmount) external {
        OutsourcingPlatform.Project memory project = platform.getProjectDetails(projectId);
        require(msg.sender != project.employer, "Not allowed to bid as employer");
        require(bidAmount > 0, "Bid must be greater than 0");
        require(projectId < platform.projectCount(), "Invalid project ID");

        projectBids[projectId].push(Bid({
            freelancer: msg.sender,
            bidAmount: bidAmount,
            timestamp: block.timestamp
        }));

        emit BidPlaced(projectId, msg.sender, bidAmount);
    }

    function depositFunds(uint projectId) external payable onlyEmployer(projectId) {
        require(!projectEscrow[projectId], "Funds already deposited");
        require(msg.value > 0, "Must deposit funds");

        projectEscrow[projectId] = true;
    }

    function finalizeBid(uint projectId, uint bidIndex) external onlyEmployer(projectId) {
        require(projectEscrow[projectId], "Funds not deposited");
        require(!finalizedProjects[projectId], "Bidding already finalized");
        require(bidIndex < projectBids[projectId].length, "Invalid bid index");

        Bid memory winningBid = projectBids[projectId][bidIndex];
        finalizedProjects[projectId] = true; // Marcăm licitația ca finalizată

        (bool success, ) = winningBid.freelancer.call{value: winningBid.bidAmount}("");
        require(success, "Transfer failed");

        platform.assignFreelancer(projectId, winningBid.freelancer);
        emit BidFinalized(projectId, winningBid.freelancer, winningBid.bidAmount);
    }

    function getBids(uint projectId) external view returns (Bid[] memory) {
        return projectBids[projectId];
    }
}
