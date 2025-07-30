// import { PierTwoStakingApi } from "@pier_two/staking-ts";
import { Api } from "../generated/api";
import { apiBaseUrl, getApiKey } from "./config";

export function createApiClient() {
  return new Api({
    baseUrl: apiBaseUrl,
    baseApiParams: {
      headers: {
        "Content-Type": "application/json",
        "api-key": getApiKey(),
      },
    },
  });
}
