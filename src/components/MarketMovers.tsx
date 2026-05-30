import { useState } from "react";

type MoverType = "gainers" | "losers" | "active";

const stockData = [
  { symbol: "BAJFINANCE", ltp: 7842.5, change: 4.82, volume: 2840000, oi: 1240000 },
  { symbol: "HCLTECH", ltp: 1624.3, change: 3.91, volume: 1920000, oi: 980000 },
  { symbol: "INFY", ltp: 1842.6, change: 3.14, volume: 3120000, oi: 1560000 },
  { symbol: "WIPRO", ltp: 524.8, change: 2.76, volume: 4200000, oi: 2100000 },
  { symbol: "TATAMOTORS", ltp: 924.4, change: 2.41, volume: 5840000, oi: 2920000 },
  { symbol: "MARUTI", ltp: 12480.0, change: -3.62, volume: 480000, oi: 240000 },
  { symbol: "ONGC", ltp: 284.6, change: -2.94, volume: 8400000, oi: 4200000 },
  { symbol: "NTPC", ltp: 384.2, change: -2.41, volume: 6200000, oi: 3100000 },
  { symbol: "POWERGRID", ltp: 324.8, change: -1.98, volume: 4800000, oi: 2400000 },
  { symbol: "HDFC BANK", ltp: 1724.5, change: -1.62, volume: 7200000, oi: 3600000 },
  { symbol: "RELIANCE", ltp: 2984.6, change: 1.24, volume: 9840000, oi: 4920000 },
  { symbol: "TCS", ltp: 4284.2, change: 1.84, volume: 1240000, oi: 620000 },
  { symbol: "ICICIBANK", ltp: 1284.8, change: 0.84, volume: 6400000, oi: 3200000 },
  { symbol: "AXISBANK", ltp: 1184.6, change: -0.42, volume: 5200000, oi: 2600000 },
  { symbol: "SBIN", ltp: 824.4, change: 1.42, volume: 8400000, oi: 4200000 },
];

export function MarketMovers() {
  const [view, setView] = useState<MoverType>("gainers");

  const sorted =
    view === "gainers" ? [...stockData].sort((a, b) => b.change - a.change).slice(0, 8) :
    view === "losers" ? [...stockData].sort((a, b) => a.change - b.change).slice(0, 8) :
    [...stockData].sort((a, b) => b.volume - a.volume).slice(0, 8);

  const formatVol = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(2)}M`;
    return `${(v / 1000).toFixed(0)}K`;
  };

  return (
    <div className="tool-section">
      <div className="toggle-tab-group" style={{ width: "fit-content", marginBottom: "12px" }}>
        <button className={view === "gainers" ? "active green" : ""} onClick={() => setView("gainers")} type="button">Top Gainers</button>
        <button className={view === "losers" ? "active red" : ""} onClick={() => setView("losers")} type="button">Top Losers</button>
        <button className={view === "active" ? "active" : ""} onClick={() => setView("active")} type="button">Most Active</button>
      </div>
      <p className="tool-subtitle">NSE F&O stocks — {view === "gainers" ? "Top gaining" : view === "losers" ? "Top losing" : "Most actively traded"} contracts today</p>
      <div className="booster-table-wrap">
        <table className="booster-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Symbol</th>
              <th>LTP</th>
              <th>Change %</th>
              <th>Volume</th>
              <th>OI</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((stock, i) => (
              <tr key={stock.symbol}>
                <td className="text-dim">{i + 1}</td>
                <td className="font-bold">{stock.symbol}</td>
                <td>{stock.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className={stock.change >= 0 ? "text-green font-bold" : "text-red font-bold"}>
                  {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%
                </td>
                <td>{formatVol(stock.volume)}</td>
                <td>{formatVol(stock.oi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
