const hre = require("hardhat");

async function main() {
    // Obține factory-ul pentru contractul tău
    const OutsourcingPlatform = await hre.ethers.getContractFactory("OutsourcingPlatform");
    
    // Deploy contract
    const platform = await OutsourcingPlatform.deploy(); // Creează contractul
    await platform.waitForDeployment(); // Așteaptă finalizarea deploy-ului

    console.log("OutsourcingPlatform deployed to:", await platform.getAddress()); // Afișează adresa contractului
}

// Rulează scriptul și gestionează erorile
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
