import "dotenv/config";
import { dhanProvider } from "./server/marketData/dhanProvider";
import { dashboardSymbols } from "./server/marketData/symbols";
import { saveCachedSnapshot } from "./server/utils/cacheManager";

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seed() {
  console.log("Starting cache seeding from Dhan API...");

  for (const symbol of dashboardSymbols) {
    try {
      console.log(`\n---------------------------------`);
      console.log(`Processing symbol: ${symbol.symbol}...`);
      
      // Fetch expiries
      console.log(`Fetching expiries...`);
      const expiries = await dhanProvider.getExpiries!(symbol);
      console.log(`Expiries found:`, expiries.slice(0, 3));

      if (expiries.length === 0) {
        console.warn(`No expiries found for ${symbol.symbol}, skipping.`);
        continue;
      }

      const activeExpiry = expiries[0];
      console.log(`Fetching option chain snapshot for ${symbol.symbol} expiry ${activeExpiry}...`);
      
      const tick = await dhanProvider.getSnapshot(symbol, activeExpiry);
      console.log(`Successfully fetched tick. Spot price: ${tick.spot}, Options count: ${tick.options.length}`);
      
      // Save to snapshots.json cache
      saveCachedSnapshot(symbol.symbol, activeExpiry, tick);
      console.log(`Saved ${symbol.symbol} @ ${activeExpiry} to snapshots.json`);

      // Wait 3 seconds between requests to avoid rate limits
      await delay(3000);
    } catch (error) {
      console.error(`Failed to seed cache for ${symbol.symbol}:`, error instanceof Error ? error.message : error);
      console.log("Waiting 5 seconds before next symbol...");
      await delay(5000);
    }
  }

  console.log("\nCache seeding completed!");
}

seed();
