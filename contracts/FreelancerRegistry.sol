// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FreelancerRegistry {
    mapping(address => string) public freelancerProfiles;

    event FreelancerRegistered(address indexed freelancer, string profile);

    function registerFreelancer(string memory profile) external {
        require(bytes(profile).length > 10, "Profile too short");
        freelancerProfiles[msg.sender] = profile;
        emit FreelancerRegistered(msg.sender, profile);
    }
}
