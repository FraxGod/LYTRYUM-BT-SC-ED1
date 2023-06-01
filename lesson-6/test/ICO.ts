import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { CustomToken, ICO } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MerkleTree } from "merkletreejs";
const { keccak256 } = ethers.utils;

// variables
let usdc: CustomToken;
let tst: CustomToken;
let presale: ICO;
let owner: SignerWithAddress;
let accounts: SignerWithAddress[];
let vesting; // 1 month 10%, 2 month 30%, 3 month 50%, 4 month 100%.
let startTime = 0;
let endTime: number;

// constants
const tstDecimals = 18;
const uscDecimals = 6;
const price = 200000;
const minAmount = ethers.utils.parseUnits("10", tstDecimals);
const maxAmount = ethers.utils.parseUnits("100", tstDecimals);
const goal = ethers.utils.parseUnits("2000", uscDecimals);
const totalTST = ethers.utils.parseUnits("5000", tstDecimals);

describe("ICO", function () {
  async function deployFixture() {
    [owner, ...accounts] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CustomToken");
    usdc = await Token.deploy("USD  TOKEN", "USD", uscDecimals);
    tst = await Token.deploy("Test  TOKEN", "TST", tstDecimals);
    const Presale = await ethers.getContractFactory("ICO");
    startTime = await time.latest();
    endTime = startTime + 259200;
    vesting = [
      { unlockTime: endTime + 2592000, unlockPercent: 10000 },
      { unlockTime: endTime + 2592000 * 2, unlockPercent: 20000 },
      { unlockTime: endTime + 2592000 * 3, unlockPercent: 20000 },
      { unlockTime: endTime + 2592000 * 4, unlockPercent: 50000 },
    ];
    presale = await Presale.deploy(
      startTime,
      endTime,
      tst.address,
      usdc.address,
      price,
      minAmount,
      maxAmount,
      vesting
    );
    await presale.deployed();

    for (let i = 0; i < 10; i++) {
      await usdc.mint(accounts[i].address, ethers.utils.parseEther("100"));
    }
  }

  async function deployInitFixture() {
    [owner, ...accounts] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CustomToken");
    usdc = await Token.deploy("USD TOKEN", "USD", uscDecimals);
    tst = await Token.deploy("Test TOKEN", "TST", tstDecimals);
    const Presale = await ethers.getContractFactory("ICO");
    startTime = await time.latest();
    endTime = startTime + 259200;
    vesting = [
      { unlockTime: endTime + 2592000, unlockPercent: 10000 },
      { unlockTime: endTime + 2592000 * 2, unlockPercent: 20000 },
      { unlockTime: endTime + 2592000 * 3, unlockPercent: 20000 },
      { unlockTime: endTime + 2592000 * 4, unlockPercent: 50000 },
    ];
    presale = await Presale.deploy(
      startTime,
      endTime,
      tst.address,
      usdc.address,
      price,
      minAmount,
      maxAmount,
      vesting
    );
    await presale.deployed();

    await tst.connect(owner).approve(presale.address, totalTST);
    await presale.initialize(goal);

    for (let i = 0; i < 10; i++) {
      await usdc.mint(accounts[i].address, ethers.utils.parseEther("100"));
    }
  }

  describe("Vesting Rules", () => {
    it("Should be unable to set less than 100% total", async () => {
      const Token = await ethers.getContractFactory("CustomToken");
      usdc = await Token.deploy("USD TOKEN", "USD", uscDecimals);
      tst = await Token.deploy("Test TOKEN", "TST", tstDecimals);
      startTime = await time.latest();
      endTime = startTime + 259200;
      vesting = [
        { unlockTime: endTime + 2592000, unlockPercent: 100 },
        { unlockTime: endTime + 2592000 * 2, unlockPercent: 20000 },
        { unlockTime: endTime + 2592000 * 3, unlockPercent: 20000 },
        { unlockTime: endTime + 2592000 * 4, unlockPercent: 50000 },
      ];
      const Presale = await ethers.getContractFactory("ICO");
      await expect(Presale.deploy(
        startTime,
        endTime,
        tst.address,
        usdc.address,
        price,
        minAmount,
        maxAmount,
        vesting
      )).to.be.revertedWith("bad vesting rules");
    })

    it("Should be unable to set more than 100% total", async () => {
      const Token = await ethers.getContractFactory("CustomToken");
      usdc = await Token.deploy("USD TOKEN", "USD", uscDecimals);
      tst = await Token.deploy("Test TOKEN", "TST", tstDecimals);
      startTime = await time.latest();
      endTime = startTime + 259200;
      vesting = [
        { unlockTime: endTime + 2592000, unlockPercent: 1001111 },
        { unlockTime: endTime + 2592000 * 2, unlockPercent: 20000 },
        { unlockTime: endTime + 2592000 * 3, unlockPercent: 20000 },
        { unlockTime: endTime + 2592000 * 4, unlockPercent: 50000 },
      ];
      const Presale = await ethers.getContractFactory("ICO");
      await expect(Presale.deploy(
        startTime,
        endTime,
        tst.address,
        usdc.address,
        price,
        minAmount,
        maxAmount,
        vesting
      )).to.be.revertedWith("bad vesting rules");
    })

    it("Should be unable to set time before endTime", async () => {
      const Token = await ethers.getContractFactory("CustomToken");
      usdc = await Token.deploy("USD TOKEN", "USD", uscDecimals);
      tst = await Token.deploy("Test TOKEN", "TST", tstDecimals);
      startTime = await time.latest();
      endTime = startTime + 259200;
      vesting = [
        { unlockTime: endTime - 2592000, unlockPercent: 10000 },
        { unlockTime: endTime + 2592000 * 2, unlockPercent: 20000 },
        { unlockTime: endTime + 2592000 * 3, unlockPercent: 20000 },
        { unlockTime: endTime + 2592000 * 4, unlockPercent: 50000 },
      ];
      const Presale = await ethers.getContractFactory("ICO");
      await expect(Presale.deploy(
        startTime,
        endTime,
        tst.address,
        usdc.address,
        price,
        minAmount,
        maxAmount,
        vesting
      )).to.be.revertedWith("bad unlockTime");
    })
  })

  describe("Initialize", () => {
    it("Should be only callable by owner", async () => {
      await loadFixture(deployFixture);
      await tst.connect(accounts[0]).approve(presale.address, totalTST);
      await expect(
        presale.connect(accounts[0]).initialize(goal)
      ).to.be.revertedWith("not an admin");
    });

    it("Should be initialized correctly", async () => {
      await loadFixture(deployFixture);
      await tst.connect(owner).approve(presale.address, totalTST);
      await presale.initialize(goal);
      expect(await presale.startTime()).to.be.eq(startTime);
      expect(await presale.endTime()).to.be.eq(endTime);
      expect(await presale.price()).to.be.eq(price);
      expect(await presale.minAmount()).to.be.eq(minAmount);
      expect(await presale.maxAmount()).to.be.eq(maxAmount);
      expect(await presale.goal()).to.be.eq(goal);
      expect(await presale.totalUSDCAccumulated()).to.be.eq(0);
      expect(await presale.totalTSTSold()).to.be.eq(0);
      expect(await presale.usdc()).to.be.eq(usdc.address);
      expect(await presale.usdc()).to.be.eq(usdc.address);
      expect(await presale.tst()).to.be.eq(tst.address);
    });

    it("Should be unable to initialize twice", async () => {
      await loadFixture(deployInitFixture);
      await expect(presale.initialize(goal)).to.be.revertedWith(
        "already initialized"
      );
    });
  });

  describe("Buy Tokens", () => {
    it("Should buy tokens correctly", async () => {
      await loadFixture(deployInitFixture);
      const tstAmount = ethers.utils.parseUnits("100", tstDecimals);
      const usdcAmount = ethers.utils.parseUnits("200", uscDecimals);
      await usdc.connect(accounts[0]).approve(presale.address, usdcAmount);
      await presale.connect(accounts[0]).buyToken(tstAmount);
      expect((await presale.users(accounts[0].address)).bought).to.be.eq(
        tstAmount
      );
      expect(await usdc.balanceOf(presale.address)).to.be.eq(usdcAmount);
    });

    it.only("Should buy tokens only for whitelisted users", async () => {
      await loadFixture(deployInitFixture);
      const tstAmount = ethers.utils.parseUnits("100", tstDecimals);
      const usdcAmount = ethers.utils.parseUnits("200", uscDecimals);
      await usdc.connect(accounts[0]).approve(presale.address, usdcAmount);
      
      const whitelisted = accounts.slice(0, 2);
      const padBuffer = (addr) => {
        return Buffer.from(addr.substr(2).padStart(32 * 2, 0), "hex");
      };
  
      const leaves = whitelisted.map((account) => padBuffer(account.address));
      const tree = new MerkleTree(leaves, keccak256, { sort: true });
      const merkleRoot = tree.getHexRoot();

      await presale.setMerkleRoot(merkleRoot);

      const merkleProof = tree.getHexProof(padBuffer(whitelisted[0].address));
      const invalidMerkleProof = tree.getHexProof(
        padBuffer(accounts[4].address)
      );

      await expect(presale.connect(accounts[0]).buyTokenForWhitelistedUsers(tstAmount, merkleProof)).to.not.be.rejected;
      expect((await presale.users(accounts[0].address)).bought).to.be.eq(
        tstAmount
      );
      expect(await usdc.balanceOf(presale.address)).to.be.eq(usdcAmount);

      await expect(
        presale.connect(accounts[4]).buyTokenForWhitelistedUsers(tstAmount, invalidMerkleProof)
      ).to.be.rejectedWith("invalid merkle proof");
    });

    it("Should be able to buy tokens multiple times", async () => {
      
    });

    it("Should be unable to buy less then 10 tokens", async () => {
      
    });

    it("Should be unable to buy more than max amount", async () => {
     
    });

    it("Should be unable to buy more then 100 tokens", async () => {
     
    });

    it("Should be unable to buy tokens after endTime", async () => {
      
    });

    it("Should be unable to buy tokens before startTime", async () => {
      
    });
  });

  describe("Withdraw Tokens", () => {
    it("Should be unable to withdraw before vesting starts", async () => {
      
    });

    it("Should be unable to withdraw before endTime", async () => {
      
    });

    it("Should be unable to withdraw if has nothing to claim", async () => {
      
    });

    it("Should withdraw correctly 10%", async () => {
      
    });

    it("Should withdraw correctly 30%", async () => {
      
    });

    it("Should withdraw correctly 50%", async () => {
      
    });

    it("Should withdraw correctly 100%", async () => {
     
    });

    it("Should withdraw fully", async () => {
      
    });
  });
  describe("Withdraw USDC", () => {
    it("Should be unable to withdraw USDC before endTime", async () => {
     
    })

    it("Should only be called by an admin", async () => {
      
    })

    it("Should withdraw correctly", async () => {
      
    })

    it("Should withdraw correctly if 0 tokens were bought", async () => {
      
    })

    it("Should withdraw correctly if all tokens were bought ", async () => {
      
    })
  })
});
