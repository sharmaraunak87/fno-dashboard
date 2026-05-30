import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Tick } from "../marketData/types";

// __dirname is not available in ESM; derive it from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cacheDir = path.join(__dirname, "../cache");
const cacheFile = path.join(cacheDir, "snapshots.json");

type CacheStore = Record<string, Record<string, Tick>>;

// Initialize in-memory cache from file on startup
let cacheMemory: CacheStore = {};

function ensureCacheDirectory() {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
}

export function loadCacheFromFile() {
  try {
    ensureCacheDirectory();
    if (fs.existsSync(cacheFile)) {
      const rawData = fs.readFileSync(cacheFile, "utf-8");
      cacheMemory = JSON.parse(rawData) as CacheStore;
      console.log(`[Cache Manager] Loaded cache from persistent file. Cached symbols: ${Object.keys(cacheMemory).join(", ")}`);
    } else {
      console.log("[Cache Manager] Cache file does not exist yet. Using empty/seeded cache.");
    }
  } catch (error) {
    console.error("[Cache Manager] Failed to load cache file:", error);
  }
}

export function getCachedSnapshot(symbol: string, expiry: string): Tick | undefined {
  const symbolCache = cacheMemory[symbol];
  if (!symbolCache) return undefined;
  
  const cachedTick = symbolCache[expiry];
  if (!cachedTick) return undefined;

  return {
    ...cachedTick,
    // Mark it clearly as cached
    pcr: Number(cachedTick.pcr.toFixed(2)),
    options: cachedTick.options
  };
}

export function saveCachedSnapshot(symbol: string, expiry: string, data: Tick) {
  try {
    ensureCacheDirectory();
    
    if (!cacheMemory[symbol]) {
      cacheMemory[symbol] = {};
    }
    
    // Save to memory
    cacheMemory[symbol][expiry] = {
      ...data,
      timestamp: new Date().toISOString() // update timestamp to show cache age
    };
    
    // Write memory cache back to disk
    fs.writeFileSync(cacheFile, JSON.stringify(cacheMemory, null, 2), "utf-8");
  } catch (error) {
    console.error(`[Cache Manager] Failed to write cache for ${symbol} @ ${expiry}:`, error);
  }
}

// Initialise on load
loadCacheFromFile();
