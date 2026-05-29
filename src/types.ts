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

export type MarketTick = {
  symbol: string;
  spot: number;
  change: number;
  pcr: number;
  maxPain: number;
  timestamp: string;
  options: OptionRow[];
  marketHours?: MarketStatus;
};

export interface MarketStatus {
  isOpen: boolean;
  reason: "OPEN" | "WEEKEND" | "HOLIDAY" | "BEFORE_MARKET" | "AFTER_MARKET";
  reasonText: string;
  currentTimeIst: string;
  nextOpenTimeIst: string;
}
