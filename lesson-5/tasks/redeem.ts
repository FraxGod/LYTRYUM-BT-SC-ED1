import { task } from "hardhat/config";
import { BigNumber, ContractTransaction, ContractReceipt } from "ethers";

task("redeem", "make redeem with homebase sign")
    .addParam("bridge", "bridge contract address")
    .addParam("sender", "sender address")
    .addParam("recepient", "recepient address")
    .addParam("amount", "amount")
    .addParam("nonce", "nonce")
    .setAction(async (args, { ethers }) => {
        const srcChainId = BigNumber.from(80001);
        const dstChainId = BigNumber.from(97);

        const Bridge = await ethers.getContractFactory("Bridge");
	    const bridge = await Bridge.attach(ethers.utils.getAddress(args.bridge));

        let message = ethers.utils.arrayify(ethers.utils.solidityKeccak256(
            [
                "address",
                "address",
                "uint256",
                "uint256",
                "uint256",
                "uint256"
            ],
            [
                ethers.utils.getAddress(args.sender),
                ethers.utils.getAddress(args.recepient),
                args.amount,
                args.nonce as number,
                srcChainId,
                dstChainId // we redeem tx which was swapped on the other bridge side
            ] 
        ));

        // works only if your's address is validator
        const [validator] = await ethers.getSigners();
        let signature = await validator.signMessage(message);
        let { v, r, s } = ethers.utils.splitSignature(signature);

        let tx = await bridge.redeem(
            ethers.utils.getAddress(args.sender),
            ethers.utils.getAddress(args.recepient),
            args.amount,
            args.nonce as number,
            v, r, s
        );
        console.log(tx);
        let receipt = await tx.wait();
        console.log(receipt);
    });
