import { PierTwoStakingApi } from "@pier_two/staking-ts";
import { apiBaseUrl, getApiKey } from "./config";

export function createApiClient() {
  return new PierTwoStakingApi({
    baseUrl: apiBaseUrl,
    apiKey: getApiKey(),
  });
}
