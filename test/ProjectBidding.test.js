const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProjectBidding Contract", function () {
    let platform, bidding;
    let employer, freelancer1, freelancer2;

    beforeEach(async function () {
        [employer, freelancer1, freelancer2] = await ethers.getSigners();

        // Deploy OutsourcingPlatform
        const OutsourcingPlatform = await ethers.getContractFactory("OutsourcingPlatform");
        platform = await OutsourcingPlatform.deploy();
        await platform.waitForDeployment();

        // Deploy ProjectBidding
        const ProjectBidding = await ethers.getContractFactory("ProjectBidding");
        bidding = await ProjectBidding.deploy(platform.target); // Folosim `target` în loc de `address`
        await bidding.waitForDeployment();

        // Crearea unui proiect
        const latestBlock = await ethers.provider.getBlock("latest");
        const deadline = latestBlock.timestamp + 86400; // 1 zi în viitor
        const budget = ethers.parseEther("10");

        await platform.connect(employer).createProject("Test Project for Bidding", budget, deadline, { value: budget });
    });

    it("Should allow freelancers to place bids", async function () {
        await bidding.connect(freelancer1).placeBid(0, ethers.parseEther("8"));
        await bidding.connect(freelancer2).placeBid(0, ethers.parseEther("9"));

        const bids = await bidding.getBids(0);
        expect(bids.length).to.equal(2);
        expect(bids[0].freelancer).to.equal(freelancer1.address);
        expect(bids[0].bidAmount.toString()).to.equal(ethers.parseEther("8").toString());
    });

    it("Should allow only the employer to finalize the bidding", async function () {
        await bidding.connect(freelancer1).placeBid(0, ethers.parseEther("8"));
    
        await expect(
            bidding.connect(freelancer2).finalizeBid(0, 0)
        ).to.be.revertedWith("Not the employer");
    
        await bidding.connect(employer).depositFunds(0, { value: ethers.parseEther("10") });
    
        await expect(
            bidding.connect(employer).finalizeBid(0, 0)
        ).to.emit(bidding, "BidFinalized")
            .withArgs(0, freelancer1.address, ethers.parseEther("8"));
    });
    
    it("Should allow employer to deposit funds", async function () {
        await bidding.connect(employer).depositFunds(0, { value: ethers.parseEther("10") });

        expect(await bidding.projectEscrow(0)).to.be.true;
    });

    it("Should transfer ETH to the winning freelancer", async function () {
        await bidding.connect(freelancer1).placeBid(0, ethers.parseEther("8"));
        await bidding.connect(employer).depositFunds(0, { value: ethers.parseEther("10") });

        const initialBalance = await ethers.provider.getBalance(freelancer1.address);
        await bidding.connect(employer).finalizeBid(0, 0);

        const finalBalance = await ethers.provider.getBalance(freelancer1.address);
        expect(BigInt(finalBalance)).to.be.gte(BigInt(initialBalance) + BigInt(ethers.parseEther("8")));
    });

    it("Should not allow bidding to be finalized twice", async function () {
        await bidding.connect(freelancer1).placeBid(0, ethers.parseEther("8"));
        await bidding.connect(employer).depositFunds(0, { value: ethers.parseEther("10") });

        await bidding.connect(employer).finalizeBid(0, 0);

        await expect(
            bidding.connect(employer).finalizeBid(0, 0)
        ).to.be.revertedWith("Bidding already finalized");
    });

    it("Should revert if the project ID is invalid", async function () {
        await expect(
            bidding.connect(freelancer1).placeBid(1, ethers.parseEther("5"))
        ).to.be.revertedWith("Invalid project ID");
    });

    it("Should prevent a freelancer from bidding with zero ETH", async function () {
        await expect(
            bidding.connect(freelancer1).placeBid(0, 0)
        ).to.be.revertedWith("Bid must be greater than 0");
    });

    it("Should prevent an employer from placing a bid", async function () {
        await expect(
            bidding.connect(employer).placeBid(0, ethers.parseEther("5"))
        ).to.be.revertedWith("Not allowed to bid as employer");
    });
    

    it("Should revert if bid index is out of range", async function () {
        await bidding.connect(freelancer1).placeBid(0, ethers.parseEther("8"));
        await bidding.connect(employer).depositFunds(0, { value: ethers.parseEther("10") });

        await expect(
            bidding.connect(employer).finalizeBid(0, 10) // Index invalid
        ).to.be.revertedWith("Invalid bid index");
    });
});
