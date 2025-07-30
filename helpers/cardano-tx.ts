import { cardanoNetwork } from "./config";

/**
 * Validate a Cardano address
 */
export function isValidCardanoAddress(address: string): boolean {
  // Basic Cardano address validation
  const stakeAddressRegex = /^stake1[a-z0-9]{103}$/;
  const paymentAddressRegex = /^addr1[a-z0-9]{98}$/;

  return stakeAddressRegex.test(address) || paymentAddressRegex.test(address);
}

/**
 * Validate a Cardano stake pool ID
 */
export function isValidPoolId(poolId: string): boolean {
  // Cardano pool ID validation (hex string of 56 characters)
  const poolIdRegex = /^[0-9a-f]{56}$/;
  return poolIdRegex.test(poolId);
}

/**
 * Get the Cardano network configuration
 */
export function getCardanoNetwork() {
  return cardanoNetwork === "mainnet" ? "mainnet" : "preview";
}

/**
 * Format ADA amount from lovelace to ADA
 */
export function formatAdaAmount(lovelace: string): string {
  const ada = parseInt(lovelace) / 1000000;
  return `${ada.toLocaleString()} ADA`;
}

/**
 * Format performance data
 */
export function formatPerformance(performance: string): string {
  const ada = parseInt(performance) / 1000000;
  return `${ada >= 0 ? "+" : ""}${ada.toFixed(6)} ADA`;
}
