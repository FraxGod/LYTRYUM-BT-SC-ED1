import { ethers } from "hardhat";


export async function increaseTime(time: number) {
    await ethers.provider.send('evm_increaseTime', [time]);
}