import fs from "fs";
import dotenv from "dotenv";
import hre from "hardhat";

//npx hardhat run scripts/verify.token.ts --network polygon_mumbai
async function main() {
  const net = hre.network.name;
  const config = dotenv.parse(fs.readFileSync(`.env-${net}`));
  for (const parameter in config) {
    process.env[parameter] = config[parameter];
  }

  console.log("starting verify ARBITRAGE_EXECUTOR");
  try {
    await hre.run("verify:verify", {
      address: config.ARBITRAGE_EXECUTOR_ADDRESS as string,
      contract: "contracts/ArbitrageExecutor.sol:ArbitrageExecutor",
      constructorArguments: [
        config.PROVIDER_ADDRESS,
        config.UNISWAPV3_ROUTER_ADDRESS,
        config.UNISWAPV3_FACTORY_ADDRESS,
      ],
    });
    console.log("verify success");
  } catch (e: any) {
    console.log(e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
