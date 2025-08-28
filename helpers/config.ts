// Load environment variables
import * as dotenv from "dotenv";
import { createApiClient } from "./create-api-client";

// Load .env file from the current working directory
dotenv.config();

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

/**
 * Cardano mnemonic/seed phrase for wallet creation
 */
export const cardanoMnemonic = process.env.CARDANO_MNEMONIC;

/**
 * Cardano private key for transaction signing (legacy support)
 */
export const cardanoPrivateKey = process.env.CARDANO_PRIVATE_KEY;

/**
 * Fallback Cardano network configuration (used if API is unavailable)
 */
export const fallbackCardanoNetwork = process.env.CARDANO_NETWORK || "preprod";

/**
 * Get Cardano network from API or fallback to environment variable
 */
export async function getCardanoNetwork(): Promise<string> {
  const api = createApiClient();
  const response = await api.public.networkConfig();
  return response.data.cardano.network;
}

export function getCardanoMnemonic(): string {
  if (!cardanoMnemonic) {
    throw new Error("CARDANO_MNEMONIC environment variable is required");
  }
  return cardanoMnemonic;
}