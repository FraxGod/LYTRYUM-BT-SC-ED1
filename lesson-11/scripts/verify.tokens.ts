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

  console.log("starting verify TEST_TOKENA");
  try {
    await hre.run("verify:verify", {
      address: config.TEST_TOKENA_ADDRESS as string,
      contract: "contracts/Token.sol:Token",
      constructorArguments: ["tokenA", "TKNA", config.SUPPLY],
    });
    console.log("verify success");
  } catch (e: any) {
    console.log(e.message);
  }

  console.log("starting verify TEST_TOKENB");
  try {
    await hre.run("verify:verify", {
      address: config.TEST_TOKENB_ADDRESS as string,
      contract: "contracts/Token.sol:Token",
      constructorArguments: ["tokenB", "TKNB", config.SUPPLY],
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
