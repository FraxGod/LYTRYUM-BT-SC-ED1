import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  DAO,
  Token,
  AaveV3Router,
  BorrowManager,
  ISwapRouter,
  IUniswapV3PositionManager,
  IWETH,
  ICreditDelegationToken,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BorrowManager unit tests", function () {
  const MINIMUM_QUORUM = BigInt(51);
  const DEBATING_DURATION = 60 * 60 * 24 * 3;
  const TOTAL_SUPPLY = ethers.parseUnits("10000000", 18);
  const SWAP_ROUTER_ADDRESS = "0xe592427a0aece92de3edee1f18e0157c05861564";
  const UNISWAPV3_POSITION_MANAGER_ADDRESS =
    "0xc36442b4a4522e871399cd717abdd847ab11fe88";
  const AAVE_POOL_ADDRESS = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
  const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const AWETH_ADDRESS = "0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8";
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const USDC_DEBT_TOKEN = "0x72E95b8931767C79bA4EeE721354d6E99a61D004";
  const POOL_FEE = 500;
  const SQRT_PRICE_X96 = 79224306130848112672356n;

  let dao: DAO;
  let token: Token;
  let aaveRouter: AaveV3Router;
  let borrowManager: BorrowManager;
  let swapRouter: ISwapRouter;
  let posManager: IUniswapV3PositionManager;
  let weth: IWETH;
  let aweth: Token;
  let usdc: Token;
  let debtUsdc: ICreditDelegationToken;

  let signers: SignerWithAddress[];
  let borrower: SignerWithAddress;
  let daoOwner: SignerWithAddress;
  let daoParticipant: SignerWithAddress;

  let snapshotId: bigint;

  describe("Deployment", function () {
    it("Deploy token and dao", async function () {
      signers = await ethers.getSigners();
      borrower = signers[0];
      daoOwner = signers[1];
      daoParticipant = signers[2];
      const tokenFactory = await ethers.getContractFactory("Token");
      token = await tokenFactory
        .connect(daoOwner)
        .deploy("Government token", "GVT", TOTAL_SUPPLY);
      await token.waitForDeployment();

      const daoFactory = await ethers.getContractFactory("DAO");
      dao = await daoFactory
        .connect(daoOwner)
        .deploy(token.getAddress(), MINIMUM_QUORUM, DEBATING_DURATION);
      await dao.waitForDeployment();

      await token
        .connect(daoOwner)
        .grantRole(
          ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
          dao.getAddress()
        );

      expect(
        await token
          .connect(daoOwner)
          .hasRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), daoOwner)
      ).to.be.true;
    });

    it("Deploy router and borrow manager", async function () {
      const routerFactory = await ethers.getContractFactory("AaveV3Router");
      aaveRouter = await routerFactory.deploy();
      await aaveRouter.waitForDeployment();

      const borrowFactory = await ethers.getContractFactory("BorrowManager");
      borrowManager = await borrowFactory.deploy(
        await dao.getAddress(),
        SWAP_ROUTER_ADDRESS,
        await token.getAddress()
      );
      await borrowManager.waitForDeployment();

      signers = await ethers.getSigners();

      swapRouter = await ethers.getContractAt(
        "ISwapRouter",
        SWAP_ROUTER_ADDRESS
      );

      posManager = await ethers.getContractAt(
        "IUniswapV3PositionManager",
        UNISWAPV3_POSITION_MANAGER_ADDRESS
      );

      weth = await ethers.getContractAt("IWETH", WETH_ADDRESS);

      aweth = await ethers.getContractAt("Token", AWETH_ADDRESS);

      usdc = await ethers.getContractAt("Token", USDC_ADDRESS);

      debtUsdc = await ethers.getContractAt(
        "ICreditDelegationToken",
        USDC_DEBT_TOKEN
      );
    });
  });
  describe("Router unit tests", function () {
    it("Supply successfully", async function () {
      const AMOUNT_TO_DEPOSIT = ethers.parseEther("100");
      await weth.deposit({ value: ethers.parseEther("200") });
      await weth.approve(aaveRouter.getAddress(), AMOUNT_TO_DEPOSIT);
      await aaveRouter.supply(
        AAVE_POOL_ADDRESS,
        WETH_ADDRESS,
        AMOUNT_TO_DEPOSIT,
        borrower.getAddress(),
        0
      );

      expect(await aweth.balanceOf(borrower.getAddress())).to.be.closeTo(
        AMOUNT_TO_DEPOSIT,
        ethers.parseEther("0.1")
      );

      snapshotId = await ethers.provider.send("evm_snapshot");
    });

    it("Borrow successfully", async function () {
      const AMOUNT_TO_BORROW = ethers.parseUnits("1000", 6);
      await debtUsdc
        .connect(borrower)
        .approveDelegation(await aaveRouter.getAddress(), ethers.MaxUint256);
      await aaveRouter.borrow(
        AAVE_POOL_ADDRESS,
        2,
        USDC_ADDRESS,
        AMOUNT_TO_BORROW,
        borrower.getAddress(),
        0
      );

      expect(await usdc.balanceOf(borrower.getAddress())).to.be.closeTo(
        AMOUNT_TO_BORROW,
        ethers.parseUnits("0.1", 6)
      );
    });

    it("Repay successfully", async function () {
      const AMOUNT_TO_REPAY = ethers.parseUnits("1000", 6);
      await usdc.approve(aaveRouter.getAddress(), ethers.MaxUint256);
      await aaveRouter.repay(
        AAVE_POOL_ADDRESS,
        USDC_ADDRESS,
        AMOUNT_TO_REPAY,
        2,
        borrower.getAddress()
      );

      expect(await usdc.balanceOf(borrower.getAddress())).to.be.closeTo(
        0,
        ethers.parseUnits("0.1", 6)
      );
    });

    it("Withdraw successfully", async function () {
      await ethers.provider.send("evm_revert", [snapshotId]);
      snapshotId = await ethers.provider.send("evm_snapshot");
      const AMOUNT_TO_WITHDRAW = ethers.parseEther("100");
      await aweth.approve(aaveRouter.getAddress(), AMOUNT_TO_WITHDRAW);

      let balanceBefore = await weth.balanceOf(borrower.getAddress());
      await aaveRouter.withdraw(
        AAVE_POOL_ADDRESS,
        AWETH_ADDRESS,
        WETH_ADDRESS,
        AMOUNT_TO_WITHDRAW
      );

      expect(await aweth.balanceOf(borrower.getAddress())).to.be.closeTo(
        0,
        ethers.parseEther("0.2")
      );
      expect(await weth.balanceOf(borrower.getAddress())).to.be.closeTo(
        balanceBefore + AMOUNT_TO_WITHDRAW,
        ethers.parseEther("0.1")
      );
      await ethers.provider.send("evm_revert", [snapshotId]);
    });
  });
  describe("Prepare pools on uniswap", function () {
    it("Buy USDC", async function () {
      const AMOUNT_IN = ethers.parseEther("400");
      await weth.connect(daoOwner).deposit({ value: AMOUNT_IN });

      await weth
        .connect(daoOwner)
        .approve(SWAP_ROUTER_ADDRESS, ethers.MaxUint256);
      const swapParams = {
        tokenIn: WETH_ADDRESS,
        tokenOut: USDC_ADDRESS,
        fee: POOL_FEE,
        recipient: daoOwner.address,
        deadline: ethers.MaxUint256,
        amountIn: AMOUNT_IN,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };
      await swapRouter.connect(daoOwner).exactInputSingle(swapParams);
    });

    it("Create pool USDC/TOKEN_TO_BUY_VOTES and provide liquidity", async function () {
      const TOKEN_ADDRESS = await token.getAddress();
      await posManager
        .connect(daoOwner)
        .createAndInitializePoolIfNecessary(
          TOKEN_ADDRESS,
          USDC_ADDRESS,
          POOL_FEE,
          SQRT_PRICE_X96
        );

      await usdc
        .connect(daoOwner)
        .approve(UNISWAPV3_POSITION_MANAGER_ADDRESS, ethers.MaxUint256);
      await token
        .connect(daoOwner)
        .approve(UNISWAPV3_POSITION_MANAGER_ADDRESS, ethers.MaxUint256);
      const timestamp = await time.latest();

      const MIN_TICK = -887000;
      const MAX_TICK = -MIN_TICK;

      const mintParams = {
        token0: TOKEN_ADDRESS,
        token1: USDC_ADDRESS,
        fee: POOL_FEE,
        tickLower: MIN_TICK,
        tickUpper: MAX_TICK,
        amount0Desired: ethers.parseEther("10000"),
        amount1Desired: ethers.parseEther("10000"),
        amount0Min: 0,
        amount1Min: 0,
        recipient: daoOwner.address,
        deadline: timestamp + 3,
      };

      await posManager.connect(daoOwner).mint(mintParams);
    });

    it("Borrow USDC and buy TOKENS_TO_BUY_VOTE in pool", async function () {
      const AMOUNT_TO_BORROW = ethers.parseUnits("100000", 6);
      await debtUsdc
        .connect(borrower)
        .approveDelegation(await aaveRouter.getAddress(), ethers.MaxUint256);
      await aaveRouter.borrow(
        AAVE_POOL_ADDRESS,
        2,
        USDC_ADDRESS,
        AMOUNT_TO_BORROW,
        borrower.getAddress(),
        0
      );

      expect(await usdc.balanceOf(borrower.getAddress())).to.be.closeTo(
        AMOUNT_TO_BORROW,
        ethers.parseUnits("0.1", 6)
      );

      const AMOUNT_IN = ethers.parseUnits("100000", 6);

      await usdc
        .connect(borrower)
        .approve(borrowManager.getAddress(), ethers.MaxUint256);

      await borrowManager.swapToTokensToBuyVotes(
        USDC_ADDRESS,
        AMOUNT_IN,
        0,
        POOL_FEE
      );
    });
  });

  describe("Enter DAO proposal", function () {
    it("Create proposal", async function () {
      const transferCalldata = token.interface.encodeFunctionData("mint", [
        borrower.address,
        ethers.parseEther("1000"),
      ]);
      const description = "Minting 1000 tokens to borrower address";
      const recipient = await token.getAddress();

      expect(
        await dao
          .connect(daoOwner)
          .addProposal(recipient, description, transferCalldata)
      )
        .emit(dao, "AddedProposal")
        .withArgs(0, transferCalldata);
    });

    it("Prepare envirement of proposal to accept it", async function () {
      await token
        .connect(daoOwner)
        .transfer(daoParticipant, ethers.parseEther("5100000"));

      await token
        .connect(daoParticipant)
        .approve(dao.getAddress(), ethers.MaxUint256);
      await dao.connect(daoParticipant).deposit(ethers.parseEther("5099999"));

      await dao.connect(daoParticipant).vote(0, true);

      snapshotId = await ethers.provider.send("evm_snapshot");
      await ethers.provider.send("evm_increaseTime", [DEBATING_DURATION]);

      await expect(dao.connect(daoParticipant).finishProposal(0))
        .emit(dao, "FinishedProposal")
        .withArgs(0, false, false);
      await ethers.provider.send("evm_revert", [snapshotId]);
    });

    it("Enter proposal with borrowed value", async function () {
      await token
        .connect(borrower)
        .approve(borrowManager.getAddress(), ethers.MaxUint256);

      await borrowManager.depositAndVote(
        await token.balanceOf(borrower.address),
        0,
        true
      );
    });

    it("Finish proposal", async function () {
      await ethers.provider.send("evm_increaseTime", [DEBATING_DURATION]);

      await expect(dao.connect(borrower).finishProposal(0))
        .emit(dao, "FinishedProposal")
        .withArgs(0, true, true);
      expect(await token.balanceOf(borrower.address)).to.be.eq(
        ethers.parseEther("1000")
      );
    });
  });
});
