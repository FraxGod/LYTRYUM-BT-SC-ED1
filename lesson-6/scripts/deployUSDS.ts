import { ethers } from "hardhat";
import { CustomToken, CustomToken__factory } from "../typechain-types"

async function main() {

  const factory = await ethers.getContractFactory("CustomToken") as CustomToken__factory;
  const token = await factory.deploy("USDC", "USDC", 18);
  await token.deployed();

  console.log("DAO deployed to", token.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
