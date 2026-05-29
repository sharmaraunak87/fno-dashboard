import type { DashboardSymbol, MarketDataProvider, OptionRow, Tick } from "./types";

type DhanOptionSide = {
  greeks?: {
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
  };
  implied_volatility?: number;
  oi?: number;
  previous_oi?: number;
  security_id?: number;
  volume?: number;
};

type DhanOptionChainResponse = {
  data?: {
    last_price?: number;
    oc?: Record<string, { ce?: DhanOptionSide; pe?: DhanOptionSide }>;
  };
  status?: string;
};

type DhanExpiryListResponse = {
  data?: string[];
  status?: string;
};

const dhanBaseUrl = process.env.DHAN_API_BASE_URL ?? "https://api.dhan.co/v2";
const dhanClientId = process.env.DHAN_CLIENT_ID?.trim();
const dhanAccessToken = process.env.DHAN_ACCESS_TOKEN?.trim();
const strikeRangeEachSide = Number(process.env.DHAN_OPTION_STRIKE_RANGE ?? 20);

export const dhanProvider: MarketDataProvider = {
  name: "dhan",
  isConfigured: Boolean(dhanClientId && dhanAccessToken),
  async getSnapshot(symbol, expiry) {
    const selectedExpiry = expiry ?? (await this.getExpiries?.(symbol))?.[0];

    if (!selectedExpiry) {
      throw new Error(`No active Dhan expiry found for ${symbol.symbol}`);
    }

    const payload = await postDhan<DhanOptionChainResponse>("/optionchain", {
      UnderlyingScrip: symbol.dhanSecurityId,
      UnderlyingSeg: symbol.dhanSegment,
      Expiry: selectedExpiry
    });

    return mapOptionChain(symbol.symbol, payload);
  },
  async getExpiries(symbol) {
    const payload = await postDhan<DhanExpiryListResponse>("/optionchain/expirylist", {
      UnderlyingScrip: symbol.dhanSecurityId,
      UnderlyingSeg: symbol.dhanSegment
    });

    return payload.data ?? [];
  }
};

async function postDhan<T>(path: string, body: unknown): Promise<T> {
  if (!dhanClientId || !dhanAccessToken) {
    throw new Error("Dhan credentials are not configured");
  }

  validateDhanCredentials(dhanClientId, dhanAccessToken);

  const response = await fetch(`${dhanBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access-token": dhanAccessToken,
      "client-id": dhanClientId
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Dhan API ${response.status}: ${details}`);
  }

  return response.json() as Promise<T>;
}

function validateDhanCredentials(clientId: string, accessToken: string) {
  if (!/^\d+$/.test(clientId)) {
    throw new Error("Dhan client ID should be the numeric dhanClientId, not API key, UCC, or app ID");
  }

  if (accessToken.startsWith("eyJ") && accessToken.split(".").length !== 3) {
    throw new Error("Dhan access token looks incomplete. Copy the full JWT accessToken value; it should contain three dot-separated parts");
  }
}

function mapOptionChain(symbol: string, payload: DhanOptionChainResponse): Tick {
  const optionChain = payload.data?.oc ?? {};
  const spot = Number(payload.data?.last_price ?? 0);
  const options = Object.entries(optionChain)
    .map(([strike, row]): OptionRow => ({
      strike: Number(strike),
      callOi: row.ce?.oi ?? 0,
      putOi: row.pe?.oi ?? 0,
      callIv: Number((row.ce?.implied_volatility ?? 0).toFixed(2)),
      putIv: Number((row.pe?.implied_volatility ?? 0).toFixed(2)),
      gamma: Number(Math.max(row.ce?.greeks?.gamma ?? 0, row.pe?.greeks?.gamma ?? 0).toFixed(5)),
      delta: Number((row.ce?.greeks?.delta ?? row.pe?.greeks?.delta ?? 0).toFixed(2)),
      volume: (row.ce?.volume ?? 0) + (row.pe?.volume ?? 0),
      callSecurityId: row.ce?.security_id,
      putSecurityId: row.pe?.security_id,
      callVolume: row.ce?.volume ?? 0,
      putVolume: row.pe?.volume ?? 0
    }))
    .filter((row) => Number.isFinite(row.strike))
    .sort((a, b) => a.strike - b.strike);

  if (!options.length) {
    throw new Error(`Dhan option chain response for ${symbol} did not include strikes`);
  }

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
    symbol,
    spot,
    change: 0,
    pcr: totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 0,
    maxPain,
    timestamp: new Date().toISOString(),
    options: trimOptionsAroundSpot(options, spot, strikeRangeEachSide)
  };
}

function trimOptionsAroundSpot(options: OptionRow[], spot: number, strikesEachSide: number) {
  if (!Number.isFinite(spot) || strikesEachSide <= 0) {
    return options;
  }

  const atmIndex = options.reduce((bestIndex, row, index) => {
    const currentDistance = Math.abs(row.strike - spot);
    const bestDistance = Math.abs(options[bestIndex].strike - spot);
    return currentDistance < bestDistance ? index : bestIndex;
  }, 0);
  const start = Math.max(0, atmIndex - strikesEachSide);
  const end = Math.min(options.length, atmIndex + strikesEachSide + 1);

  return options.slice(start, end);
}
