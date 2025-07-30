#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import ora from "ora";
import { createApiClient } from "./helpers/create-api-client";
import { handleApiError } from "./helpers/handle-api-error";
import {
  isValidCardanoAddress,
  isValidPoolId,
  formatAdaAmount,
} from "./helpers/cardano-tx";
import { pierTwoPoolId } from "./helpers/config";

const argv = yargs(hideBin(process.argv))
  .option("stake-address", {
    alias: "s",
    type: "string",
    description: "Cardano stake address to register",
    demandOption: true,
  })
  .option("pool-id", {
    alias: "p",
    type: "string",
    description: "Stake pool ID to delegate to (defaults to Pier Two pool)",
    default: pierTwoPoolId,
  })
  .option("payment-address", {
    alias: "a",
    type: "string",
    description:
      "Payment address for UTXO selection (optional, defaults to reward address)",
  })
  .help()
  .alias("help", "h")
  .parseSync();

async function registerStakeAddress() {
  const spinner = ora(
    "Crafting stake address registration transaction...",
  ).start();

  try {
    // Validate addresses
    if (!isValidCardanoAddress(argv.stakeAddress)) {
      throw new Error("Invalid Cardano stake address format");
    }

    if (!isValidPoolId(argv.poolId)) {
      throw new Error("Invalid pool ID format");
    }

    if (argv.paymentAddress && !isValidCardanoAddress(argv.paymentAddress)) {
      throw new Error("Invalid payment address format");
    }

    const api = createApiClient();

    const response = await api.cardano.craftCardanoRegisterStakeAddressTx(
      {
        stakeAddress: argv.stakeAddress,
        poolId: argv.poolId,
        paymentAddress: argv.paymentAddress,
      },
      {},
    );

    spinner.succeed("Transaction crafted successfully!");

    console.log("\n📋 Transaction Details:");
    console.log(`   Fee: ${formatAdaAmount(response.data.fee)}`);
    console.log(`   Transaction Size: ${response.data.txSize} bytes`);
    console.log(
      `   Minimum Required ADA: ${formatAdaAmount(response.data.minRequiredAda)}`,
    );
    console.log(`   UTXOs In: ${response.data.utxosIn.length}`);
    console.log(`   UTXOs Out: ${response.data.utxosOut.length}`);

    console.log("\n🔧 Next Steps:");
    console.log("1. Sign the unsigned transaction using your wallet:");
    console.log(`   Unsigned Transaction (CBOR): ${response.data.unsignedTx}`);
    console.log("\n2. Submit the signed transaction to the Cardano network");
    console.log("\n3. Wait for confirmation (typically 1-2 epochs)");

    console.log("\n⚠️  Important Notes:");
    console.log("- Keep your private keys secure");
    console.log(
      "- The transaction fee will be deducted from your payment address",
    );
    console.log(
      "- Stake address registration requires a deposit of 2 ADA (refundable)",
    );
  } catch (error) {
    spinner.fail("Failed to craft transaction");
    handleApiError(error, "crafting stake address registration transaction");
    process.exit(1);
  }
}

registerStakeAddress().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
