/**
 * Validate a Cardano stake address
 */
export function isValidStakeAddress(address: string): boolean {
  const stakeAddressRegex = /^stake_[a-z0-9]+$/;
  return stakeAddressRegex.test(address);
}

/**
 * Validate a Cardano payment address
 */
export function isValidPaymentAddress(address: string): boolean {
  const paymentAddressRegex = /^addr_[a-z0-9]+$/;
  return paymentAddressRegex.test(address);
}

/**
 * Validate a Cardano address (stake or payment)
 * @deprecated Use isValidStakeAddress or isValidPaymentAddress instead
 */
export function isValidCardanoAddress(address: string): boolean {
  return isValidStakeAddress(address) || isValidPaymentAddress(address);
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
