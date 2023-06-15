import { ethers } from "hardhat";
import dotenv from "dotenv";
import fs from "fs";
import hre from "hardhat";

async function main() {
  const net = hre.network.name;
  const config = dotenv.parse(fs.readFileSync(`.env-${net}`));
  for (const parameter in config) {
    process.env[parameter] = config[parameter];
  }
  const linkAddress = config.LINK_TOKEN_ADDRESS;
  const wrapperAddress = config.WRAPPER_ADDRESS;
  const tokenAddress = config.TEST_TOKEN_ADDRESS;

  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(
    linkAddress,
    wrapperAddress,
    tokenAddress
  );

  await lottery.deployed();

  console.log(`Lottery successfully deployed at: ${lottery.address}`);

  fs.appendFileSync(
    `.env-${net}`,
    `\r\# Lottery deployed to \rLOTTERY_ADDRESS=${lottery.address}\r`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
