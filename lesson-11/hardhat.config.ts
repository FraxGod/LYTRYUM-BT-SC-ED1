import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.MNEMONIC)
  throw new Error("Please set your MNEMONIC in a .env file");
let mnemonic = process.env.MNEMONIC as string;

// if (!process.env.ETHERSCAN_API_KEY)
//   throw new Error("Please set your ETHERSCAN_API_KEY in a .env file");
// let etherScanApiKey = process.env.ETHERSCAN_API_KEY as string;

if (!process.env.MUMBAISCAN_API_KEY)
  throw new Error("Please set your MUMBAISCAN_API_KEY in a .env file");
let mumbaiScanApiKey = process.env.MUMBAISCAN_API_KEY as string;

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
      accounts: {
        count: 10,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
      forking: {
        url: "https://mainnet.infura.io/v3/1fb60fdab2f544368a5dbb47b686d635",
        blockNumber: 17435567,
      },
    },
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
};

export default config;
