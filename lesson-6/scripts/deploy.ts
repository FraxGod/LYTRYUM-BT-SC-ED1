import hre, { ethers } from "hardhat";
import dotenv from "dotenv";
import fs from "fs";
import { ICO, ICO__factory } from "../typechain-types"
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

async function main() {
  const startTime = 1685369822; // 1688224890
  const endTime = startTime + 259200; // 1688224891
  const price = 200000;
  const minAmount = ethers.utils.parseUnits("1", 18);
  const maxAmount = ethers.utils.parseUnits("10", 18);
  const vesting = [
    [ endTime + 2592000, 10000],
    [ endTime + 2592000 * 2, 20000 ],
    [ endTime + 2592000 * 3, 20000 ],
    [ endTime + 2592000 * 4, 50000 ],
  ]; // [       [1688224892, 10000],       [1690816892, 20000],       [1693408892, 20000],       [1696000892, 50000] ]
  console.log(startTime, endTime, vesting)
  const Ico = await ethers.getContractFactory("ICO") as ICO__factory;
  const ico = await Ico.deploy(
    startTime,
    endTime,
    "0xA87eE42D9ef0c57FBB4d66dee97095F88916851b", //tst
    "0xf100eD42FD44EeD41cf148f1995aCC2e263BFd6b", // usdt
    price,
    minAmount,
    maxAmount,
    vesting
  );

  await ico.deployed();

  console.log("ICO deployed to:", ico.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
