import { dhanProvider } from "./dhanProvider";
import { mockProvider } from "./mockProvider";
import type { MarketDataProvider, Tick } from "./types";
import { getMarketStatus } from "../utils/marketHours";
import { getCachedSnapshot, saveCachedSnapshot } from "../utils/cacheManager";

export function getMarketDataProvider(): MarketDataProvider {
  const primaryProvider = process.env.MARKET_DATA_PROVIDER === "dhan" && dhanProvider.isConfigured 
    ? dhanProvider 
    : mockProvider;

  // We always wrap to handle caching and market closed logic
  return {
    name: "dhan",
    isConfigured: true,
    async getSnapshot(symbol, expiry) {
      const status = getMarketStatus();
      const selectedExpiry = expiry ?? (await this.getExpiries!(symbol))[0];

      // 1. If Market is Closed, serve from Cache first
      if (!status.isOpen) {
        const cached = getCachedSnapshot(symbol.symbol, selectedExpiry);
        if (cached) {
          return {
            ...cached,
            marketStatus: "CLOSED",
            lastUpdated: cached.timestamp
          } as any;
        }
        
        // If not in cache, try to fetch once from Dhan to seed the cache!
        if (primaryProvider.name === "dhan") {
          try {
            console.log(`[Provider] Closed market cache miss. Fetching from Dhan once to seed cache: ${symbol.symbol} @ ${selectedExpiry}`);
            const tick = await primaryProvider.getSnapshot(symbol, selectedExpiry);
            const isRealDhan = !(tick as any).isFallback;
            if (isRealDhan) {
              saveCachedSnapshot(symbol.symbol, selectedExpiry, tick);
            }
            return {
              ...tick,
              marketStatus: "CLOSED",
              lastUpdated: tick.timestamp
            } as any;
          } catch (error) {
            console.warn(`[Provider] Closed market Dhan fetch failed for ${symbol.symbol} @ ${selectedExpiry}:`, error instanceof Error ? error.message : error);
          }
        }

        // If not in cache and Dhan fetch failed, fallback to mock data but mark as closed
        console.warn(`[Provider] Closed & no cache/API for ${symbol.symbol} @ ${selectedExpiry}. Generating mock.`);
        const mockTick = await mockProvider.getSnapshot(symbol);
        return {
          ...mockTick,
          marketStatus: "CLOSED_MOCK",
          lastUpdated: new Date().toISOString()
        } as any;
      }

      // 2. If Market is Open, try to fetch live data from Primary Provider
      try {
        const tick = await primaryProvider.getSnapshot(symbol, selectedExpiry);
        
        // If it's a real tick (not a mock fallback in the provider), save to cache
        const isRealDhan = primaryProvider.name === "dhan" && !(tick as any).isFallback;
        if (isRealDhan) {
          saveCachedSnapshot(symbol.symbol, selectedExpiry, tick);
        }

        return {
          ...tick,
          marketStatus: "LIVE",
          lastUpdated: tick.timestamp
        } as any;
      } catch (error) {
        console.warn(`[Provider] Live fetch failed for ${symbol.symbol} @ ${selectedExpiry}:`, error instanceof Error ? error.message : error);
        
        // Fallback to cache on error
        const cached = getCachedSnapshot(symbol.symbol, selectedExpiry);
        if (cached) {
          return {
            ...cached,
            marketStatus: "LIVE_FALLBACK",
            fallbackReason: error instanceof Error ? error.message : "API Error",
            lastUpdated: cached.timestamp
          } as any;
        }

        // Final fallback to mock if no cache exists
        const mockTick = await mockProvider.getSnapshot(symbol);
        return {
          ...mockTick,
          marketStatus: "LIVE_MOCK_FALLBACK",
          fallbackReason: error instanceof Error ? error.message : "API Error",
          lastUpdated: new Date().toISOString()
        } as any;
      }
    },

    async getExpiries(symbol) {
      const status = getMarketStatus();

      // Try to fetch active expiries from Dhan first, even if the market is closed,
      // so that we match the real options chain dates rather than generating mock Thursdays
      if (primaryProvider.name === "dhan" && primaryProvider.getExpiries) {
        try {
          const expiries = await primaryProvider.getExpiries(symbol);
          if (expiries.length > 0) {
            return expiries;
          }
        } catch (error) {
          console.warn(`[Provider] Expiries fetch failed from Dhan, falling back:`, error instanceof Error ? error.message : error);
        }
      }

      return getFallbackExpiries();
    }
  };
}

function getFallbackExpiries(): string[] {
  const expiries: string[] = [];
  const date = new Date();
  
  // Find upcoming Thursdays
  for (let i = 0; i < 4; i++) {
    while (date.getDay() !== 4) { // 4 is Thursday
      date.setDate(date.getDate() + 1);
    }
    
    // Format locally to avoid UTC conversion shifts
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    expiries.push(`${y}-${m}-${d}`);
    
    date.setDate(date.getDate() + 1); // Move past this Thursday
  }
  return expiries;
}
