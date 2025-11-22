const hre = require("hardhat");
require("dotenv/config");

async function main() {
  console.log("🚀 Deploying PayPerPost contract to Base Sepolia...\n");

  // Contract parameters
  const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS;
  const PLATFORM_FEE = 100; // 1% (100 basis points)

  if (!PLATFORM_WALLET) {
    console.error("❌ Error: PLATFORM_WALLET_ADDRESS not set in .env");
    process.exit(1);
  }

  console.log("Configuration:");
  console.log("- USDC Address:", USDC_ADDRESS);
  console.log("- Platform Wallet:", PLATFORM_WALLET);
  console.log("- Platform Fee:", PLATFORM_FEE / 100, "%\n");

  // Deploy contract
  console.log("Deploying contract...");
  const PayPerPost = await hre.ethers.getContractFactory("PayPerPost");
  const contract = await PayPerPost.deploy(
    USDC_ADDRESS,
    PLATFORM_WALLET,
    PLATFORM_FEE
  );

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("✅ PayPerPost deployed to:", contractAddress);
  console.log("\n📝 Save this address to your .env file:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS="${contractAddress}"`);

  console.log("\n⏳ Waiting for 5 block confirmations...");
  await contract.deploymentTransaction().wait(5);

  console.log("\n🔍 Verifying contract on BaseScan...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [USDC_ADDRESS, PLATFORM_WALLET, PLATFORM_FEE],
    });
    console.log("✅ Contract verified on BaseScan!");
  } catch (error) {
    console.log("❌ Verification failed:", error.message);
    console.log("You can verify manually later with:");
    console.log(`npx hardhat verify --network baseSepolia ${contractAddress} ${USDC_ADDRESS} ${PLATFORM_WALLET} ${PLATFORM_FEE}`);
  }

  console.log("\n🎉 Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Add contract address to .env.local");
  console.log("2. Update x402 middleware to use contract address");
  console.log("3. Test contract integration");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
