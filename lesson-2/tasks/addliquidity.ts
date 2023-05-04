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

task('addliquidity', 'Add liquidity tokens')
    .addParam('tokena', 'Token address')
    .addParam('tokenb', 'Token address')
    .addParam('amounta', 'Token amount')
    .addParam('amountb', 'Token amount')
    .addParam('contract', 'Contract address')
	.setAction(async ({ tokena, tokenb, amounta, amountb, contract}, { ethers }) => {
        const [sender] = await ethers.getSigners();
    
        const TokenA = await ethers.getContractFactory('Token1');
        const tA = TokenA.attach(tokena);
        tA.mint(sender.address, amounta);
        tA.approve(contract, amounta);
        
        console.log('wait of delay...')
        await delay(15000) // delay 15 secons

        const TokenB = await ethers.getContractFactory('Token2');
        const tB = TokenB.attach(tokenb);
        tB.mint(sender.address, amountb);
        tB.approve(contract, amountb);
        
        console.log('wait of delay...')
        await delay(15000) // delay 15 secons

        const AddLiquidity = await ethers.getContractFactory('AddLiquidity');
        const addLiquidity = AddLiquidity.attach(contract);

        await addLiquidity.AddLiquidityToTokens(tokena, tokenb, amounta, amountb);
        console.log('Liquidity added!');
    })
