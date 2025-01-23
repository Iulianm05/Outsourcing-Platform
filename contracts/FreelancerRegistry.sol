// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OutsourcingPlatform.sol";

contract FreelancerRegistry {
    mapping(address => string) public freelancerProfiles; // Profilurile freelancerilor

    event FreelancerRegistered(address indexed freelancer, string profile);

    function registerFreelancer(string memory profile) external {
        freelancerProfiles[msg.sender] = profile;
        emit FreelancerRegistered(msg.sender, profile);
    }

    function applyForProject(address platformAddress, uint projectId) external {
        OutsourcingPlatform platform = OutsourcingPlatform(platformAddress);
        platform.assignFreelancer(projectId, msg.sender);
    }
}
