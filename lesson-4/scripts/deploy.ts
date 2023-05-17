import {ethers, run, network} from 'hardhat'

const delay = async (time: number) => {
	return new Promise((resolve: any) => {
		setInterval(() => {
			resolve()
		}, time)
	})
}

async function main() {
	const NFT = await ethers.getContractFactory("NFT");
	const nft = await NFT.deploy();
	await nft.deployed();

	console.log(
		`NFT contract deployed to ${nft.address}`
  	);

	console.log('wait of delay...')
	await delay(15000) // delay 15 secons

	const Marketplace = await ethers.getContractFactory("Marketplace");
	const marketplace = await Marketplace.deploy(nft.address, nft.address); // ToDo:: erc1155 address as 2nd param
	await marketplace.deployed();

	console.log(
		`Marketplace contract deployed to ${marketplace.address}`
  	);

	console.log('wait of delay...')
	await delay(15000) // delay 15 secons
	console.log('starting verify token...')
	try {
		await run('verify:verify', {
			address: nft!.address,
			contract: 'contracts/NFT.sol:NFT',
			constructorArguments: [],
		});
		console.log('verify success')
	} catch (e: any) {
		console.log(e.message)
	}

	console.log('wait of delay...')
	await delay(15000) // delay 15 secons
	console.log('starting verify token...')
	try {
		await run('verify:verify', {
			address: marketplace!.address,
			contract: 'contracts/Marketplace.sol:Marketplace',
			constructorArguments: [nft.address, nft.address],
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
