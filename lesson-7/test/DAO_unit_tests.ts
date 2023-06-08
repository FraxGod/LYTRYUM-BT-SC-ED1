import { expect } from "chai";
import { ethers } from "hardhat";
import { DAO } from "../typechain-types/contracts/DAO";
import { Token } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { increaseTime } from "./utils/time";

describe("DAO unit tests", function () {
  const PRECISION = 100;
  const MINIMUM_QUORUM = 51;
  const DEBATING_DURATION = 60 * 60 * 24 * 3;
  const TOTAL_SUPPLY = ethers.utils.parseUnits("10000000", 18);

  let dao: DAO;
  let token: Token;
  let signers: SignerWithAddress[];

  describe("Deployment", function () {
    it("Deploy token and dao", async function () {
      const tokenFactory = await ethers.getContractFactory("Token");
      token = await tokenFactory.deploy(
        "Government token",
        "GVT",
        TOTAL_SUPPLY
      );
      await token.deployed();

      const daoFactory = await ethers.getContractFactory("DAO");
      dao = await daoFactory.deploy(
        token.address,
        MINIMUM_QUORUM,
        DEBATING_DURATION
      );
      await dao.deployed();

      signers = await ethers.getSigners();
    });

    it("Validate DAO parameters", async function () {
      const actual_quorum = await dao.minimumQuorum();
      expect(actual_quorum).eq(TOTAL_SUPPLY.mul(MINIMUM_QUORUM).div(PRECISION));

      const actual_debating_duration = await dao.debatingDuration();
      expect(actual_debating_duration).eq(DEBATING_DURATION);

      const actual_asset = await dao.asset();
      expect(actual_asset).eq(token.address);
    });
  });

  describe("Basic functionality", function () {
    it("Only admin can add a proposal", async function () {
      const transferCalldata = token.interface.encodeFunctionData("transfer", [
        ethers.constants.AddressZero,
        0,
      ]);
      const description = "Transfering 0 tokens to zero address";
      const recipient = token.address;

      // trying to add proposal
      for (var i = 1; i < signers.length; i++) {
        await expect(
          dao
            .connect(signers[i])
            .addProposal(recipient, description, transferCalldata)
        ).reverted;
      }

      // shouldn't revert
      expect(await dao.addProposal(recipient, description, transferCalldata))
        .emit(dao, "AddedProposal")
        .withArgs(0, transferCalldata);
    });

    it("Depositing tokens to the DAO", async function () {
      const amount = TOTAL_SUPPLY.div(2);
      const voters = signers.slice(1, 3);

      // depositing from 2 accounts
      voters.forEach(async voter => {
        /* ----------------- PREPARATION ----------------- */
        // send tokens to the signer
        await token.transfer(voter.address, amount);

        // approve for the DAO
        await token.connect(voter).approve(dao.address, amount);

        /* ------------------- DEPOSIT ------------------- */
        // saving balance before deposit
        const balanceVoterBefore = await token.balanceOf(voter.address);
        const balanceDaoBefore = await token.balanceOf(dao.address);

        // deposit to the DAO
        await dao.connect(voter).deposit(amount);

        // saving balance after deposit
        const balanceVoterAfter = await token.balanceOf(voter.address);
        const balanceDaoAfter = await token.balanceOf(dao.address);

        /* ------------------ CHECKING ------------------ */
        // checking tokens were sent from admin to the signer
        expect(balanceVoterBefore.sub(balanceVoterAfter)).eq(amount);
        expect(balanceDaoAfter.sub(balanceDaoBefore)).eq(amount);

        // checking deposit data
        const user = await dao.connect(voter).getUserInfo();
        expect(user.amount).eq(amount);
      })
    });

    it("Should revert if trying to vote for invalid proposal", async function () {
      //ToDo :: complete all test cases
    });

    it("Should revert if trying to vote from undeposited voter", async function () {

    });

    it("Voting FOR the proposal", async function () {

    });

    it("Voting AGAINST the proposal", async function () {

    });

    it("Should revert if trying to withdraw before finishing", async function () {

    });

    it("Should revert if end of the proposal is not reached", async function () {

    });

    it("Finishing the proposal", async function () {

    });

    it("Should be able to withdraw after finishing the proposal", async function () {
      
    });
  });
});
