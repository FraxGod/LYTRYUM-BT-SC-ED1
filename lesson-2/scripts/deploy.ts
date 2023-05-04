import {ethers, run, network} from 'hardhat'

const delay = async (time: number) => {
	return new Promise((resolve: any) => {
		setInterval(() => {
			resolve()
		}, time)
	})
}

async function main() {
	const AddLiquidity = await ethers.getContractFactory("AddLiquidity");
	const addliq = await AddLiquidity.deploy();
	await addliq.deployed();

	console.log(
		`AddLiquidity contract deployed to ${addliq.address}`
  	);

	console.log('wait of delay...')
	await delay(15000) // delay 15 secons
	console.log('starting verify token...')
	try {
		await run('verify:verify', {
			address: addliq!.address,
			contract: 'contracts/AddLiquidity.sol:AddLiquidity',
			constructorArguments: [],
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
