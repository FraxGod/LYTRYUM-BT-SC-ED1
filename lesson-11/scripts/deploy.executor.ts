import { ethers } from "hardhat";
import dotenv from "dotenv";
import fs from "fs";
import hre from "hardhat";

//npx hardhat run scripts/deploy.executor.ts --network polygon_mumbai
async function main() {
  const net = hre.network.name;
  const config = dotenv.parse(fs.readFileSync(`.env-${net}`));
  for (const parameter in config) {
    process.env[parameter] = config[parameter];
  }

  const executorFactory = await ethers.getContractFactory("ArbitrageExecutor");
  const executor = await executorFactory.deploy(
    config.PROVIDER_ADDRESS,
    config.UNISWAPV3_ROUTER_ADDRESS,
    config.UNISWAPV3_FACTORY_ADDRESS
  );
  await executor.deployed();

  const ARBITRAGE_EXECUTOR_ADDRESS = executor.address;
  console.log("Arbitrage executor deployed to: ", ARBITRAGE_EXECUTOR_ADDRESS);

  //Sync env file
  fs.appendFileSync(
    `.env-${net}`,
    `\r\# Arbitrage executor deployed to \rARBITRAGE_EXECUTOR_ADDRESS=${ARBITRAGE_EXECUTOR_ADDRESS}\r`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
