import {ethers, run, network} from 'hardhat'

const delay = async (time: number) => {
	return new Promise((resolve: any) => {
		setInterval(() => {
			resolve()
		}, time)
	})
}

async function main() {
	const [sender] = await ethers.getSigners();
	const Token = await ethers.getContractFactory("CustomToken");
	const token = await Token.deploy();
	await token.deployed();
	
	console.log(
		`Token contract deployed to ${token.address}`
  	);
	await delay(5000) // delay 5 secons
	//change regarding chain to deploy
	const srcChainId = 80001;
	const dstChainId = 97;
	const Bridge = await ethers.getContractFactory("Bridge");
	const bridge = await Bridge.deploy(sender.address, token.address, srcChainId, dstChainId);
	await bridge.deployed();

	console.log(
		`Bridge contract deployed to ${bridge.address}`
  	);

	console.log('wait of delay...')
	await delay(5000) // delay 5 secons

	await token.setBurner(bridge.address);
	await token.setMinter(bridge.address);

	try {
		await run('verify:verify', {
			address: bridge!.address,
			contract: 'contracts/Bridge.sol:Bridge',
			constructorArguments: [sender.address, token.address, srcChainId, dstChainId],
		});
		console.log('verify success')
	} catch (e: any) {
		console.log(e.message)
	}
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
