import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { getMarketDataProvider } from "./marketData/provider";
import { dashboardSymbols, resolveSymbol } from "./marketData/symbols";

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
    dhanConfigured: process.env.MARKET_DATA_PROVIDER === "dhan" && provider.name === "dhan"
  });
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

app.get(["/api/snapshot", "/api/snapshot/:symbol"], async (request, response) => {
  try {
    const params = request.params as { symbol?: string };
    const expiry = typeof request.query.expiry === "string" ? request.query.expiry : undefined;
    const symbol = resolveSymbol(params.symbol);
    const snapshot = await provider.getSnapshot(symbol, expiry);
    response.json(snapshot);
  } catch (error) {
    response.status(502).json({ error: normalizeError(error) });
  }
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/stream" });

wss.on("connection", (socket) => {
  let selectedSymbol = resolveSymbol("NIFTY");
  let selectedExpiry: string | undefined;

  const send = async () => {
    if (socket.readyState !== socket.OPEN) {
      return;
    }

    try {
      socket.send(JSON.stringify(await provider.getSnapshot(selectedSymbol, selectedExpiry)));
    } catch (error) {
      socket.send(JSON.stringify({ error: normalizeError(error), provider: provider.name }));
    }
  };

  socket.on("message", (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString()) as { symbol?: string; expiry?: string };
      selectedSymbol = resolveSymbol(message.symbol);
      selectedExpiry = message.expiry;
      void send();
    } catch {
      // Ignore malformed client messages; the next scheduled tick will continue normally.
    }
  });

  void send();
  const interval = setInterval(() => void send(), provider.name === "dhan" ? 3000 : 2500);
  socket.on("close", () => clearInterval(interval));
});

server.listen(port, () => {
  console.log(`FNO dashboard API listening on http://127.0.0.1:${port} using ${provider.name} data`);
});

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : "Unknown market data error";
}
