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
  const spinner = ora(
    "Deriving addresses and crafting stake delegation transaction...",
  ).start();

  try {
    // Derive addresses from mnemonic using the address index
    const mnemonic = getCardanoMnemonic();
    const { paymentAddress, stakeAddress, stakeKey, paymentKey } =
      await derivePrivateKeyAndAddressesFromMnemonic(
        mnemonic,
        argv.addressIndex,
      );

    spinner.text = "Crafting stake delegation transaction...";

    const api = createApiClient();

    const response = await api.cardano.craftCardanoDelegateStakeTx(
      {
        stakeAddress: stakeAddress,
        utxoAddress: paymentAddress,
        reference: "Test Fund",
        label: "Test Stake",
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
        // First, sign the transaction
        const signedTxHex = await signTransactionWithKeysCSL(
          response.data.unsignedTx,
          [stakeKey, paymentKey], // requires signatures from both since we are spending utxos from the payment address
        );

        spinner.text = "Submitting signed transaction...";

        // Then, submit the signed transaction via Pier Two API
        const txHash = await api.cardano.submitCardanoTransaction({
          signedTx: signedTxHex,
        });

        spinner.succeed("Transaction signed and submitted successfully!");
        console.log(
          `\n✅ Transaction Hash: ${JSON.stringify(txHash.data, null, 2)}`,
        );

        if (argv.waitConfirmation) {
          spinner.text = "Waiting for transaction confirmation...";

          // Wait for confirmation (simplified for now)
          await new Promise((resolve) => setTimeout(resolve, 5000));

          try {
            const status = await api.cardano.getCardanoTransactionStatus(
              txHash.data.txHash,
            );
            if (status.data.block) {
              spinner.succeed("Transaction confirmed!");
              console.log(`   Block Height: ${status.data.block}`);
              console.log(`   Block Time: ${status.data.blockTime}`);
              console.log(`   Slot: ${status.data.slot}`);
              console.log(`   Fees: ${status.data.fees} lovelace`);
            } else {
              spinner.warn("Transaction submitted but not yet confirmed");
              console.log(
                "   Check the transaction hash on a Cardano explorer",
              );
            }
            // eslint-disable-next-line
          } catch (error: any) {
            spinner.warn(
              `Could not check transaction status: ${error.message}`,
            );
            console.log(
              "   Check the transaction hash on a Cardano explorer for status",
            );
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
