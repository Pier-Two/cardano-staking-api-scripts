#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import ora from "ora";
import { getCardanoMnemonic } from "./helpers/config";
import { derivePrivateKeyAndAddressesFromMnemonic } from "./helpers/csl-sdk";

const argv = yargs(hideBin(process.argv))
  .option("address-index", {
    alias: "i",
    type: "number",
    description: "Address index to derive addresses from",
    demandOption: true,
  })
  .help()
  .alias("help", "h")
  .parseSync();

async function listAddresses() {
  const spinner = ora(`Deriving addresses for index ${argv.addressIndex}...`).start();

  try {
    // Derive addresses from mnemonic using the address index
    const mnemonic = getCardanoMnemonic();
    const { paymentAddress, stakeAddress } = await derivePrivateKeyAndAddressesFromMnemonic(
      mnemonic,
      argv.addressIndex
    );

    spinner.succeed(`Addresses derived successfully for index ${argv.addressIndex}`);

    console.log("\n📋 Address Details:");
    console.log("=".repeat(80));
    console.log(`   Address Index: ${argv.addressIndex}`);
    console.log(`   Payment Address: ${paymentAddress}`);
    console.log(`   Stake Address: ${stakeAddress}`);
    console.log("\n🔗 Derivation Paths:");
    console.log(`   Payment: m/1852'/1815'/0'/0/${argv.addressIndex}`);
    console.log(`   Stake: m/1852'/1815'/0'/2/0`);
    console.log("\n💡 Usage Examples:");
    console.log(`   # Delegate stake using these addresses:`);
    console.log(`   pnpm delegate-stake --address-index ${argv.addressIndex}`);
    console.log(`   # Register stake address:`);
    console.log(`   pnpm register-stake-address --address-index ${argv.addressIndex}`);
    console.log(`   # Register and delegate:`);
    console.log(`   pnpm register-and-delegate --address-index ${argv.addressIndex}`);
    console.log(`   # Add stake account:`);
    console.log(`   pnpm add-stake-account --address-index ${argv.addressIndex} --reference "My Fund"`);

  } catch (error) {
    spinner.fail("Failed to derive addresses");
    console.error("Error:", error);
    process.exit(1);
  }
}

listAddresses().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
