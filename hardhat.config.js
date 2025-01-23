

/** @type import('hardhat/config').HardhatUserConfig */


require("@nomicfoundation/hardhat-toolbox");


module.exports = {
    solidity: "0.8.28", // Specifică versiunea de Solidity
    networks: {
        hardhat: {
            chainId: 1337, // ID-ul pentru rețeaua locală Hardhat
        },
    },
};
