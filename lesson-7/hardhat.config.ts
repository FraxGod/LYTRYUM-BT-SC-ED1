import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";

require("dotenv").config();

if (!process.env.MNEMONIC)
  throw new Error("Please set your MNEMONIC in a .env file");
let mnemonic = process.env.MNEMONIC as string;

if (!process.env.ETHERSCAN_API_KEY)
  throw new Error("Please set your ETHERSCAN_API_KEY in a .env file");
let etherScanApiKey = process.env.ETHERSCAN_API_KEY as string;

if (!process.env.BSCSCAN_API_KEY)
  throw new Error("Please set your BSCSCAN_API_KEY in a .env file");
let bscScanApiKey = process.env.BSCSCAN_API_KEY as string;

if (!process.env.MUMBAISCAN_API_KEY)
  throw new Error("Please set your MUMBAISCAN_API_KEY in a .env file");
let mumbaiScanApiKey = process.env.MUMBAISCAN_API_KEY as string;

const config: HardhatUserConfig = {
  networks: {
    hardhat: {},
    polygon_mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: {
        count: 10,
        initialIndex: 0,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
    },
  },
  etherscan: {
    apiKey: mumbaiScanApiKey,
  },
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
