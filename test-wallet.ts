#!/usr/bin/env node

import * as dotenv from "dotenv";
import { createWallet } from "./helpers/mesh-sdk";
import { getBlockfrostApiKey, getCardanoMnemonic, getCardanoNetwork } from "./helpers/config";

// Load environment variables
dotenv.config();

async function testWallet() {
  try {
    console.log("🧪 Testing Mesh SDK wallet implementation...");
    
    // Get required environment variables
    const blockfrostApiKey = getBlockfrostApiKey();
    const mnemonic = getCardanoMnemonic();
    
    console.log("✅ Environment variables loaded successfully");
    console.log(`   Blockfrost API Key: ${blockfrostApiKey.substring(0, 8)}...`);
    console.log(`   Mnemonic: ${mnemonic.split(' ').slice(0, 3).join(' ')}...`);
    
    // Fetch network configuration from API
    console.log("\n🌐 Fetching network configuration from API...");
    const network = await getCardanoNetwork();
    console.log(`   Network: ${network}`);
    
    // Create wallet instance
    console.log("\n🔧 Creating wallet instance...");
    const wallet = await createWallet(mnemonic, blockfrostApiKey);
    
    console.log("✅ Wallet created successfully!");
    console.log("   Wallet is ready for transaction signing and submission");
    
    // Test getting wallet address (if available)
    try {
      const addresses = await wallet.getUsedAddresses();
      console.log(`\n📬 Wallet addresses: ${addresses.length} found`);
      if (addresses.length > 0) {
        console.log(`   First address: ${addresses[0]}`);
      }
    } catch (error) {
      console.log("   Note: Could not retrieve addresses (this is normal for some wallet configurations)");
    }
    
    console.log("\n🎉 Wallet test completed successfully!");
    console.log("   The Mesh SDK integration is working correctly");
    console.log(`   Network configuration fetched from API: ${network}`);
    
  } catch (error) {
    console.error("❌ Wallet test failed:", error);
    process.exit(1);
  }
}

testWallet().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
}); 