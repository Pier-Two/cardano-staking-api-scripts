// Load environment variables
import * as dotenv from "dotenv";

// Load .env file from the current working directory
dotenv.config();

/**
 * Cardano network configuration
 */
export const cardanoNetwork = process.env.CARDANO_NETWORK || "preview"; // preview, preprod, mainnet

/**
 * API base URL for Cardano staking API
 */
export const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3000";

export const apiKey = process.env.API_KEY;

export function getApiKey(): string {
  if (!apiKey) {
    throw new Error("API_KEY environment variable is required");
  }
  return apiKey;
}

/**
 * Pier Two stake pool ID
 */
export const pierTwoPoolId =
  process.env.PIER_TWO_POOL_ID ||
  "pool1mhww3q6d7qssj5j2add05r7cyr7znyswe2g6vd23anpx5sh6z8d";
