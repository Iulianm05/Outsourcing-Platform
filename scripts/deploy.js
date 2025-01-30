// scripts/deploy.js

const hre = require("hardhat");

async function main() {
    // 1. Deploy FreelancerRegistry
    const FreelancerRegistry = await hre.ethers.getContractFactory("FreelancerRegistry");
    const freelancerRegistry = await FreelancerRegistry.deploy();
    await freelancerRegistry.waitForDeployment();
    console.log("FreelancerRegistry deployed to:", await freelancerRegistry.getAddress());

    // 2. Deploy OutsourcingPlatform
    const OutsourcingPlatform = await hre.ethers.getContractFactory("OutsourcingPlatform");
    const outsourcingPlatform = await OutsourcingPlatform.deploy();
    await outsourcingPlatform.waitForDeployment();
    console.log("OutsourcingPlatform deployed to:", await outsourcingPlatform.getAddress());

    // 3. Deploy ProjectBidding with address of OutsourcingPlatform
    const ProjectBidding = await hre.ethers.getContractFactory("ProjectBidding");
    const projectBidding = await ProjectBidding.deploy(await outsourcingPlatform.getAddress());
    await projectBidding.waitForDeployment();
    console.log("ProjectBidding deployed to:", await projectBidding.getAddress());

    // 4. Deploy Lock
    // Obține timestamp-ul blocului curent
    const latestBlock = await hre.ethers.provider.getBlock("latest");
    const currentTimestamp = latestBlock.timestamp;
    const unlockTime = currentTimestamp + 86400; // 1 zi (86400 secunde)

    // Specifică valoarea pe care dorești să o trimiți în contract (opțional)
    const lockValue = hre.ethers.parseEther("1.0"); // 1 ETH

    const Lock = await hre.ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockValue });
    await lock.waitForDeployment();
    console.log("Lock deployed to:", await lock.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error in deployment:", error);
        process.exit(1);
    });
