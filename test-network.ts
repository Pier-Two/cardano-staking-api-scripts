#!/usr/bin/env node

import * as dotenv from "dotenv";
import { getCardanoNetwork, getCardanoNetworkSync } from "./helpers/config";

// Load environment variables
dotenv.config();

async function testNetworkConfig() {
  try {
    console.log("🌐 Testing network configuration fetching...");
    
    // Test synchronous fallback
    console.log("\n📋 Synchronous fallback network:");
    const syncNetwork = getCardanoNetworkSync();
    console.log(`   Network: ${syncNetwork}`);
    
    // Test async API fetch
    console.log("\n🔗 Fetching network from API...");
    const apiNetwork = await getCardanoNetwork();
    console.log(`   Network from API: ${apiNetwork}`);
    
    // Compare results
    if (syncNetwork === apiNetwork) {
      console.log("\n✅ Network configurations match!");
    } else {
      console.log("\n⚠️  Network configurations differ:");
      console.log(`   Fallback: ${syncNetwork}`);
      console.log(`   API: ${apiNetwork}`);
    }
    
    console.log("\n🎉 Network configuration test completed successfully!");
    
  } catch (error) {
    console.error("❌ Network configuration test failed:", error);
    process.exit(1);
  }
}

testNetworkConfig().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
}); 