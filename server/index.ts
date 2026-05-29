import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { getMarketDataProvider } from "./marketData/provider";
import { dashboardSymbols, resolveSymbol } from "./marketData/symbols";
import { getMarketStatus, holidays2026 } from "./utils/marketHours";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const provider = getMarketDataProvider();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "fno-dashboard-api",
    provider: provider.name,
    dhanConfigured: process.env.MARKET_DATA_PROVIDER === "dhan" && provider.name === "dhan",
    marketStatus: getMarketStatus()
  });
});

app.get("/api/market-status", (_request, response) => {
  response.json({ data: getMarketStatus() });
});

app.get("/api/holidays", (_request, response) => {
  response.json({ data: holidays2026 });
});

app.get("/api/symbols", (_request, response) => {
  response.json({
    data: dashboardSymbols.map((item) => ({
      symbol: item.symbol,
      dhanSecurityId: item.dhanSecurityId,
      dhanSegment: item.dhanSegment
    }))
  });
});

app.get("/api/expiries/:symbol", async (request, response) => {
  try {
    const symbol = resolveSymbol(request.params.symbol);
    const expiries = provider.getExpiries ? await provider.getExpiries(symbol) : [];
    response.json({ data: expiries, provider: provider.name });
  } catch (error) {
    response.status(502).json({ error: normalizeError(error) });
  }
});

app.get("/api/historical-candles/:symbol", async (request, response) => {
  try {
    const symbol = resolveSymbol(request.params.symbol);
    const dateStr = typeof request.query.date === "string" ? request.query.date : new Date().toISOString().split("T")[0];
    
    // Query range covers the selected date up to the next day
    const fromDate = dateStr;
    const dateObj = new Date(dateStr);
    dateObj.setDate(dateObj.getDate() + 1);
    
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    const toDate = `${y}-${m}-${d}`;

    const dhanBaseUrl = process.env.DHAN_API_BASE_URL ?? "https://api.dhan.co/v2";
    const dhanClientId = process.env.DHAN_CLIENT_ID?.trim();
    const dhanAccessToken = process.env.DHAN_ACCESS_TOKEN?.trim();

    if (!dhanClientId || !dhanAccessToken || process.env.MARKET_DATA_PROVIDER !== "dhan") {
      response.json({ data: [] });
      return;
    }

    const payload = {
      securityId: String(symbol.dhanSecurityId),
      exchangeSegment: symbol.dhanSegment,
      instrument: "INDEX",
      interval: "5",
      fromDate,
      toDate
    };

    const res = await fetch(`${dhanBaseUrl}/charts/intraday`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": dhanAccessToken,
        "client-id": dhanClientId
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Dhan chart API returned status ${res.status}`);
    }

    const result = await res.json() as any;
    if (result.status === "success" || (result.open && result.open.length > 0)) {
      const { open, high, low, close, volume, timestamp } = result.data || result;
      if (!timestamp) {
        response.json({ data: [] });
        return;
      }

      // Filter specifically for the target date to ensure exact time bounds
      const targetDateFormatted = new Date(dateStr).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
      const candles: any[] = [];
      
      timestamp.forEach((ts: number, idx: number) => {
        const dObj = new Date(ts * 1000);
        const candleDateStr = dObj.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
        const timeStr = dObj.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });

        if (candleDateStr === targetDateFormatted) {
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

      response.json({ data: candles });
    } else {
      response.json({ data: [] });
    }
  } catch (error) {
    console.error("[Server] Failed to fetch historical candles:", error);
    response.json({ data: [] }); // return empty on error to let frontend fallback gracefully
  }
});

app.get(["/api/snapshot", "/api/snapshot/:symbol"], async (request, response) => {
  try {
    const params = request.params as { symbol?: string };
    const expiry = typeof request.query.expiry === "string" ? request.query.expiry : undefined;
    const symbol = resolveSymbol(params.symbol);
    const snapshot = await provider.getSnapshot(symbol, expiry);
    response.json({
      ...snapshot,
      marketHours: getMarketStatus()
    });
  } catch (error) {
    response.status(502).json({ error: normalizeError(error) });
  }
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/stream" });

wss.on("connection", (socket) => {
  let selectedSymbol = resolveSymbol("NIFTY");
  let selectedExpiry: string | undefined;
  let lastSentStatusKey = "";

  const send = async () => {
    if (socket.readyState !== socket.OPEN) {
      return;
    }

    try {
      const status = getMarketStatus();
      
      // If the market is closed, we only send the cached snapshot ONCE per selection state
      // to avoid hitting the cache/disk repeatedly and spamming logs.
      if (!status.isOpen) {
        const currentStatusKey = `${selectedSymbol.symbol}-${selectedExpiry ?? "default"}-${status.reason}`;
        if (lastSentStatusKey !== currentStatusKey) {
          const snapshot = await provider.getSnapshot(selectedSymbol, selectedExpiry);
          socket.send(JSON.stringify({ 
            ...snapshot, 
            marketHours: status 
          }));
          lastSentStatusKey = currentStatusKey;
        }
        return;
      }

      // If market is open, fetch live and push
      const snapshot = await provider.getSnapshot(selectedSymbol, selectedExpiry);
      socket.send(JSON.stringify({ 
        ...snapshot, 
        marketHours: status 
      }));
      lastSentStatusKey = "LIVE";
    } catch (error) {
      socket.send(JSON.stringify({ 
        error: normalizeError(error), 
        provider: provider.name,
        marketHours: getMarketStatus()
      }));
    }
  };

  socket.on("message", (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString()) as { symbol?: string; expiry?: string };
      selectedSymbol = resolveSymbol(message.symbol);
      selectedExpiry = message.expiry;
      // Reset lock key so changing symbol/expiry triggers immediate push
      lastSentStatusKey = "";
      void send();
    } catch {
      // Ignore malformed client messages
    }
  });

  void send();
  
  // Set interval to send updates. It runs every 3 seconds, but will do nothing
  // during closed hours if the selection hasn't changed.
  const interval = setInterval(() => void send(), provider.name === "dhan" ? 3000 : 2500);
  socket.on("close", () => clearInterval(interval));
});

server.listen(port, () => {
  console.log(`FNO dashboard API listening on http://127.0.0.1:${port} using ${provider.name} data`);
});

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : "Unknown market data error";
}
