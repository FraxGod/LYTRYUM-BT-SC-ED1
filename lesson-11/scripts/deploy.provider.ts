import { ethers } from "hardhat";
import dotenv from "dotenv";
import fs from "fs";
import hre from "hardhat";

//npx hardhat run scripts/deploy.provider.ts --network polygon_mumbai
async function main() {
  const net = hre.network.name;
  const config = dotenv.parse(fs.readFileSync(`.env-${net}`));
  for (const parameter in config) {
    process.env[parameter] = config[parameter];
  }

  const providerFactory = await ethers.getContractFactory("FlashLoanProvider");
  const provider = await providerFactory.deploy(config.PROVIDER_FEE);
  await provider.deployed();

  const PROVIDER_ADDRESS = provider.address;
  console.log("Provider deployed to: ", PROVIDER_ADDRESS);

  //Sync env file
  fs.appendFileSync(
    `.env-${net}`,
    `\r\# Provider deployed to \rPROVIDER_ADDRESS=${PROVIDER_ADDRESS}\r`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
