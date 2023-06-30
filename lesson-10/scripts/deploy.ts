import { ethers } from "hardhat";
import dotenv from "dotenv";
import fs from "fs";
import hre from "hardhat";

//npx hardhat run scripts/deploy.ts --network polygon_mumbai
async function main() {
  const net = hre.network.name;
  const config = dotenv.parse(fs.readFileSync(`.env-${net}`));
  for (const parameter in config) {
    process.env[parameter] = config[parameter];
  }

  const tokenFactory = await ethers.getContractFactory("Token");
  const token = await tokenFactory.deploy(
    config.TOKEN_NAME as string,
    config.TOKEN_SYMBOL as string,
    config.SUPPLY
  );
  await token.waitForDeployment();

  const TOKEN_ADDRESS = await token.getAddress();
  console.log("Token deployed to: ", TOKEN_ADDRESS);

  //Sync env file
  fs.appendFileSync(
    `.env-${net}`,
    `\r\# Token deployed to \rTEST_TOKEN_ADDRESS=${TOKEN_ADDRESS}\r`
  );

  const daoFactory = await ethers.getContractFactory("DAO");
  const dao = await daoFactory.deploy(
    TOKEN_ADDRESS,
    config.MINIMUM_QUORUM,
    config.DEBATING_PERIOD
  );
  await dao.waitForDeployment();

  const DAO_ADDRESS = await dao.getAddress();

  console.log("DAO deployed to", DAO_ADDRESS);

  //Sync env file
  fs.appendFileSync(
    `.env-${net}`,
    `\r\# DAO deployed to \rDAO_ADDRESS=${DAO_ADDRESS}\r`
  );

  const aaveRouterFactory = await ethers.getContractFactory("AaveV3Router");
  const aaveRouter = await aaveRouterFactory.deploy();
  await aaveRouter.waitForDeployment();

  const ROUTER_ADDRESS = await aaveRouter.getAddress();

  console.log("Router deployed to", ROUTER_ADDRESS);

  //Sync env file
  fs.appendFileSync(
    `.env-${net}`,
    `\r\# Router deployed to \rAAVE_ROUTER_ADDRESS=${ROUTER_ADDRESS}\r`
  );

  const borrowManagerFactory = await ethers.getContractFactory("BorrowManager");
  const borrowManager = await borrowManagerFactory.deploy(
    DAO_ADDRESS,
    config.UNISWAPV3_SWAP_ROUTER_ADDRESS,
    TOKEN_ADDRESS
  );
  await borrowManager.waitForDeployment();

  const BORROW_MANAGER_ADDRESS = await borrowManager.getAddress();

  console.log("Borrow manager deployed to", BORROW_MANAGER_ADDRESS);

  //Sync env file
  fs.appendFileSync(
    `.env-${net}`,
    `\r\# Borrow manager deployed to \rBORROW_MANAGER_ADDRESS=${BORROW_MANAGER_ADDRESS}\r`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
