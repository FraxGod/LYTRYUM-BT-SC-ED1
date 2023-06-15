import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish, Contract } from "ethers";
import { Token } from "../typechain-types";
import { networkConfig } from "./helpers/helper-hardhat-config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Lottery", function () {
  const TOTAL_SUPPLY = ethers.utils.parseUnits("10000000", 18);
  const chainId = "default";
  const pointOneLink = BigNumber.from("100000000000000000"); // 0.1
  const oneHundredLink = BigNumber.from("100000000000000000000"); // 100 LINK
  const oneHundredGwei = BigNumber.from("100000000000");

  const wrapperGasOverhead = BigNumber.from(60_000);
  const coordinatorGasOverhead = BigNumber.from(52_000);
  const wrapperPremiumPercentage = 10;
  const maxNumWords = 10;
  const flatFee = pointOneLink;

  const weiPerUnitLink = BigNumber.from("3000000000000000"); // 0.00

  let token: Token;

  const fund = async (
    link: Contract,
    linkOwner: SignerWithAddress,
    receiver: string,
    amount: any
  ) => {
    await expect(link.connect(linkOwner).transfer(receiver, amount)).to.not.be
      .reverted;
  };

  // This should match implementation in VRFV2Wrapper::calculateGasPriceInternal
  const calculatePrice = (
    gasLimit: BigNumberish,
    _wrapperGasOverhead = wrapperGasOverhead,
    _coordinatorGasOverhead = coordinatorGasOverhead,
    _gasPriceWei = oneHundredGwei,
    _weiPerUnitLink = weiPerUnitLink,
    _wrapperPremium = wrapperPremiumPercentage,
    _flatFee = flatFee
  ) => {
    const totalGas = BigNumber.from(0)
      .add(gasLimit)
      .add(_wrapperGasOverhead)
      .add(_coordinatorGasOverhead);
    const baseFee = BigNumber.from("1000000000000000000")
      .mul(_gasPriceWei)
      .mul(totalGas)
      .div(_weiPerUnitLink);
    const withPremium = baseFee
      .mul(BigNumber.from(100).add(_wrapperPremium))
      .div(100);
    return withPremium.add(_flatFee);
  };

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  const deployRandomNumberConsumerFixture = async () => {
    const [owner, requester, withdrawRecipient] = await ethers.getSigners();

    const tokenFactory = await ethers.getContractFactory("Token");
    token = await tokenFactory.deploy("Government token", "GVT", TOTAL_SUPPLY);

    expect(await token.balanceOf(owner.address)).to.be.eq(
      ethers.utils.parseEther("10000000")
    );

    const coordinatorFactory = await ethers.getContractFactory(
      "VRFCoordinatorV2Mock",
      owner
    );
    const coordinator = await coordinatorFactory.deploy(
      pointOneLink,
      1e9 // 0.000000001 LINK per gas
    );

    const linkEthFeedFactory = await ethers.getContractFactory(
      "MockV3Aggregator",
      owner
    );
    const linkEthFeed = await linkEthFeedFactory.deploy(18, weiPerUnitLink); // 1 LINK = 0.003 ETH

    const linkFactory = await ethers.getContractFactory("LinkToken", owner);
    const link = await linkFactory.deploy();

    const wrapperFactory = await ethers.getContractFactory(
      "VRFV2Wrapper",
      owner
    );
    const wrapper = await wrapperFactory.deploy(
      link.address,
      linkEthFeed.address,
      coordinator.address
    );

    const consumerFactory = await ethers.getContractFactory("Lottery", owner);
    const lottery = await consumerFactory.deploy(
      link.address,
      wrapper.address,
      token.address
    );

    await token.mint(lottery.address, ethers.utils.parseEther("100000000"));

    // configure wrapper
    const keyHash = networkConfig[chainId]["keyHash"];
    await wrapper
      .connect(owner)
      .setConfig(
        wrapperGasOverhead,
        coordinatorGasOverhead,
        wrapperPremiumPercentage,
        keyHash,
        maxNumWords
      );

    // fund subscription. The Wrapper's subscription id is 1
    await coordinator.connect(owner).fundSubscription(1, oneHundredLink);

    return {
      coordinator,
      wrapper,
      lottery,
      link,
      owner,
      requester,
      withdrawRecipient,
    };
  };

  describe("Request random words", async () => {
    describe("success", async () => {
      it("Should successfully request a random number", async () => {
        const { lottery, wrapper, coordinator, link, owner } =
          await loadFixture(deployRandomNumberConsumerFixture);
        await fund(link, owner, lottery.address, oneHundredLink);
        const gasLimit = 100_000;
        const price = calculatePrice(gasLimit);

        // estimate price from wrapper side
        const estimatedWrapperPrice = await wrapper.calculateRequestPrice(
          gasLimit,
          {
            gasPrice: oneHundredGwei,
          }
        );
        expect(price).to.eq(estimatedWrapperPrice);

        const requestId = 1;
        const numWords = 1;

        expect(
          await token.approve(lottery.address, ethers.utils.parseEther("100"))
        ).to.be.ok;
        expect(await token.allowance(owner.address, lottery.address)).to.be.eq(
          ethers.utils.parseEther("100")
        );

        expect(
          await lottery.enterLottery(ethers.utils.parseEther("2"), {
            gasPrice: oneHundredGwei,
          })
        )
          .to.emit(coordinator, "RandomWordsRequested")
          .to.emit(lottery, "RequestSent")
          .withArgs(requestId, numWords);
        expect(await lottery.lastRequestId()).to.equal(requestId);
        // expect(await lottery.getNumberOfRequests()).to.equal(1);

        expect(await link.balanceOf(wrapper.address)).to.equal(price);
        const { paid, fulfilled } = await lottery.s_requests(requestId);
        expect(paid).to.equal(price);
        expect(fulfilled).to.be.false;
      });

      it("Should successfully request a random number and get a result with edge", async () => {

      });

      it("Should successfully request a random number and get a result with heads", async () => {

      });

      it("Should successfully request a random number and get a result with tails", async () => {

      });

      it("Should revert if caller not the requester", async () => {

      });
      it("Should revert if request not fulfilled yet", async () => {

      });

      it("Should revert if rewards was already claimed", async () => {
        
      });

      it("Should revert if requset not found", async () => {

      });
    });
  });
});
