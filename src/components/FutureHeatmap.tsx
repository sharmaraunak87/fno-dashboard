const FUTURES_SYMBOLS = [
  "NIFTY", "BANKNIFTY", "FINNIFTY",
  "RELIANCE", "HDFC", "INFY", "TCS", "ICICIBANK",
  "AXISBANK", "SBIN", "KOTAKBANK", "LT",
  "BAJFINANCE", "HCLTECH", "WIPRO", "MARUTI",
  "TATAMOTORS", "ONGC", "NTPC", "POWERGRID",
];

const EXPIRIES = ["Jun", "Jul", "Aug"];

function getColor(change: number): string {
  if (change > 3) return "#064e3b";
  if (change > 1.5) return "#065f46";
  if (change > 0.5) return "#047857";
  if (change > 0) return "#059669";
  if (change > -0.5) return "#7f1d1d";
  if (change > -1.5) return "#991b1b";
  if (change > -3) return "#b91c1c";
  return "#dc2626";
}

function getTextColor(change: number): string {
  return Math.abs(change) > 0.5 ? "#ffffff" : "#d1fae5";
}

export function FutureHeatmap() {
  const grid = FUTURES_SYMBOLS.map((sym, si) => ({
    symbol: sym,
    expiries: EXPIRIES.map((exp, ei) => {
      const seed = (si * 13 + ei * 7 + sym.charCodeAt(0)) % 100;
      const change = Number(((seed - 50) / 10).toFixed(2));
      const oi = Math.round(50000 + (si * 3000 + ei * 1000));
      return { exp, change, oi };
    }),
  }));

  return (
    <div className="tool-section">
      <p className="tool-subtitle">
        Futures price change heatmap — Green = positive, Red = negative. Darker = stronger move.
      </p>
      <div className="heatmap-grid-wrapper">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th>Symbol</th>
              {EXPIRIES.map((e) => <th key={e}>{e} Fut</th>)}
            </tr>
          </thead>
          <tbody>
            {grid.map((row) => (
              <tr key={row.symbol}>
                <td className="font-bold" style={{ color: "var(--text-primary)", fontSize: "12px" }}>{row.symbol}</td>
                {row.expiries.map((cell) => (
                  <td key={cell.exp} style={{ padding: "0" }}>
                    <div
                      className="heatmap-cell"
                      style={{ background: getColor(cell.change), color: getTextColor(cell.change) }}
                    >
                      <span style={{ fontWeight: 700, fontSize: "13px" }}>
                        {cell.change > 0 ? "+" : ""}{cell.change}%
                      </span>
                      <span style={{ fontSize: "9px", opacity: 0.8 }}>
                        OI: {(cell.oi / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
