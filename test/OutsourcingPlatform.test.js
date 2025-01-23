const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OutsourcingPlatform", function () {
    let platform, owner, employer, freelancer;

    beforeEach(async function () {
        const Platform = await ethers.getContractFactory("OutsourcingPlatform");
        platform = await Platform.deploy(); // Deploy contract
        await platform.waitForDeployment(); // Wait for deploy

        [owner, employer, freelancer] = await ethers.getSigners(); // Accounts
    });

    it("Should create a project", async function () {
        await platform
            .connect(employer)
            .createProject("Website Development", ethers.parseEther("1"), {
                value: ethers.parseEther("1"),
            });

        const project = await platform.projects(0);
        expect(project.description).to.equal("Website Development");
        expect(project.budget.toString()).to.equal(ethers.parseEther("1").toString());
        expect(project.employer).to.equal(employer.address);
    });

    it("Should assign a freelancer", async function () {
        await platform
            .connect(employer)
            .createProject("Mobile App Development", ethers.parseEther("2"), {
                value: ethers.parseEther("2"),
            });

        await platform.connect(employer).assignFreelancer(0, freelancer.address);

        const project = await platform.projects(0);
        expect(project.freelancer).to.equal(freelancer.address);
    });

    it("Should not allow a non-employer to assign a freelancer", async function () {
        await platform
            .connect(employer)
            .createProject("Mobile App Development", ethers.parseEther("2"), {
                value: ethers.parseEther("2"),
            });

        await expect(
            platform.connect(freelancer).assignFreelancer(0, freelancer.address)
        ).to.be.revertedWith("Not the employer");
    });

    it("Should complete a project and transfer ETH to the freelancer", async function () {
        await platform
            .connect(employer)
            .createProject("Backend API Development", ethers.parseEther("3"), {
                value: ethers.parseEther("3"),
            });
    
        await platform.connect(employer).assignFreelancer(0, freelancer.address);
    
        // Before balance
        const freelancerBalanceBefore = await ethers.provider.getBalance(freelancer.address);
    
        // Complete the project
        await platform.connect(employer).completeProject(0);
    
        // After balance
        const freelancerBalanceAfter = await ethers.provider.getBalance(freelancer.address);
    
        // Verifică transferul
        expect(freelancerBalanceAfter - freelancerBalanceBefore).to.equal(ethers.parseEther("3"));
    
        const project = await platform.projects(0);
        expect(project.completed).to.be.true;
    });
    
    

    it("Should not allow a non-employer to complete a project", async function () {
        await platform
            .connect(employer)
            .createProject("Backend API Development", ethers.parseEther("3"), {
                value: ethers.parseEther("3"),
            });

        await expect(
            platform.connect(freelancer).completeProject(0)
        ).to.be.revertedWith("Not the employer");
    });

    it("Should calculate fees correctly using pure function", async function () {
        const fee = await platform.calculateFee(ethers.parseEther("10"));
        expect(fee.toString()).to.equal(ethers.parseEther("0.5").toString());
    });

    it("Should retrieve project details using view function", async function () {
        await platform
            .connect(employer)
            .createProject("Full Stack Development", ethers.parseEther("1"), {
                value: ethers.parseEther("1"),
            });

        const project = await platform.getProjectDetails(0);
        expect(project.description).to.equal("Full Stack Development");
    });
});
