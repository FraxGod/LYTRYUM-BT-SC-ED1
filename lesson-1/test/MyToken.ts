import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

const DECIMALS = 18;
const NAME = "MyToken";
const SYMBOL = "MTK";
const INITIAL_AMOUNT = ethers.utils.parseUnits("1", "18"); // 10^18
// const bigNumberExample = BigNumber.from(1000);

describe("MyToken contract", function () {
  let MyToken;
  let myToken: Contract;
  let owner: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress, users: SignerWithAddress[];

  beforeEach(async () => {
    MyToken = await ethers.getContractFactory('MyToken');
    [owner, user1, user2, ...users] = await ethers.getSigners();
    myToken = await MyToken.deploy(NAME, SYMBOL);
  })

  describe("Initial params of contract", async () => {
    it("Check total supply correctness", async () => {
      expect(await myToken.totalSupply()).to.equal(INITIAL_AMOUNT);
      expect(await myToken.balanceOf(owner.address)).to.equal(INITIAL_AMOUNT);
    })

    it("Check decimals supply correctness", async () => {
      expect(await myToken.decimals()).to.equal(DECIMALS);
    })

    it("Check name correctness", async () => {
      expect(await myToken.name()).to.equal(NAME);
    })

    it("Check symbol correctness", async () => {
      expect(await myToken.symbol()).to.equal(SYMBOL);
    })

  })

  describe("Contract logic", function () {
    it("Check balance of user after transferring", async () => {
      let transferTransaction = await myToken.transfer(user1.address, INITIAL_AMOUNT);
      let rc = await transferTransaction.wait();
      const transferEvent = rc.events.find((event: { event: string; }) => event.event === 'Transfer');
      const [_from, _to, _value] = transferEvent.args;
      
      expect(_from).to.equal(owner.address);
      expect(_to).to.equal(user1.address);
      expect(_value).to.equal(INITIAL_AMOUNT);
      expect(await myToken.balanceOf(user1.address)).to.equal(INITIAL_AMOUNT);
    })

    it("Check that it's impossible to transfer more money than user has", async () => {
      let initialUserBalance = await myToken.balanceOf(user1.address)
      await expect(myToken.transfer(user1.address, INITIAL_AMOUNT.add(1))).to.be.revertedWith('ERC20: Not enough balance');
      expect(await myToken.balanceOf(user1.address)).to.equal(initialUserBalance);
    })
    
    // add more test cases
  })
});