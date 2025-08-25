#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import ora from "ora";
import { createApiClient } from "./helpers/create-api-client";
import { handleApiError } from "./helpers/handle-api-error";
import { formatAdaAmount } from "./helpers/cardano-tx";
import { getBlockfrostApiKey, getCardanoMnemonic } from "./helpers/config";
import {
  signAndSubmitTransactionCSL,
  getTransactionStatusCSL,
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

async function registerStakeAddress() {
  const spinner = ora(
    "Deriving addresses and crafting stake address registration transaction...",
  ).start();

  try {
    // Derive addresses from mnemonic using the address index
    const mnemonic = getCardanoMnemonic();
    const { paymentAddress, stakeAddress, paymentKey } =
      await derivePrivateKeyAndAddressesFromMnemonic(
        mnemonic,
        argv.addressIndex,
      );

    spinner.text = "Crafting stake address registration transaction...";

    const api = createApiClient();

    const response = await api.cardano.craftCardanoRegisterStakeAddressTx(
      {
        stakeAddress: stakeAddress,
        utxoAddress: paymentAddress,
      },
      {},
    );

    // deserialize the transaction
    deserializeAndLogTransactionCbor(response.data.unsignedTx);

    spinner.succeed("Transaction crafted successfully!");

    console.log("\n📋 Transaction Details:");
    console.log(`   Stake Address: ${stakeAddress}`);
    console.log(`   Payment Address: ${paymentAddress}`);
    console.log(`   Pool ID: ${argv.poolId}`);
    console.log(`   Fee: ${formatAdaAmount(response.data.fee)}`);
    console.log(`   UTXOs In: ${response.data.utxosIn.length}`);
    console.log(`   UTXOs Out: ${response.data.utxosOut.length}`);

    if (argv.signAndSubmit) {
      spinner.text = "Signing and submitting transaction...";

      try {
        const blockfrostApiKey = getBlockfrostApiKey();

        const txHash = await signAndSubmitTransactionCSL(
          response.data.unsignedTx,
          // only require signature from payment address since we are spending a utxo from it
          [paymentKey],
          blockfrostApiKey,
        );

        spinner.succeed("Transaction signed and submitted successfully!");
        console.log(`\n✅ Transaction Hash: ${txHash}`);

        if (argv.waitConfirmation) {
          spinner.text = "Waiting for transaction confirmation...";

          // Wait for confirmation (simplified for now)
          await new Promise((resolve) => setTimeout(resolve, 5000));

          const status = await getTransactionStatusCSL(
            txHash,
            blockfrostApiKey,
          );
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
