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
import { pierTwoPoolId, getBlockfrostApiKey, getCardanoMnemonic } from "./helpers/config";
import { signAndSubmitTransaction, getTransactionStatus } from "./helpers/mesh-sdk";

const argv = yargs(hideBin(process.argv))
  .option("stake-address", {
    alias: "s",
    type: "string",
    description: "Cardano stake address to delegate",
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
  .option("sign-and-submit", {
    alias: "s",
    type: "boolean",
    description: "Sign and submit the transaction automatically",
    default: false,
  })
  .option("wait-confirmation", {
    alias: "w",
    type: "boolean",
    description: "Wait for transaction confirmation",
    default: false,
  })
  .help()
  .alias("help", "h")
  .parseSync();

async function delegateStake() {
  const spinner = ora("Crafting stake delegation transaction...").start();

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

    const response = await api.cardano.craftCardanoDelegateStakeTx(
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

    if (argv.signAndSubmit) {
      spinner.text = "Signing and submitting transaction...";
      
      try {
        const blockfrostApiKey = getBlockfrostApiKey();
        const mnemonic = getCardanoMnemonic();
        
        const txHash = await signAndSubmitTransaction(
          response.data.unsignedTx,
          mnemonic,
          blockfrostApiKey
        );
        
        spinner.succeed("Transaction signed and submitted successfully!");
        console.log(`\n✅ Transaction Hash: ${txHash}`);
        
        if (argv.waitConfirmation) {
          spinner.text = "Waiting for transaction confirmation...";
          
          // Wait for confirmation (simplified for now)
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const status = await getTransactionStatus(txHash, blockfrostApiKey);
          if (status.confirmed) {
            spinner.succeed("Transaction confirmed!");
            console.log(`   Block Height: ${status.blockHeight}`);
          } else {
            spinner.warn("Transaction submitted but not yet confirmed");
            console.log("   Check the transaction hash on a Cardano explorer");
          }
        }
      } catch (error) {
        spinner.fail("Failed to sign and submit transaction");
        handleApiError(error, "signing and submitting transaction");
        process.exit(1);
      }
    } else {
      console.log("\n🔧 Next Steps:");
      console.log("1. Sign the unsigned transaction using your wallet:");
      console.log(`   Unsigned Transaction (CBOR): ${response.data.unsignedTx}`);
      console.log("\n2. Submit the signed transaction to the Cardano network");
      console.log("\n3. Wait for confirmation (typically 1-2 epochs)");
    }

    console.log("\n⚠️  Important Notes:");
    console.log("- Keep your private keys secure");
    console.log(
      "- The transaction fee will be deducted from your payment address",
    );
    console.log("- Delegation will take effect in the next epoch");
    console.log("- You can change delegation at any time");
  } catch (error) {
    spinner.fail("Failed to craft transaction");
    handleApiError(error, "crafting stake delegation transaction");
    process.exit(1);
  }
}

delegateStake().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
