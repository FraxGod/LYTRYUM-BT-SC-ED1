import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
// import { DeQuestXIlluviumSummerChallenge } from "../typechain-types/contracts/DeQuest-NFT.sol";
// import { ERC721 } from "../typechain-types/@openzeppelin/contracts/token/ERC721";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ArbitrageExecutor, Token } from "../typechain-types/contracts";
import { FlashLoanProvider } from "../typechain-types/contracts";
import { IUniswapV3Router } from "../typechain-types/contracts/interfaces";
import { IUniswapV3Factory } from "../typechain-types/";
import { IUniswapV3PositionManager } from "../typechain-types";
import { parseEther } from "ethers/lib/utils";

const getSignersForTest = async () => {
  const [backend, nftOwner, requester, withdrawRecipient] =
    await ethers.getSigners();
  return {
    backend,
    nftOwner,
    requester,
  };
};

describe("FlashLoan unit tests", function () {
  const fee1 = 500;
  const fee2 = 100;
  const UNISWAPV3_ROUTER_ADDRESS = "0xe592427a0aece92de3edee1f18e0157c05861564";
  const UNISWAPV3_FACTORY_ADDRESS =
    "0x1F98431c8aD98523631AE4a59f267346ea31F984";
  const UNISWAPV3_POSITION_MANAGER_ADDRESS =
    "0xc36442b4a4522e871399cd717abdd847ab11fe88";

  const MIN_TICK = -887000;
  const MAX_TICK = -MIN_TICK;

  const sqrtPriceX96Pool1 = 82228562514264387593543950336n;
  const sqrtPriceX96Pool2 = 78928562514264387593543950336n;

  let uniswapV3Router: IUniswapV3Router;
  let uniswapV3PositionManager: IUniswapV3PositionManager;
  let uniswapV3Factory: IUniswapV3Factory;
  let tokenA: Token;
  let tokenB: Token;
  let flashLoanProvider: FlashLoanProvider;
  let arbitrageExecutor: ArbitrageExecutor;

  describe("Deployment", function () {
    it("Deploy Tokens succesfully", async function () {
      const tokenFactory = await ethers.getContractFactory("Token");
      tokenA = await tokenFactory.deploy(
        "tokenA",
        "TKNA",
        ethers.utils.parseEther("100000")
      );
      await tokenA.deployed();

      tokenB = await tokenFactory.deploy(
        "tokenB",
        "TKNB",
        ethers.utils.parseEther("100000")
      );
      await tokenB.deployed();
    });

    it("Deploy FlashLoanProvider succesfully", async function () {
      const ProviderFactory = await ethers.getContractFactory(
        "FlashLoanProvider"
      );
      flashLoanProvider = await ProviderFactory.deploy(300);
      await flashLoanProvider.deployed();
    });

    it("Deploy ArbitrageExecutor succesfully", async function () {
      const ExecutorFactory = await ethers.getContractFactory(
        "ArbitrageExecutor"
      );
      arbitrageExecutor = await ExecutorFactory.deploy(
        flashLoanProvider.address,
        UNISWAPV3_ROUTER_ADDRESS,
        UNISWAPV3_FACTORY_ADDRESS
      );
      await arbitrageExecutor.deployed();

      uniswapV3Router = await ethers.getContractAt(
        "IUniswapV3Router",
        UNISWAPV3_ROUTER_ADDRESS
      );

      uniswapV3Factory = await ethers.getContractAt(
        "IUniswapV3Factory",
        UNISWAPV3_FACTORY_ADDRESS
      );

      uniswapV3PositionManager = await ethers.getContractAt(
        "IUniswapV3PositionManager",
        UNISWAPV3_POSITION_MANAGER_ADDRESS
      );
    });
  });

  describe("Create pools and fulfil contract with tokens", function () {
    it("Pool creates", async function () {
      const { backend } = await getSignersForTest();

      await uniswapV3PositionManager
        .connect(backend)
        .createAndInitializePoolIfNecessary(
          tokenA.address,
          tokenB.address,
          fee1,
          sqrtPriceX96Pool1
        );

      await uniswapV3PositionManager
        .connect(backend)
        .createAndInitializePoolIfNecessary(
          tokenA.address,
          tokenB.address,
          fee2,
          sqrtPriceX96Pool2
        );
    });

    it("Provide liquidity to the pools", async function () {
      const { backend } = await getSignersForTest();

      const timestamp = await time.latest();

      await tokenA.approve(
        uniswapV3PositionManager.address,
        ethers.utils.parseEther("100000")
      );
      await tokenB.approve(
        uniswapV3PositionManager.address,
        ethers.utils.parseEther("100000")
      );

      const mintParams1 = {
        token0: tokenA.address,
        token1: tokenB.address,
        fee: fee1,
        tickLower: MIN_TICK,
        tickUpper: MAX_TICK,
        amount0Desired: ethers.utils.parseEther("1000"),
        amount1Desired: ethers.utils.parseEther("1000"),
        amount0Min: 0,
        amount1Min: 0,
        recipient: backend.address,
        deadline: timestamp + 3,
      };

      await uniswapV3PositionManager.mint(mintParams1);

      const mintParams2 = {
        token0: tokenA.address,
        token1: tokenB.address,
        fee: fee2,
        tickLower: MIN_TICK,
        tickUpper: MAX_TICK,
        amount0Desired: ethers.utils.parseEther("1000"),
        amount1Desired: ethers.utils.parseEther("1000"),
        amount0Min: 0,
        amount1Min: 0,
        recipient: backend.address,
        deadline: timestamp + 20,
      };
      await uniswapV3PositionManager.mint(mintParams2);
    });

    it("Fulfill provider with tokens", async function () {
      expect(
        await tokenA.transfer(
          flashLoanProvider.address,
          ethers.utils.parseEther("10000")
        )
      ).to.be.ok;
      expect(await tokenA.balanceOf(flashLoanProvider.address)).to.be.eq(
        ethers.utils.parseEther("10000")
      );
    });
    describe("Flash loan test", function () {
      it("Execute flashloan and check profit", async function () {
        const { backend } = await getSignersForTest();
        const abiCoder = new ethers.utils.AbiCoder();
        console.log("price fee1 pool: ");
        console.log(
          await arbitrageExecutor.getPrice(tokenA.address, tokenB.address, fee1)
        );
        console.log("price fee2 pool: ");
        console.log(
          await arbitrageExecutor.getPrice(tokenA.address, tokenB.address, fee2)
        );
        const data = abiCoder.encode(
          ["address", "uint24", "uint24", "address", "uint256"],
          [
            tokenB.address,
            fee1,
            fee2,
            backend.address,
            ethers.utils.parseEther("20"),
          ]
        );

        let balanceBefore = await tokenA.balanceOf(backend.address);
        let amountToLoan = ethers.utils.parseEther("20");

        await arbitrageExecutor.flashloan(tokenA.address, amountToLoan, data);

        console.log("price fee1 pool after: ");
        console.log(
          await arbitrageExecutor.getPrice(tokenA.address, tokenB.address, fee1)
        );
        console.log("price fee2 pool after: ");
        console.log(
          await arbitrageExecutor.getPrice(tokenA.address, tokenB.address, fee2)
        );

        expect(await tokenA.balanceOf(backend.address)).to.be.greaterThan(
          balanceBefore
        );
      });
    });
  });
});
