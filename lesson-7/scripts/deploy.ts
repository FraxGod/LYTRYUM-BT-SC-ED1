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
  await token.deployed();
  console.log("Token deployed to: ", token.address);

  //Sync env file
  fs.appendFileSync(
    `.env-${net}`,
    `\r\# Token deployed to \rTEST_TOKEN_ADDRESS=${token.address}\r`
  );

  const factory = await ethers.getContractFactory("DAO");
  const dao = await factory.deploy(
    token.address,
    config.MINIMUM_QUORUM,
    config.DEBATING_PERIOD
  );
  await dao.deployed();

  console.log("DAO deployed to", dao.address);

  //Sync env file
  fs.appendFileSync(
    `.env-${net}`,
    `\r\# DAO deployed to \rDAO_ADDRESS=${dao.address}\r`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
