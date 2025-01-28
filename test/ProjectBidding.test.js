const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProjectBidding Contract", function () {
    let platform; // Instanța contractului OutsourcingPlatform
    let bidding; // Instanța contractului ProjectBidding
    let employer, freelancer1, freelancer2; // Conturi de test

    beforeEach(async function () {
        // Obține conturile de test
        [employer, freelancer1, freelancer2] = await ethers.getSigners();
    
        // Creează și deployează contractul OutsourcingPlatform
        const OutsourcingPlatform = await ethers.getContractFactory("OutsourcingPlatform");
        platform = await OutsourcingPlatform.deploy(); // Deploy contract
        await platform.deployed(); // Așteaptă confirmarea deploy-ului
    
        console.log("OutsourcingPlatform deployed at:", platform.address);
    
        // Creează și deployează contractul ProjectBidding
        const ProjectBidding = await ethers.getContractFactory("ProjectBidding");
        bidding = await ProjectBidding.deploy(platform.address); // Deploy contract
        await bidding.deployed(); // Așteaptă confirmarea deploy-ului
    
        console.log("ProjectBidding deployed at:", bidding.address);
    
        // Creează un proiect în contractul OutsourcingPlatform
        const budget = ethers.utils.parseEther("10");
        await platform.connect(employer).createProject("Test Project", budget, { value: budget });
    });
    

    it("Should allow freelancers to place bids", async function () {
        // Freelancer1 plasează o ofertă
        await bidding.connect(freelancer1).placeBid(0, ethers.utils.parseEther("8"));

        // Freelancer2 plasează o ofertă
        await bidding.connect(freelancer2).placeBid(0, ethers.utils.parseEther("9"));

        // Verifică dacă ofertele au fost înregistrate
        const bids = await bidding.getBids(0);
        expect(bids.length).to.equal(2);
        expect(bids[0].freelancer).to.equal(freelancer1.address);
        expect(bids[0].bidAmount.toString()).to.equal(ethers.utils.parseEther("8").toString());
    });

    it("Should allow only the employer to finalize the bidding", async function () {
        // Freelancer1 plasează o ofertă
        await bidding.connect(freelancer1).placeBid(0, ethers.utils.parseEther("8"));

        // Freelancer2 încearcă să finalizeze licitația
        await expect(
            bidding.connect(freelancer2).finalizeBid(0, 0)
        ).to.be.revertedWith("Not the employer");

        // Angajatorul finalizează licitația
        await expect(
            bidding.connect(employer).finalizeBid(0, 0)
        ).to.emit(bidding, "BidFinalized")
            .withArgs(0, freelancer1.address, ethers.utils.parseEther("8"));
    });

    it("Should transfer ETH to the winning freelancer", async function () {
        // Freelancer1 plasează o ofertă
        await bidding.connect(freelancer1).placeBid(0, ethers.utils.parseEther("8"));

        // Verifică soldul inițial al freelancerului
        const initialBalance = await ethers.provider.getBalance(freelancer1.address);

        // Angajatorul finalizează licitația
        await bidding.connect(employer).finalizeBid(0, 0);

        // Verifică soldul freelancerului după transfer
        const finalBalance = await ethers.provider.getBalance(freelancer1.address);
        expect(finalBalance.sub(initialBalance).toString()).to.equal(ethers.utils.parseEther("8").toString());
    });

    it("Should not allow bidding to be finalized twice", async function () {
        // Freelancer1 plasează o ofertă
        await bidding.connect(freelancer1).placeBid(0, ethers.utils.parseEther("8"));

        // Angajatorul finalizează licitația
        await bidding.connect(employer).finalizeBid(0, 0);

        // Încearcă să finalizeze din nou
        await expect(
            bidding.connect(employer).finalizeBid(0, 0)
        ).to.be.revertedWith("Bidding already finalized");
    });

    it("Should revert if the project ID is invalid", async function () {
        await expect(
            bidding.connect(freelancer1).placeBid(1, ethers.utils.parseEther("5"))
        ).to.be.revertedWith("Invalid project ID");
    });
});
