#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import ora from "ora";
import { createApiClient } from "./helpers/create-api-client";
import { handleApiError } from "./helpers/handle-api-error";
import { formatAdaAmount } from "./helpers/cardano-tx";
import { getCardanoMnemonic } from "./helpers/config";
import {
  signTransactionWithKeysCSL,
  derivePrivateKeyAndAddressesFromMnemonic,
  deserializeAndLogTransactionCbor,
} from "./helpers/csl-sdk";

const argv = yargs(hideBin(process.argv))
  .option("address-index", {
    alias: "i",
    type: "number",
    description: "Address index to derive stake and payment addresses from",
    demandOption: true,
  })
  .option("amount", {
    alias: "a",
    type: "string",
    description: "Amount to withdraw in lovelace (1 ADA = 1,000,000 lovelace)",
    demandOption: true,
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

async function withdrawStakeRewards() {
  const spinner = ora(
    "Deriving addresses and crafting stake rewards withdrawal transaction...",
  ).start();

  try {
    // Validate amount
    const amountLovelace = parseInt(argv.amount);
    if (isNaN(amountLovelace) || amountLovelace <= 0) {
      throw new Error("Amount must be a positive number in lovelace");
    }

    // Derive addresses from mnemonic using the address index
    const mnemonic = getCardanoMnemonic();
    const { paymentAddress, stakeAddress, stakeKey, paymentKey } =
      await derivePrivateKeyAndAddressesFromMnemonic(
        mnemonic,
        argv.addressIndex,
      );

    spinner.text = "Crafting stake rewards withdrawal transaction...";

    const api = createApiClient();

    const response = await api.cardano.craftCardanoStakingRewardsWithdrawalTx(
      {
        stakeAddress: stakeAddress,
        utxoAddress: paymentAddress,
        amountLovelace: argv.amount,
      },
      {},
    );

    // deserialize the transaction
    deserializeAndLogTransactionCbor(response.data.unsignedTx);

    spinner.succeed("Transaction crafted successfully!");

    console.log("\n📋 Transaction Details:");
    console.log(`   Stake Address: ${stakeAddress}`);
    console.log(`   Payment Address: ${paymentAddress}`);
    console.log(
      `   Withdrawal Amount: ${formatAdaAmount(amountLovelace.toString())} (${amountLovelace} lovelace)`,
    );
    console.log(`   Fee: ${formatAdaAmount(response.data.fee)}`);
    console.log(`   UTXOs In: ${response.data.utxosIn.length}`);
    console.log(`   UTXOs Out: ${response.data.utxosOut.length}`);

    if (argv.signAndSubmit) {
      spinner.text = "Signing and submitting transaction...";

      try {
        // First, sign the transaction
        const signedTxHex = await signTransactionWithKeysCSL(
          response.data.unsignedTx,
          [paymentKey, stakeKey], // Require signatures from both payment and stake keys for withdrawal
        );

        spinner.text = "Submitting signed transaction...";

        // Then, submit the signed transaction via Pier Two API
        const txHash = await api.cardano.submitCardanoTransaction({
          signedTx: signedTxHex,
        });

        spinner.succeed("Transaction signed and submitted successfully!");
        console.log(`\n✅ Transaction Hash: ${txHash.data.txHash}`);

        if (argv.waitConfirmation) {
          spinner.text = "Waiting for transaction confirmation...";

          // Wait for confirmation (simplified for now)
          await new Promise((resolve) => setTimeout(resolve, 5000));

          try {
            const status = await api.cardano.getCardanoTransactionStatus(txHash.data.txHash);
            if (status.data.block) {
              spinner.succeed("Transaction confirmed!");
              console.log(`   Block Height: ${status.data.block}`);
              console.log(`   Block Time: ${status.data.blockTime}`);
              console.log(`   Slot: ${status.data.slot}`);
              console.log(`   Fees: ${status.data.fees} lovelace`);
            } else {
              spinner.warn("Transaction submitted but not yet confirmed");
              console.log("   Check the transaction hash on a Cardano explorer");
            }
          } catch (error) {
            spinner.warn("Could not check transaction status");
            console.log("   Check the transaction hash on a Cardano explorer for status");
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
      console.log(
        `   Unsigned Transaction (CBOR): ${response.data.unsignedTx}`,
      );
      console.log("\n2. Submit the signed transaction to the Cardano network");
      console.log("\n3. Wait for confirmation (typically 1-2 epochs)");
    }

    console.log("\n⚠️  Important Notes:");
    console.log("- Keep your private keys secure");
    console.log(
      "- The transaction fee will be deducted from your payment address",
    );
    console.log("- Withdrawal amount will be sent to your payment address");
    console.log(
      "- Only withdraw rewards that have been earned and are available",
    );
    console.log("- Withdrawals are processed at the end of each epoch");
  } catch (error) {
    spinner.fail("Failed to craft transaction");
    handleApiError(error, "crafting stake rewards withdrawal transaction");
    process.exit(1);
  }
}

withdrawStakeRewards().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
