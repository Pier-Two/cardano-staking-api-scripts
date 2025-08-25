#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import ora from "ora";
import { createApiClient } from "./helpers/create-api-client";
import { handleApiError } from "./helpers/handle-api-error";

const argv = yargs(hideBin(process.argv))
  .option("stake-address", {
    alias: "a",
    type: "string",
    description: "Stake address to add",
    demandOption: true,
  })
  .option("reference", {
    alias: "r",
    type: "string",
    description: "Reference/grouping for the stake account",
    demandOption: true,
  })
  .option("label", {
    alias: "l",
    type: "string",
    description: "Optional label for the stake account",
  })
  .help()
  .alias("help", "h")
  .parseSync();

async function addStakeAccount() {
  const spinner = ora(
    "Adding stake account...",
  ).start();

  try {

    const api = createApiClient();

    const response = await api.cardano.addCardanoStakeAccount(
      {
        stakeAccountAddress: argv["stake-address"],
        reference: argv.reference,
        label: argv.label,
      },
      {},
    );

    spinner.succeed("Stake account added successfully!");

    console.log("\n📋 Stake Account Details:");
    console.log(`   Stake Address: ${argv["stake-address"]}`);
    console.log(`   Address: ${response.data.stakeAccountAddress}`);
    console.log(`   Pool ID: ${response.data.poolId}`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Reference: ${response.data.reference}`);
    if (response.data.label) {
      console.log(`   Label: ${response.data.label}`);
    }
    console.log(`   Lovelace: ${response.data.lovelace}`);
    console.log(`   Performance (7d): ${response.data.performance7d}`);
    console.log(`   Performance (30d): ${response.data.performance30d}`);
    console.log(`   Performance (Total): ${response.data.performanceTotal}`);
  } catch (error) {
    spinner.fail("Failed to add stake account");
    handleApiError(error, "adding stake account");
    process.exit(1);
  }
}

addStakeAccount().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
