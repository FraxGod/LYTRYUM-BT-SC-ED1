import { task } from 'hardhat/config'
import { BigNumber, ContractTransaction, ContractReceipt } from "ethers";
import { Address } from 'cluster';

const delay = async (time: number) => {
	return new Promise((resolve: any) => {
		setInterval(() => {
			resolve()
		}, time)
	})
}

task('mint', 'Mint new nft')
    .addParam('nft', 'Token address')
    .addParam('uri', 'Token uri')
	.setAction(async ({ nft, uri}, { ethers }) => {
        const [sender] = await ethers.getSigners();
    
        const NFT = await ethers.getContractFactory('NFT');
        const token = NFT.attach(nft);
        await token.mint(sender.address, uri);
        
        console.log('New token minted!');
    })
