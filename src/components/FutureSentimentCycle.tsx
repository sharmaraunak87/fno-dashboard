interface FutureSentimentCycleProps {
  symbol: string;
}

const SYMBOLS = ["NIFTY", "BANKNIFTY", "FINNIFTY", "RELIANCE", "HDFC", "INFY", "TCS", "ICICIBANK", "AXISBANK", "SBIN"];

type Sentiment = "Long Build" | "Short Build" | "Long Unwind" | "Short Cover";

const sentimentColor: Record<Sentiment, string> = {
  "Long Build": "#10b981",
  "Short Build": "#ef4444",
  "Long Unwind": "#f59e0b",
  "Short Cover": "#6366f1",
};

const sentimentBg: Record<Sentiment, string> = {
  "Long Build": "rgba(16,185,129,0.15)",
  "Short Build": "rgba(239,68,68,0.15)",
  "Long Unwind": "rgba(245,158,11,0.15)",
  "Short Cover": "rgba(99,102,241,0.15)",
};

function getSentiment(seed: number): Sentiment {
  const v = seed % 4;
  if (v === 0) return "Long Build";
  if (v === 1) return "Short Build";
  if (v === 2) return "Long Unwind";
  return "Short Cover";
}

const EXPIRIES = ["05 Jun", "12 Jun", "26 Jun", "31 Jul"];

export function FutureSentimentCycle({ symbol }: FutureSentimentCycleProps) {
  const grid = SYMBOLS.map((sym, si) => ({
    symbol: sym,
    expiries: EXPIRIES.map((exp, ei) => {
      const seed = (si * 7 + ei * 3 + sym.charCodeAt(0)) % 4;
      const sentiment = getSentiment(seed);
      const oiChange = ((si * 13 + ei * 7) % 40) - 20;
      const priceChange = ((si * 5 + ei * 11) % 30) - 15;
      return { exp, sentiment, oiChange, priceChange };
    }),
  }));

  return (
    <div className="tool-section">
      <p className="tool-subtitle">Futures OI + Price change matrix — Identify long/short build-up across expiries</p>
      <div className="sentiment-legend">
        {(Object.keys(sentimentColor) as Sentiment[]).map((s) => (
          <span key={s} className="sentiment-chip" style={{ background: sentimentBg[s], color: sentimentColor[s], border: `1px solid ${sentimentColor[s]}44` }}>
            {s}
          </span>
        ))}
      </div>
      <div className="sentiment-grid-wrapper">
        <table className="sentiment-table">
          <thead>
            <tr>
              <th>Symbol</th>
              {EXPIRIES.map((e) => <th key={e}>{e}</th>)}
            </tr>
          </thead>
          <tbody>
            {grid.map((row) => (
              <tr key={row.symbol}>
                <td className="font-bold" style={{ color: "var(--text-primary)" }}>{row.symbol}</td>
                {row.expiries.map((cell) => (
                  <td key={cell.exp}>
                    <div
                      className="sentiment-cell"
                      style={{ background: sentimentBg[cell.sentiment], borderColor: sentimentColor[cell.sentiment] + "44" }}
                    >
                      <span style={{ color: sentimentColor[cell.sentiment], fontWeight: 700, fontSize: "11px" }}>
                        {cell.sentiment}
                      </span>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                        OI: {cell.oiChange > 0 ? "+" : ""}{cell.oiChange}% | Px: {cell.priceChange > 0 ? "+" : ""}{cell.priceChange}%
                      </div>
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
