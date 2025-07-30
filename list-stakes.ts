#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import ora from "ora";
import { createApiClient } from "./helpers/create-api-client";
import { handleApiError } from "./helpers/handle-api-error";
import { formatAdaAmount, formatPerformance } from "./helpers/cardano-tx";

const argv = yargs(hideBin(process.argv))
  .option("page-number", {
    alias: "p",
    type: "number",
    description: "Page number for pagination",
    default: 1,
  })
  .option("page-size", {
    alias: "s",
    type: "number",
    description: "Number of items per page",
    default: 10,
  })
  .help()
  .alias("help", "h")
  .parseSync();

async function listStakes() {
  const spinner = ora("Fetching stake accounts...").start();

  try {
    const api = createApiClient();

    const response = await api.cardano.getCardanoStakes(
      {
        pageNumber: argv.pageNumber,
        pageSize: argv.pageSize,
      },
      {},
    );

    spinner.succeed(`Found ${response.pagination.totalCount} stake accounts`);

    if (response.data.length === 0) {
      console.log("\n📭 No stake accounts found.");
      return;
    }

    console.log("\n📋 Stake Accounts:");
    console.log("=".repeat(120));

    response.data.forEach((stake, index) => {
      console.log(`\n${index + 1}. Stake Account Details:`);
      console.log(`   Address: ${stake.stakeAccountAddress}`);
      console.log(`   Pool ID: ${stake.poolId}`);
      console.log(`   Status: ${stake.status}`);
      console.log(`   Reference: ${stake.reference}`);
      if (stake.label) {
        console.log(`   Label: ${stake.label}`);
      }
      console.log(`   Lovelace: ${formatAdaAmount(stake.lovelace)}`);
      console.log(
        `   Withdrawable: ${formatAdaAmount(stake.withdrawableAmount)}`,
      );
      console.log(
        `   Total Withdrawals: ${formatAdaAmount(stake.totalWithdrawals)}`,
      );
      console.log(
        `   Performance (7d): ${formatPerformance(stake.performance7d)}`,
      );
      console.log(
        `   Performance (30d): ${formatPerformance(stake.performance30d)}`,
      );
      console.log(
        `   Performance (Total): ${formatPerformance(stake.performanceTotal)}`,
      );
      console.log(`   Activation Epoch: ${stake.activationEpoch}`);
      console.log(`   Last Sync Epoch: ${stake.lastSyncEpoch}`);
      if (stake.drepId) {
        console.log(`   DRep ID: ${stake.drepId}`);
      }
    });

    // Pagination info
    if (response.pagination.totalCount > argv.pageSize) {
      console.log("\n📄 Pagination:");
      console.log(
        `   Page ${response.pagination.pageNumber} of ${Math.ceil(response.pagination.totalCount / response.pagination.pageSize)}`,
      );
      console.log(
        `   Showing ${response.data.length} of ${response.pagination.totalCount} total accounts`,
      );
    }
  } catch (error) {
    spinner.fail("Failed to fetch stake accounts");
    handleApiError(error, "fetching stake accounts");
    process.exit(1);
  }
}

listStakes().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
