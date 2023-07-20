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

  const wrapperFactory = await ethers.getContractFactory("AaveV3Wrapper");
  const wrapper = await wrapperFactory.deploy(
    config.WETH_ADDRESS,
    config.POOL_ADDRESSES_PROVIDER_ADDRESS
  );
  await wrapper.waitForDeployment();

  const WRAPPER_ADDRESS = await wrapper.getAddress();
  console.log("Wrapper deployed to: ", WRAPPER_ADDRESS);

  //Sync env file
  fs.appendFileSync(
    `.env-${net}`,
    `\r\# Wrapper deployed to \rWRAPPER_ADDRESS=${WRAPPER_ADDRESS}\r`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
