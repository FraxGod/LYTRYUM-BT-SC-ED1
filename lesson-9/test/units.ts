import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, network } from "hardhat";
import { step } from "mocha-steps";
import { expect } from "chai";

import { BigNumber, BigNumberish } from "ethers";
import bn from 'bignumber.js'
import IUniswapV3PoolJSON from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import IUniswapV3FactoryJSON from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json';
import INonfungiblePositionManagerJSON from '@uniswap/v3-periphery/artifacts/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json';
import ISwapRouterJSON from '@uniswap/swap-router-contracts/artifacts/contracts/interfaces/ISwapRouter02.sol/ISwapRouter02.json';

bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })

// Src: https://github.com/Uniswap/v3-periphery/blob/6cce88e63e176af1ddb6cc56e029110289622317/test/shared/encodePriceSqrt.ts
function encodePriceSqrt(reserve1: BigNumberish, reserve0: BigNumberish): BigNumber {
	return BigNumber.from(
	  new bn(reserve1.toString())
		.div(reserve0.toString())
		.sqrt()
		.multipliedBy(new bn(2).pow(96))
		.integerValue(3)
		.toString()
	)
}

// uniswap v2
// token swap from = token0
// token to swap = token1

// Src: https://github.com/Uniswap/v3-periphery/blob/6cce88e63e176af1ddb6cc56e029110289622317/test/shared/ticks.ts
const getMinTick = (tickSpacing: number) => Math.ceil(-887272 / tickSpacing) * tickSpacing
const getMaxTick = (tickSpacing: number) => Math.floor(887272 / tickSpacing) * tickSpacing
const getMaxLiquidityPerTick = (tickSpacing: number) =>
  BigNumber.from(2)
    .pow(128)
    .sub(1)
    .div((getMaxTick(tickSpacing) - getMinTick(tickSpacing)) / tickSpacing + 1)


describe("Uniswap v3", function () {
	let tokenA: any;
	let tokenB: any;

	let owner: any;
	let addr1: any;
	let addr2: any;
	let customWallet: SignerWithAddress;

	let uniswapFactory: any;
	let nonfungiblePositionManager: any;
	let swapRouter: any;

	const IUniswapV3FactoryABI: any = IUniswapV3FactoryJSON.abi;
	const IUniswapV3PoolABI: any = IUniswapV3PoolJSON.abi;
	const INonfungiblePositionManagerABI: any = INonfungiblePositionManagerJSON.abi;
	const ISwapRouterABI: any = ISwapRouterJSON.abi;
  
	// Polygon addresses
	// Src: https://docs.uniswap.org/contracts/v3/reference/deployments
	const factoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984"; // UniswapV3Factory
	const positionManagerAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"; // NonfungiblePositionManager
	const swapRouterAddress = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"; // SwapRouter  

	this.beforeAll(async () => {
		[owner, addr1, addr2] = await ethers.getSigners();

		tokenA = await (await (await ethers.getContractFactory("CustomToken")).deploy()).deployed() as any;
		tokenB = await (await (await ethers.getContractFactory("CustomToken")).deploy()).deployed() as any;

		//uniswap v3 contracts
		uniswapFactory = await ethers.getContractAt(IUniswapV3FactoryABI, factoryAddress);
		nonfungiblePositionManager = await ethers.getContractAt(INonfungiblePositionManagerABI, positionManagerAddress);
		swapRouter = await ethers.getContractAt(ISwapRouterABI, swapRouterAddress);

		const customAddress = "0x03DD1501459C8E85B47Eb77e462BfD934f88a367";

		await network.provider.request({
			method: "hardhat_impersonateAccount",
			params: [customAddress]
		});

		customWallet = await ethers.getSigner(customAddress);
		const customWalletBalance = await ethers.provider.getBalance(customWallet.address);
		console.log(`Custom Address balance ${customWalletBalance}`);
	});

	step("Adding new pool", async () => {
		console.log(`Token A address -> ${tokenA.address}`);
		console.log(`Token B address -> ${tokenB.address}`);

		const desiredAmount = ethers.utils.parseEther("5");
		const poolFee = BigNumber.from(3000); // 0.03%

		await tokenA.approve(nonfungiblePositionManager.address, desiredAmount);
		await tokenB.approve(nonfungiblePositionManager.address, desiredAmount);

		const [token0, token1] = tokenA.address < tokenB.address ? [tokenA, tokenB] : [tokenB, tokenA];

		await nonfungiblePositionManager.createAndInitializePoolIfNecessary(
			token0.address,
			token1.address,
			poolFee,
			encodePriceSqrt(1,1)
		);

		const uniswapPoolAddress = await uniswapFactory.getPool(token0.address, token1.address, poolFee);
		console.log(`Uniswap v3 Pool ${uniswapPoolAddress}`);

		const poolContract = await ethers.getContractAt(IUniswapV3PoolABI, uniswapPoolAddress);

		const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
			poolContract.tickSpacing(),
			poolContract.fee(),
			poolContract.liquidity(),
			poolContract.slot0()
		]);

		console.log(`tickSpacing - ${tickSpacing}, fee - ${fee}, liquidity ${liquidity}, slot0 - ${slot0}`);

		await nonfungiblePositionManager.mint({
			token0: token0.address,
			token1: token1.address,
			fee: poolFee,
			tickLower: getMinTick(tickSpacing),
			tickUpper: getMaxTick(tickSpacing),
			amount0Desired: desiredAmount,
			amount1Desired: desiredAmount,
			amount0Min: 0,
			amount1Min: 0,
			recipient: owner.address,
			deadline: Math.floor(Date.now() / 1000) + (60 * 10)
		});

		let nftBalance = await nonfungiblePositionManager.balanceOf(owner.address);

		console.log(`owner has LP NFT = ${nftBalance}`);

		// add Liquidity
		await token0.transfer(addr1.address, desiredAmount.div(3));
		await token1.transfer(addr1.address, desiredAmount.div(3));

		await token0.connect(addr1).approve(nonfungiblePositionManager.address, desiredAmount.div(3));
		await token1.connect(addr1).approve(nonfungiblePositionManager.address, desiredAmount.div(3));

		await nonfungiblePositionManager.connect(addr1).mint({
			token0: token0.address,
			token1: token1.address,
			fee: poolFee,
			tickLower: getMinTick(tickSpacing),
			tickUpper: getMaxTick(tickSpacing),
			amount0Desired: desiredAmount.div(3),
			amount1Desired: desiredAmount.div(3),
			amount0Min: 0,
			amount1Min: 0,
			recipient: addr1.address,
			deadline: Math.floor(Date.now() / 1000) + (60 * 10)
		});
		
		nftBalance = await nonfungiblePositionManager.balanceOf(addr1.address);

		console.log(`addr1 has LP NFT = ${nftBalance}`);

		// swap
		await token0.transfer(addr2.address, desiredAmount.div(2));
		await token0.connect(addr2).approve(swapRouter.address, desiredAmount.div(2));

		await swapRouter.connect(addr2).exactInputSingle({
			tokenIn: token0.address,
			tokenOut: token1.address,
			fee: poolFee,
			recipient: addr2.address,
			amountIn: desiredAmount.div(2),
			amountOutMinimum: 0,
			sqrtPriceLimitX96: 0
		});

		await expect(await token0.balanceOf(addr2.address)).to.be.equal(0);

		console.log(`token1 amount in addr2 = ${await token1.balanceOf(addr2.address)}`);
	});
});