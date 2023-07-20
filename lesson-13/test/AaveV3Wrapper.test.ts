import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  AaveV3Wrapper,
  IWETH
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AaveV3Wrapper unit tests", function () {
  const UNDERLYING_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const POOL_ADDRESS_PROVIDER = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e";
  const AAVE_POOL_ADDRESS = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
  const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  let wrapper: AaveV3Wrapper;
  let weth: IWETH;

  let signers: SignerWithAddress[];
  let depositor: SignerWithAddress;
  let minter: SignerWithAddress;

  describe("Deployment", function () {
    it("Deploy wrapper", async function () {
      signers = await ethers.getSigners();
      depositor = signers[0];
      minter = signers[1];
      const wrapperFactory = await ethers.getContractFactory("AaveV3Wrapper");
      wrapper = await wrapperFactory
        .deploy(UNDERLYING_ADDRESS, POOL_ADDRESS_PROVIDER);
      await wrapper.waitForDeployment();

      expect(
        await wrapper
          .asset()
      ).to.be.eq(UNDERLYING_ADDRESS);

      expect(
        await wrapper
          .aavePool()
      ).to.be.eq(AAVE_POOL_ADDRESS);

      weth = await ethers.getContractAt("IWETH", WETH_ADDRESS);
    });

    it("Should revert if address provider return address zero", async function () {
      const wrapperFactory = await ethers.getContractFactory("AaveV3Wrapper");
      await expect(wrapperFactory
        .deploy(ethers.ZeroAddress, POOL_ADDRESS_PROVIDER)).to.be
        .revertedWithCustomError(wrapper, "NotSupportedAsset");
    });
  });

  describe("Wrapper unit tests", function () {
    it("deposit successfully", async function () {
      const AMOUNT_TO_DEPOSIT = ethers.parseEther("10");
      await weth.connect(depositor).deposit({ value: ethers.parseEther("200") });
      await weth.connect(depositor).approve(wrapper.getAddress(), AMOUNT_TO_DEPOSIT);

      await wrapper.connect(depositor).deposit(AMOUNT_TO_DEPOSIT, depositor.address);
      expect(await wrapper.balanceOf(depositor.address)).to.be.eq(AMOUNT_TO_DEPOSIT);
    });
    it("revert deposit on 0 shares", async function () {
      const AMOUNT_TO_DEPOSIT = ethers.parseEther("0");
      await weth.connect(depositor).deposit({ value: ethers.parseEther("200") });
      await weth.connect(depositor).approve(wrapper.getAddress(), AMOUNT_TO_DEPOSIT);

      await expect(wrapper.connect(depositor).deposit(AMOUNT_TO_DEPOSIT, depositor.address)).to
        .be.revertedWithCustomError(wrapper, "ZeroShares");
    });
    it("mint successfully", async function () {
      const AMOUNT_TO_MINT = ethers.parseEther("20");
      await weth.connect(minter).deposit({ value: ethers.parseEther("200") });
      await weth.connect(minter).approve(wrapper.getAddress(), ethers.MaxUint256);

      await wrapper.connect(minter).mint(AMOUNT_TO_MINT, minter.address);
      expect(await wrapper.balanceOf(minter.address)).to.be.eq(AMOUNT_TO_MINT);
    });
    it("withdraw successfully", async function () {
      await time.increase(3600);
      const AMOUNT_TO_WITHDRAW = await wrapper.convertToAssets(await wrapper.balanceOf(depositor.address));

      const DEPOSITOR_BALANCE_BEFORE = await weth.balanceOf(depositor.address);
      await wrapper.connect(depositor).withdraw(AMOUNT_TO_WITHDRAW, depositor.address,depositor.address);
      expect(await weth.balanceOf(depositor.address)).to.be.eq(DEPOSITOR_BALANCE_BEFORE + AMOUNT_TO_WITHDRAW);
      expect(await wrapper.balanceOf(depositor.address)).to.be.closeTo(0, ethers.parseUnits("1", 11));
    });

    it("revert withdraw with exceeds amount", async function () {
      const AMOUNT_TO_WITHDRAW = ethers.parseEther("20");

      await expect(wrapper.connect(depositor).withdraw(AMOUNT_TO_WITHDRAW, depositor.address,depositor.address)).to
        .be.revertedWithCustomError(wrapper, "AmountExceedsMax");
    });

    it("redeem successfully", async function () {
      await time.increase(3600);
      const AMOUNT_TO_REDEEM = ethers.parseEther("10");
      const MINTER_BALANCE_BEFORE = await weth.balanceOf(minter.address);
      await wrapper.connect(minter).redeem(AMOUNT_TO_REDEEM, minter.address, minter.address);
      expect(await weth.balanceOf(minter.address)).to.be.gt(MINTER_BALANCE_BEFORE + AMOUNT_TO_REDEEM);
    });

    it("revert redeem with exceeds amount", async function () {
      const AMOUNT_TO_REDEEM = ethers.parseEther("100");

      await expect(wrapper.connect(minter).redeem(AMOUNT_TO_REDEEM, minter.address, minter.address)).to
        .be.revertedWithCustomError(wrapper, "AmountExceedsMax");
    });

    it("revert redeem on 0 assets", async function () {
      const AMOUNT_TO_REDEEM = ethers.parseEther("0");

      await expect(wrapper.connect(minter).redeem(AMOUNT_TO_REDEEM, minter.address, minter.address)).to
        .be.revertedWithCustomError(wrapper, "ZeroAssets");
    });

    it("wtihdraw with allowance successfully", async function () {
      await time.increase(3600);
      const AMOUNT_TO_WITHDRAW = ethers.parseEther("5");
      await wrapper.connect(minter).approve(depositor.address, AMOUNT_TO_WITHDRAW);

      const DEPOSITOR_BALANCE_BEFORE = await weth.balanceOf(depositor.address);
      await wrapper.connect(depositor).withdraw(AMOUNT_TO_WITHDRAW, depositor.address, minter.address);
      expect(await weth.balanceOf(depositor.address)).to.be.eq(DEPOSITOR_BALANCE_BEFORE + AMOUNT_TO_WITHDRAW);
    });
  });
});
