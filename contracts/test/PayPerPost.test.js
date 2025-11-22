const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PayPerPost", function () {
  let payPerPost;
  let usdcToken;
  let owner;
  let platformWallet;
  let creator;
  let user;

  const INITIAL_FEE = 100; // 1%
  const POST_PRICE = ethers.parseUnits("0.05", 6); // $0.05 USDC

  beforeEach(async function () {
    [owner, platformWallet, creator, user] = await ethers.getSigners();

    // Deploy mock USDC token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdcToken = await MockERC20.deploy("USD Coin", "USDC", 6);

    // Deploy PayPerPost contract
    const PayPerPost = await ethers.getContractFactory("PayPerPost");
    payPerPost = await PayPerPost.deploy(
      await usdcToken.getAddress(),
      platformWallet.address,
      INITIAL_FEE
    );

    // Mint USDC to contract (simulating x402 payments)
    await usdcToken.mint(await payPerPost.getAddress(), ethers.parseUnits("100", 6));
  });

  describe("Deployment", function () {
    it("Should set the correct USDC token", async function () {
      expect(await payPerPost.usdcToken()).to.equal(await usdcToken.getAddress());
    });

    it("Should set the correct platform wallet", async function () {
      expect(await payPerPost.platformWallet()).to.equal(platformWallet.address);
    });

    it("Should set the correct platform fee", async function () {
      expect(await payPerPost.platformFeePercentage()).to.equal(INITIAL_FEE);
    });

    it("Should set the deployer as owner", async function () {
      expect(await payPerPost.owner()).to.equal(owner.address);
    });
  });

  describe("Post Registration", function () {
    it("Should allow anyone to register a post", async function () {
      await payPerPost.connect(creator).registerPost("post-1", creator.address);
      expect(await payPerPost.postCreators("post-1")).to.equal(creator.address);
    });

    it("Should emit PostRegistered event", async function () {
      await expect(payPerPost.connect(creator).registerPost("post-1", creator.address))
        .to.emit(payPerPost, "PostRegistered")
        .withArgs("post-1", creator.address, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
    });

    it("Should revert if post ID is empty", async function () {
      await expect(
        payPerPost.registerPost("", creator.address)
      ).to.be.revertedWithCustomError(payPerPost, "InvalidPostId");
    });

    it("Should revert if creator address is zero", async function () {
      await expect(
        payPerPost.registerPost("post-1", ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(payPerPost, "InvalidAddress");
    });

    it("Should revert if post already registered", async function () {
      await payPerPost.registerPost("post-1", creator.address);

      await expect(
        payPerPost.registerPost("post-1", creator.address)
      ).to.be.revertedWithCustomError(payPerPost, "PostAlreadyRegistered");
    });
  });

  describe("Payment Recording", function () {
    beforeEach(async function () {
      await payPerPost.connect(creator).registerPost("post-1", creator.address);
    });

    it("Should allow owner to record payment", async function () {
      await payPerPost.recordPayment("post-1", POST_PRICE);

      expect(await payPerPost.creatorEarnings(creator.address)).to.equal(POST_PRICE);
      expect(await payPerPost.postEarnings("post-1")).to.equal(POST_PRICE);
    });

    it("Should emit PaymentReceived event", async function () {
      await expect(payPerPost.recordPayment("post-1", POST_PRICE))
        .to.emit(payPerPost, "PaymentReceived")
        .withArgs("post-1", creator.address, POST_PRICE, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
    });

    it("Should revert if post not registered", async function () {
      await expect(
        payPerPost.recordPayment("post-999", POST_PRICE)
      ).to.be.revertedWithCustomError(payPerPost, "InvalidPostId");
    });

    it("Should revert if not called by owner", async function () {
      await expect(
        payPerPost.connect(user).recordPayment("post-1", POST_PRICE)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should accumulate multiple payments", async function () {
      await payPerPost.recordPayment("post-1", POST_PRICE);
      await payPerPost.recordPayment("post-1", POST_PRICE);

      expect(await payPerPost.creatorEarnings(creator.address)).to.equal(POST_PRICE * BigInt(2));
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      await payPerPost.connect(creator).registerPost("post-1", creator.address);
      await payPerPost.recordPayment("post-1", POST_PRICE);
    });

    it("Should allow creator to withdraw earnings", async function () {
      const balanceBefore = await usdcToken.balanceOf(creator.address);

      await payPerPost.connect(creator).withdraw();

      const balanceAfter = await usdcToken.balanceOf(creator.address);
      const platformFee = (POST_PRICE * BigInt(INITIAL_FEE)) / BigInt(10000);
      const netAmount = POST_PRICE - platformFee;

      expect(balanceAfter - balanceBefore).to.equal(netAmount);
    });

    it("Should transfer platform fee correctly", async function () {
      const balanceBefore = await usdcToken.balanceOf(platformWallet.address);

      await payPerPost.connect(creator).withdraw();

      const balanceAfter = await usdcToken.balanceOf(platformWallet.address);
      const platformFee = (POST_PRICE * BigInt(INITIAL_FEE)) / BigInt(10000);

      expect(balanceAfter - balanceBefore).to.equal(platformFee);
    });

    it("Should emit WithdrawalMade event", async function () {
      const platformFee = (POST_PRICE * BigInt(INITIAL_FEE)) / BigInt(10000);
      const netAmount = POST_PRICE - platformFee;

      await expect(payPerPost.connect(creator).withdraw())
        .to.emit(payPerPost, "WithdrawalMade")
        .withArgs(
          creator.address,
          POST_PRICE,
          platformFee,
          netAmount,
          await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)
        );
    });

    it("Should update withdrawn amount", async function () {
      await payPerPost.connect(creator).withdraw();

      expect(await payPerPost.creatorWithdrawn(creator.address)).to.equal(POST_PRICE);
    });

    it("Should revert if no earnings available", async function () {
      await expect(
        payPerPost.connect(user).withdraw()
      ).to.be.revertedWithCustomError(payPerPost, "InsufficientEarnings");
    });

    it("Should revert if trying to withdraw twice", async function () {
      await payPerPost.connect(creator).withdraw();

      await expect(
        payPerPost.connect(creator).withdraw()
      ).to.be.revertedWithCustomError(payPerPost, "InsufficientEarnings");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await payPerPost.connect(creator).registerPost("post-1", creator.address);
      await payPerPost.recordPayment("post-1", POST_PRICE);
    });

    it("Should return correct creator stats", async function () {
      const [total, withdrawn, available] = await payPerPost.getCreatorStats(creator.address);

      expect(total).to.equal(POST_PRICE);
      expect(withdrawn).to.equal(0);
      expect(available).to.equal(POST_PRICE);
    });

    it("Should return correct post earnings", async function () {
      expect(await payPerPost.getPostEarnings("post-1")).to.equal(POST_PRICE);
    });

    it("Should check if post is registered", async function () {
      expect(await payPerPost.isPostRegistered("post-1")).to.be.true;
      expect(await payPerPost.isPostRegistered("post-999")).to.be.false;
    });

    it("Should return correct post creator", async function () {
      expect(await payPerPost.getPostCreator("post-1")).to.equal(creator.address);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      await payPerPost.updatePlatformFee(200); // 2%
      expect(await payPerPost.platformFeePercentage()).to.equal(200);
    });

    it("Should emit PlatformFeeUpdated event", async function () {
      await expect(payPerPost.updatePlatformFee(200))
        .to.emit(payPerPost, "PlatformFeeUpdated")
        .withArgs(INITIAL_FEE, 200);
    });

    it("Should revert if fee > 10%", async function () {
      await expect(
        payPerPost.updatePlatformFee(1001)
      ).to.be.revertedWithCustomError(payPerPost, "InvalidFeePercentage");
    });

    it("Should allow owner to update platform wallet", async function () {
      await payPerPost.updatePlatformWallet(user.address);
      expect(await payPerPost.platformWallet()).to.equal(user.address);
    });

    it("Should emit PlatformWalletUpdated event", async function () {
      await expect(payPerPost.updatePlatformWallet(user.address))
        .to.emit(payPerPost, "PlatformWalletUpdated")
        .withArgs(platformWallet.address, user.address);
    });

    it("Should allow owner to pause", async function () {
      await payPerPost.pause();
      expect(await payPerPost.paused()).to.be.true;
    });

    it("Should allow owner to unpause", async function () {
      await payPerPost.pause();
      await payPerPost.unpause();
      expect(await payPerPost.paused()).to.be.false;
    });

    it("Should prevent operations when paused", async function () {
      await payPerPost.pause();

      await expect(
        payPerPost.registerPost("post-2", creator.address)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow emergency withdraw when paused", async function () {
      await payPerPost.pause();

      const amount = ethers.parseUnits("10", 6);
      const balanceBefore = await usdcToken.balanceOf(owner.address);

      await payPerPost.emergencyWithdraw(amount);

      const balanceAfter = await usdcToken.balanceOf(owner.address);
      expect(balanceAfter - balanceBefore).to.equal(amount);
    });
  });
});
