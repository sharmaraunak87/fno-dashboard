export type OptionRow = {
  strike: number;
  callOi: number;
  putOi: number;
  callIv: number;
  putIv: number;
  gamma: number;
  delta: number;
  volume: number;
  callSecurityId?: number;
  putSecurityId?: number;
  callVolume?: number;
  putVolume?: number;
};

export type Tick = {
  symbol: string;
  spot: number;
  change: number;
  pcr: number;
  maxPain: number;
  timestamp: string;
  options: OptionRow[];
};

export type DashboardSymbol = {
  symbol: string;
  dhanSecurityId: number;
  dhanSegment: string;
};

export type MarketDataProvider = {
  name: string;
  isConfigured: boolean;
  getSnapshot(symbol: DashboardSymbol, expiry?: string): Promise<Tick>;
  getExpiries?(symbol: DashboardSymbol): Promise<string[]>;
};
