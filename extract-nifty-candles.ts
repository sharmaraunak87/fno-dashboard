import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";

const dhanBaseUrl = process.env.DHAN_API_BASE_URL ?? "https://api.dhan.co/v2";
const dhanClientId = process.env.DHAN_CLIENT_ID?.trim();
const dhanAccessToken = process.env.DHAN_ACCESS_TOKEN?.trim();

async function run() {
  console.log("Checking Dhan credentials...");
  if (!dhanClientId || !dhanAccessToken) {
    console.error("Dhan credentials are not configured in .env!");
    process.exit(1);
  }

  // Request NIFTY 5-minute spot data for 29th May 2026
  const payload = {
    securityId: "13",            // NIFTY index ID
    exchangeSegment: "IDX_I",     // Index segment
    instrument: "INDEX",          // Instrument type for spot index
    interval: "5",                // 5-minute candles
    fromDate: "2026-05-25",       // YYYY-MM-DD format
    toDate: "2026-05-30"          // YYYY-MM-DD format
  };

  console.log("Fetching intraday NIFTY spot candles from Dhan API...");
  console.log("Payload:", payload);

  try {
    const response = await fetch(`${dhanBaseUrl}/charts/intraday`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": dhanAccessToken,
        "client-id": dhanClientId
      },
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();
    if (!response.ok) {
      console.error(`Dhan API error (${response.status}):`, rawText);
      process.exit(1);
    }

    const result = JSON.parse(rawText);
    console.log("API response status:", result.status);
    console.log("API response remarks:", result.remarks);

    if (result.status === "success" || (result.open && result.open.length > 0)) {
      const { open, high, low, close, volume, timestamp } = result.data || result;
      if (!timestamp || timestamp.length === 0) {
        console.error("No candle data returned in the response.");
        process.exit(1);
      }

      console.log(`Successfully fetched ${timestamp.length} total candles across the range.`);

      // Map parallel arrays to objects and filter specifically for May 29, 2026
      const candles: any[] = [];
      console.log("Last 10 timestamps dates:");
      timestamp.forEach((ts: number, idx: number) => {
        const dateObj = new Date(ts * 1000);
        const dateStr = dateObj.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }); // e.g. "29/05/2026" or "29/5/2026"
        const timeStr = dateObj.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });

        if (idx >= timestamp.length - 10) {
          console.log(`idx=${idx}, ts=${ts}, dateStr=${dateStr}, timeStr=${timeStr}`);
        }

        // May 29th check
        if (dateStr.includes("29/05/2026") || dateStr.includes("29/5/2026") || dateStr.includes("29-05-2026") || dateStr.includes("29-5-2026")) {
          candles.push({
            time: timeStr,
            open: open[idx],
            high: high[idx],
            low: low[idx],
            close: close[idx],
            volume: volume ? volume[idx] : 0
          });
        }
      });

      if (candles.length === 0) {
        console.error("No candles found for May 29, 2026 after filtering!");
        process.exit(1);
      }

      console.log(`Filtered down to ${candles.length} candles for May 29, 2026.`);

      // Write results to nifty-candles-29may.json
      const outputPath = path.join(__dirname, "nifty-candles-29may.json");
      fs.writeFileSync(outputPath, JSON.stringify(candles, null, 2), "utf-8");
      console.log(`Saved 29th May candle data to: ${outputPath}`);

      // Calculate statistics
      const closes = candles.map(c => c.close);
      const highs = candles.map(c => c.high);
      const lows = candles.map(c => c.low);
      const minClose = Math.min(...closes);
      const maxClose = Math.max(...closes);
      const dayHigh = Math.max(...highs);
      const dayLow = Math.min(...lows);
      
      console.log(`\n=== NIFTY 29th May Statistics ===`);
      console.log(`Open Price (09:15): ${candles[0].open}`);
      console.log(`Close Price (15:30): ${candles[candles.length - 1].close}`);
      console.log(`Day High (OHLC): ${dayHigh}`);
      console.log(`Day Low (OHLC): ${dayLow}`);
      console.log(`Min 5m Close: ${minClose}`);
      console.log(`Max 5m Close: ${maxClose}`);
      console.log(`First candle:`, candles[0]);
      console.log(`Last candle:`, candles[candles.length - 1]);
    } else {
      console.error("Dhan API returned success status but no data structure:", result);
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}

run();
