import type { DashboardSymbol, MarketDataProvider, OptionRow, Tick } from "./types";

let seed = 42;

function random() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function createOptions(spot: number): OptionRow[] {
  const baseStrike = Math.round(spot / 50) * 50;

  return Array.from({ length: 17 }, (_, index) => {
    const strike = baseStrike + (index - 8) * 50;
    const distance = Math.abs(strike - spot);
    const nearMoneyWeight = Math.max(0.2, 1 - distance / 650);
    const callBias = strike >= spot ? 1.15 : 0.82;
    const putBias = strike <= spot ? 1.18 : 0.78;

    return {
      strike,
      callOi: Math.round((120000 + random() * 780000) * nearMoneyWeight * callBias),
      putOi: Math.round((130000 + random() * 820000) * nearMoneyWeight * putBias),
      callIv: Number((9 + random() * 12 + distance / 260).toFixed(2)),
      putIv: Number((10 + random() * 13 + distance / 280).toFixed(2)),
      gamma: Number((0.0004 + nearMoneyWeight * 0.0038 + random() * 0.0009).toFixed(5)),
      delta: Number((0.5 - (strike - spot) / 1300).toFixed(2)),
      volume: Math.round(10000 + random() * 95000 * nearMoneyWeight)
    };
  });
}

function createTick(symbol: DashboardSymbol): Tick {
  const base = symbol.symbol === "BANKNIFTY" ? 48600 : symbol.symbol === "FINNIFTY" ? 21400 : 22550;
  const spot = Number((base + (random() - 0.45) * 180).toFixed(2));
  const options = createOptions(spot);
  const totalCallOi = options.reduce((sum, row) => sum + row.callOi, 0);
  const totalPutOi = options.reduce((sum, row) => sum + row.putOi, 0);
  const maxPain = options.reduce(
    (best, row) => {
      const pain = Math.abs(row.callOi - row.putOi);
      return pain < best.pain ? { strike: row.strike, pain } : best;
    },
    { strike: options[0].strike, pain: Number.POSITIVE_INFINITY }
  ).strike;

  return {
    symbol: symbol.symbol,
    spot,
    change: Number(((random() - 0.48) * 1.2).toFixed(2)),
    pcr: Number((totalPutOi / totalCallOi).toFixed(2)),
    maxPain,
    timestamp: new Date().toISOString(),
    options
  };
}

export const mockProvider: MarketDataProvider = {
  name: "mock",
  isConfigured: true,
  async getSnapshot(symbol) {
    return createTick(symbol);
  },
  async getExpiries() {
    return [];
  }
};
