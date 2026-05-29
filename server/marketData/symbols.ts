import type { DashboardSymbol } from "./types";

export const dashboardSymbols: DashboardSymbol[] = [
  {
    symbol: "NIFTY",
    dhanSecurityId: Number(process.env.DHAN_NIFTY_SECURITY_ID ?? 13),
    dhanSegment: process.env.DHAN_NIFTY_SEGMENT ?? "IDX_I"
  },
  {
    symbol: "BANKNIFTY",
    dhanSecurityId: Number(process.env.DHAN_BANKNIFTY_SECURITY_ID ?? 25),
    dhanSegment: process.env.DHAN_BANKNIFTY_SEGMENT ?? "IDX_I"
  },
  {
    symbol: "FINNIFTY",
    dhanSecurityId: Number(process.env.DHAN_FINNIFTY_SECURITY_ID ?? 27),
    dhanSegment: process.env.DHAN_FINNIFTY_SEGMENT ?? "IDX_I"
  }
];

export function resolveSymbol(symbol: string | undefined) {
  const normalizedSymbol = String(symbol ?? "NIFTY").toUpperCase();
  return dashboardSymbols.find((item) => item.symbol === normalizedSymbol) ?? dashboardSymbols[0];
}
