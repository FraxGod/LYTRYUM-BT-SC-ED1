import { task } from "hardhat/config";
import { BigNumber, ContractTransaction, ContractReceipt } from "ethers";

task("swap", "make swap")
    .addParam("bridge", "bridge contract address")
    .addParam("recepient", "recepient address")
    .addParam("amount", "amount")
    .addParam("nonce", "nonce")
    .setAction(async (args, { ethers }) => {
        const srcChainId = BigNumber.from(80001);
        const dstChainId = BigNumber.from(97);

        const Bridge = await ethers.getContractFactory("Bridge");
	    const bridge = await Bridge.attach(ethers.utils.getAddress(args.bridge));

        let tx = await bridge.swap(
            ethers.utils.getAddress(args.recepient),
            args.amount,
            args.nonce as number
        );
        console.log(tx);
        let receipt = await tx.wait();
        console.log(receipt);
    });
