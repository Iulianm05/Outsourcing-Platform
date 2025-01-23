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
        await registry.connect(freelancer).registerFreelancer("Web Developer");
        const profile = await registry.freelancerProfiles(freelancer.address);
        expect(profile).to.equal("Web Developer");
    });

    it("Should emit an event when a freelancer is registered", async function () {
        await expect(
            registry.connect(freelancer).registerFreelancer("Web Developer")
        )
            .to.emit(registry, "FreelancerRegistered")
            .withArgs(freelancer.address, "Web Developer");
    });

    it("Should allow a freelancer to apply for a project", async function () {
        // Creează un proiect pe platformă
        await platform
            .connect(owner)
            .createProject("Web App", ethers.parseEther("1"), { value: ethers.parseEther("1") });
    
        // Angajatorul atribuie freelancerul manual
        await platform.connect(owner).assignFreelancer(0, freelancer.address);
    
        // Verifică că freelancerul a fost atribuit
        const project = await platform.projects(0);
        expect(project.freelancer).to.equal(freelancer.address);
    });
    
});
