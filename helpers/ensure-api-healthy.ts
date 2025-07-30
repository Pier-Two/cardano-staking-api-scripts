import ora from "ora";
import { PierTwoStakingApi } from "@pier_two/staking-ts";
import { apiBaseUrl, apiKey } from "./config";

// Initialize the API client
const api = new PierTwoStakingApi({
  baseUrl: apiBaseUrl,
  apiKey,
});

/**
 * Ensure the API server is running and healthy before proceeding with script execution
 * @returns A promise that resolves if the server is healthy, or rejects if it's not
 */
export const ensureApiHealthy = async (): Promise<void> => {
  const spinner = ora("Checking API server health").start();

  try {
    await api.request({
      path: "/health",
      method: "GET",
    });
    spinner.succeed("API server is healthy");
  } catch (error) {
    spinner.fail("API server health check failed");
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
};
