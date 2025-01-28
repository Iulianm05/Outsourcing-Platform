// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OutsourcingPlatform.sol";

contract ProjectBidding {
    struct Bid {
        address freelancer; // Adresa freelancerului
        uint bidAmount;     // Suma propusă de freelancer
    }

    struct ProjectBids {
        uint projectId;    // ID-ul proiectului
        Bid[] bids;        // Lista ofertelor pentru acest proiect
        bool finalized;    // Dacă licitația este finalizată
    }

    mapping(uint => ProjectBids) public projectBids; // Mapping pentru licitații
    OutsourcingPlatform public platform; // Referința către contractul OutsourcingPlatform

    // Evenimente
    event BidPlaced(uint indexed projectId, address indexed freelancer, uint bidAmount);
    event BidFinalized(uint indexed projectId, address indexed freelancer, uint bidAmount);

    // Modificator care permite acces doar angajatorului proiectului
    modifier onlyEmployer(uint projectId) {
        (address employer, , , , ) = platform.projects(projectId);
        require(msg.sender == employer, "Not the employer");
        _;
    }

    constructor(address _outsourcingPlatform) {
        platform = OutsourcingPlatform(_outsourcingPlatform); // Inițializează referința contractului OutsourcingPlatform
    }

    // Freelancer trimite o ofertă pentru un proiect
    function placeBid(uint projectId, uint bidAmount) external {
        require(bidAmount > 0, "Bid amount must be greater than 0");
        require(projectId < platform.projectCount(), "Invalid project ID");

        projectBids[projectId].projectId = projectId;
        projectBids[projectId].bids.push(Bid({
            freelancer: msg.sender,
            bidAmount: bidAmount
        }));

        emit BidPlaced(projectId, msg.sender, bidAmount);
    }

    // Angajatorul finalizează licitația și selectează freelancerul câștigător
    function finalizeBid(uint projectId, uint bidIndex) external onlyEmployer(projectId) {
        ProjectBids storage bids = projectBids[projectId];
        require(!bids.finalized, "Bidding already finalized");
        require(bidIndex < bids.bids.length, "Invalid bid index");

        Bid memory winningBid = bids.bids[bidIndex];
        bids.finalized = true;

        // Transferă ETH către freelancerul câștigător
        (bool success, ) = winningBid.freelancer.call{value: winningBid.bidAmount}("");
        require(success, "Transfer to freelancer failed");

        // Atribuie freelancerul câștigător în OutsourcingPlatform
        platform.assignFreelancer(projectId, winningBid.freelancer);

        emit BidFinalized(projectId, winningBid.freelancer, winningBid.bidAmount);
    }

    // Obține ofertele pentru un proiect
    function getBids(uint projectId) external view returns (Bid[] memory) {
        return projectBids[projectId].bids;
    }

    // Primește fonduri de la angajator pentru proiect
    receive() external payable {}
}
