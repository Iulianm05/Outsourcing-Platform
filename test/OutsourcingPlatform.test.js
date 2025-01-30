const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OutsourcingPlatform", function () {
    let platform, owner, employer, freelancer, freelancer1;

    beforeEach(async function () {
        const Platform = await ethers.getContractFactory("OutsourcingPlatform");
        platform = await Platform.deploy(); // Deploy contract
        await platform.waitForDeployment(); // Wait for deploy

        [owner, employer, freelancer,freelancer1] = await ethers.getSigners(); // Accounts
    });

    it("Should create a project", async function () {
        const latestBlock = await ethers.provider.getBlock("latest");
        const deadline = latestBlock.timestamp + 86400; // Adăugăm 1 zi

        await platform
            .connect(employer)
            .createProject("Website Development", ethers.parseEther("1"), deadline, {
                value: ethers.parseEther("1"),
            });

        const project = await platform.projects(0);
        expect(project.description).to.equal("Website Development");
        expect(project.budget.toString()).to.equal(ethers.parseEther("1").toString());
        expect(project.employer).to.equal(employer.address);
    });

    it("Should not allow creating a project with a past deadline", async function () {
        const pastDeadline = (await ethers.provider.getBlock("latest")).timestamp - 1000;

        await expect(
            platform.connect(employer).createProject("Expired Project", ethers.parseEther("1"), pastDeadline, { value: ethers.parseEther("1") })
        ).to.be.revertedWith("Deadline must be in the future");
    });

    it("Should not allow creating a project with a too short description", async function () {
        const latestBlock = await ethers.provider.getBlock("latest");
        const deadline = latestBlock.timestamp + 86400;

        await expect(
            platform.connect(employer).createProject("Short", ethers.parseEther("1"), deadline, { value: ethers.parseEther("1") })
        ).to.be.revertedWith("Description too short");
    });

    it("Should assign a freelancer", async function () {
        const latestBlock = await ethers.provider.getBlock("latest");
        const deadline = latestBlock.timestamp + 86400;

        await platform
            .connect(employer)
            .createProject("Mobile App Development", ethers.parseEther("2"), deadline, {
                value: ethers.parseEther("2"),
            });

        await platform.connect(employer).assignFreelancer(0, freelancer.address);

        const project = await platform.projects(0);
        expect(project.freelancer).to.equal(freelancer.address);
    });

    it("Should not allow a non-employer to assign a freelancer", async function () {
        await expect(
            platform.connect(freelancer1).assignFreelancer(0, freelancer1.address)
        ).to.be.revertedWith("Not the employer or bidding contract");
    });
    

    it("Should not allow assigning a freelancer after the deadline", async function () {
        const latestBlock = await ethers.provider.getBlock("latest");
        const deadline = latestBlock.timestamp + 86400; // Adăugăm 1 zi
    
        await platform
            .connect(employer)
            .createProject("Late Assignment", ethers.parseEther("1"), deadline, { value: ethers.parseEther("1") });
    
        // Avansăm timpul blockchain-ului peste deadline
        await ethers.provider.send("evm_increaseTime", [86500]);
        await ethers.provider.send("evm_mine");
    
        await expect(
            platform.connect(employer).assignFreelancer(0, freelancer.address)
        ).to.be.revertedWith("Project deadline passed");
    });
    

    it("Should complete a project and transfer ETH to the freelancer", async function () {
        const latestBlock = await ethers.provider.getBlock("latest");
        const deadline = latestBlock.timestamp + 86400;
    
        await platform
            .connect(employer)
            .createProject("Backend API Development", ethers.parseEther("3"), deadline, {
                value: ethers.parseEther("3"),
            });
    
        await platform.connect(employer).assignFreelancer(0, freelancer.address);
    
        const freelancerBalanceBefore = await ethers.provider.getBalance(freelancer.address);
    
        await platform.connect(employer).completeProject(0);
    
        const freelancerBalanceAfter = await ethers.provider.getBalance(freelancer.address);
    
        // Conversie la BigInt pentru comparare
        expect(BigInt(freelancerBalanceAfter)).to.be.gte(BigInt(freelancerBalanceBefore) + BigInt(ethers.parseEther("3")));
    
        const project = await platform.projects(0);
        expect(project.completed).to.be.true;
    });
    
    it("Should not allow completing a project without a freelancer", async function () {
        const latestBlock = await ethers.provider.getBlock("latest");
        const deadline = latestBlock.timestamp + 86400;

        await platform
            .connect(employer)
            .createProject("Incomplete Project", ethers.parseEther("1"), deadline, { value: ethers.parseEther("1") });

        await expect(
            platform.connect(employer).completeProject(0)
        ).to.be.revertedWith("Freelancer not assigned");
    });

    it("Should not allow a non-employer to complete a project", async function () {
        const latestBlock = await ethers.provider.getBlock("latest");
        const deadline = latestBlock.timestamp + 86400;

        await platform
            .connect(employer)
            .createProject("Backend API Development", ethers.parseEther("3"), deadline, {
                value: ethers.parseEther("3"),
            });

        await expect(
            platform.connect(freelancer).completeProject(0)
        ).to.be.revertedWith("Not the employer");
    });

    it("Should retrieve project details using view function", async function () {
        const latestBlock = await ethers.provider.getBlock("latest");
        const deadline = latestBlock.timestamp + 86400;

        await platform
            .connect(employer)
            .createProject("Full Stack Development", ethers.parseEther("1"), deadline, {
                value: ethers.parseEther("1"),
            });

        const project = await platform.getProjectDetails(0);
        expect(project.description).to.equal("Full Stack Development");
    });

    it("Should return default values for a non-existent project", async function () {
        const project = await platform.getProjectDetails(999);
    
        const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

        expect(project.employer).to.equal(ZERO_ADDRESS);
        expect(project.budget).to.equal(0);
        expect(project.description).to.equal("");  // Șir gol
        expect(project.freelancer).to.equal(ZERO_ADDRESS);
        expect(project.deadline).to.equal(0);
        expect(project.completed).to.be.false;
        
    });
    
    

    it("Should calculate fees correctly using pure function", async function () {
        const fee = await platform.calculateFee(ethers.parseEther("10"));
        expect(fee.toString()).to.equal(ethers.parseEther("0.5").toString());
    });
});
