const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FreelancerRegistry", function () {
    let registry, platform, owner, freelancer;

    beforeEach(async function () {
        const Platform = await ethers.getContractFactory("OutsourcingPlatform");
        platform = await Platform.deploy();
        await platform.waitForDeployment();

        const Registry = await ethers.getContractFactory("FreelancerRegistry");
        registry = await Registry.deploy();
        await registry.waitForDeployment();

        [owner, freelancer] = await ethers.getSigners();
    });

    it("Should register a freelancer", async function () {
        await registry.connect(freelancer).registerFreelancer("Full Stack Developer");
        const profile = await registry.freelancerProfiles(freelancer.address);
        expect(profile).to.equal("Full Stack Developer");
    });

    it("Should not allow registering with a short profile", async function () {
        await expect(
            registry.connect(freelancer).registerFreelancer("Too Short")
        ).to.be.revertedWith("Profile too short");
    });

    it("Should emit an event when a freelancer is registered", async function () {
        await expect(
            registry.connect(freelancer).registerFreelancer("Blockchain Expert")
        )
            .to.emit(registry, "FreelancerRegistered")
            .withArgs(freelancer.address, "Blockchain Expert");
    });

    it("Should allow a freelancer to apply for a project", async function () {
        const latestBlock = await ethers.provider.getBlock("latest");
        const deadline = latestBlock.timestamp + 86400; // 1 zi în viitor

        // Creează un proiect pe platformă
        await platform
        .connect(owner)
        .createProject("Web Application Project", ethers.parseEther("1"), deadline, { value: ethers.parseEther("1") });
    
        // Angajatorul atribuie freelancerul manual
        await platform.connect(owner).assignFreelancer(0, freelancer.address);

        // Verifică că freelancerul a fost atribuit
        const project = await platform.getProjectDetails(0);
        expect(project.freelancer).to.equal(freelancer.address);
    });
});
