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

  console.log("starting verify LOTTERY");
  try {
    await hre.run("verify:verify", {
      address: config.LOTTERY_ADDRESS as string,
      contract: "contracts/Lottery.sol:Lottery",
      constructorArguments: [
        config.LINK_TOKEN_ADDRESS as string,
        config.WRAPPER_ADDRESS as string,
        config.TEST_TOKEN_ADDRESS as string,
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
