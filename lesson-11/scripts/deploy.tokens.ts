import { ethers } from "hardhat";
import dotenv from "dotenv";
import fs from "fs";
import hre from "hardhat";

//npx hardhat run scripts/deploy.tokens.ts --network polygon_mumbai
async function main() {
  const net = hre.network.name;
  const config = dotenv.parse(fs.readFileSync(`.env-${net}`));
  for (const parameter in config) {
    process.env[parameter] = config[parameter];
  }

  const tokenFactory = await ethers.getContractFactory("Token");
  const tokenA = await tokenFactory.deploy("tokenA", "TKNA", config.SUPPLY);
  await tokenA.deployed();

  const TOKENA_ADDRESS = tokenA.address;
  console.log("TokenA deployed to: ", TOKENA_ADDRESS);

  //Sync env file
  fs.appendFileSync(
    `.env-${net}`,
    `\r\# TokenA deployed to \rTEST_TOKENA_ADDRESS=${TOKENA_ADDRESS}\r`
  );

  const tokenB = await tokenFactory.deploy("tokenB", "TKNB", config.SUPPLY);
  await tokenB.deployed();

  const TOKENB_ADDRESS = tokenB.address;
  console.log("TokenB deployed to: ", TOKENB_ADDRESS);

  //Sync env file
  fs.appendFileSync(
    `.env-${net}`,
    `\r\# TokenB deployed to \rTEST_TOKENB_ADDRESS=${TOKENB_ADDRESS}\r`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
