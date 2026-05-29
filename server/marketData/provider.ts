import { dhanProvider } from "./dhanProvider";
import { mockProvider } from "./mockProvider";

export function getMarketDataProvider() {
  if (process.env.MARKET_DATA_PROVIDER === "dhan") {
    return dhanProvider.isConfigured ? dhanProvider : mockProvider;
  }

  return mockProvider;
}
