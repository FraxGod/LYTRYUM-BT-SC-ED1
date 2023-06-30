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

  console.log("starting verify BORROW_MANAGER");
  try {
    await hre.run("verify:verify", {
      address: config.BORROW_MANAGER_ADDRESS as string,
      contract: "contracts/BorrowManager.sol:BorrowManager",
      constructorArguments: [
        config.DAO_ADDRESS,
        config.UNISWAPV3_SWAP_ROUTER_ADDRESS,
        config.TEST_TOKEN_ADDRESS,
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
