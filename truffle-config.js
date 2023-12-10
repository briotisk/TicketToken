require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const { Mnemonic } = require('ethers');

module.exports = {

  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 5000000
    },

    goerli: {
      skipDryRun: true,
      provider: new HDWalletProvider({
        mnemonic: {
          phrase: process.env.SECRET, 
        },
        providerOrUrl: "https://ethereum-goerli.publicnode.com"
      }),
      network_id: 5,
    }

  },

  compilers: {

    solc: {

      version: "0.8.17",
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200      // Default: 200
        },
      }

    }
  }
  
};
