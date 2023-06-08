import fs from "fs";
import dotenv from "dotenv";
import hre from "hardhat";

//npx hardhat run scripts/verify.dao.ts --network polygon_mumbai
async function main() {
  const net = hre.network.name;
  const config = dotenv.parse(fs.readFileSync(`.env-${net}`));
  for (const parameter in config) {
    process.env[parameter] = config[parameter];
  }

  console.log("starting verify DAO");
  try {
    await hre.run("verify:verify", {
      address: config.DAO_ADDRESS as string,
      contract: "contracts/DAO.sol:DAO",
      constructorArguments: [
        config.TEST_TOKEN_ADDRESS as string,
        config.MINIMUM_QUORUM,
        config.DEBATING_PERIOD,
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
