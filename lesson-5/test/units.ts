import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { step } from "mocha-steps";
import { expect } from "chai";


describe("Bridge", function () {
	let tokenETH: any;
	let bridgeETH: any;

	let owner: SignerWithAddress;
	let validator: SignerWithAddress;
	let daemon: SignerWithAddress;
	let imposter: SignerWithAddress;
	let sender: SignerWithAddress;
	let recepient: SignerWithAddress;


	// nonce is a "salt" from the backend, new for any swap OR redeem transaction
	// "mirrored" swap and redeem transaction should have different nonce
	let nonce: number = 0;

	this.beforeAll(async () => {
		[owner, validator, daemon, imposter, sender, recepient] = await ethers.getSigners();

		tokenETH = await (await (await ethers.getContractFactory("CustomToken")).deploy()).deployed() as any;
	});

	step("step 1 deploy bridge", async () => {
		bridgeETH = await (await (
			await ethers.getContractFactory("Bridge")).deploy(
				validator.address, tokenETH.address, 1, 2
			)).deployed();

		expect(await bridgeETH.srcChainId()).to.equal(1);
		expect(await bridgeETH.dstChainId()).to.equal(2);
		expect(await bridgeETH.token()).to.equal(tokenETH.address);
	});

	step("step 2: setup token", async () => {
		// ToDo:: complete test case
	});

	step("step 3: check setupBridge function", async () => {
		// ToDo:: complete test case
	});

	step("step 4: make swaps", async () => {
		// ToDo:: complete test case
	});

	step("step 5: make another swaps", async () => {
		// ToDo:: complete test case
	});

	step("step 6: try to swap with used nonce", async () => {
		// ToDo:: complete test case
	});

	step("step 6: try to swap with not setted token address", async () => {
		// ToDo:: complete test case
	});


	step("step 7: make redeem", async () => {
		// ToDo:: complete test case
	});

	step("step 8: make another redeem", async () => {
		// ToDo:: complete test case
	});

	step("step 9: try to redeem with used nonce", async () => {
		// ToDo:: complete test case
	});

	step("step 10: try to swap with not setted token address", async () => {
		// ToDo:: complete test case
	});

	step("step 11: try to swap with not setted validator address", async () => {
		// ToDo:: complete test case
	});


	step("step 12: try to brake signature validation", async () => {
		// ToDo:: complete test case
	});

	step("step 13: tx signed by imposter", async () => {
		// ToDo:: complete test case
	});
});