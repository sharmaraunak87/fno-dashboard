import type { OptionRow } from "../types";

interface IvGridProps {
  options: OptionRow[];
  spot: number;
  symbol: string;
}

const EXPIRIES = ["05 Jun", "12 Jun", "26 Jun", "31 Jul", "28 Aug"];

function ivColor(iv: number): string {
  if (iv < 10) return "rgba(16,185,129,0.2)";
  if (iv < 15) return "rgba(99,102,241,0.2)";
  if (iv < 20) return "rgba(245,158,11,0.2)";
  return "rgba(239,68,68,0.2)";
}

function ivTextColor(iv: number): string {
  if (iv < 10) return "#10b981";
  if (iv < 15) return "#818cf8";
  if (iv < 20) return "#f59e0b";
  return "#ef4444";
}

export function IvGrid({ options, spot, symbol }: IvGridProps) {
  const nearStrikes = options
    .filter((o) => Math.abs(o.strike - spot) <= 200)
    .slice(0, 9);

  let seed = spot;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  // Build IV grid: rows = strikes, cols = expiries
  const grid = nearStrikes.map((opt) => ({
    strike: opt.strike,
    isAtm: Math.abs(opt.strike - spot) < 30,
    expiries: EXPIRIES.map((exp, ei) => {
      // IV increases with time (term structure) and distance from ATM
      const dist = Math.abs(opt.strike - spot);
      const termPremium = ei * 0.8;
      const skewPremium = dist / 200;
      const baseIv = (opt.callIv + opt.putIv) / 2;
      const iv = Number((baseIv + termPremium + skewPremium + (rand() - 0.5) * 1.5).toFixed(1));
      return { exp, iv };
    }),
  }));

  return (
    <div className="tool-section">
      <p className="tool-subtitle">
        {symbol} — Implied Volatility grid across strikes and expiries. Color: <span style={{ color: "#10b981" }}>Low</span> → <span style={{ color: "#f59e0b" }}>Medium</span> → <span style={{ color: "#ef4444" }}>High</span>
      </p>
      <div className="iv-grid-wrapper">
        <table className="iv-grid-table">
          <thead>
            <tr>
              <th>Strike</th>
              {EXPIRIES.map((e) => <th key={e}>{e}</th>)}
            </tr>
          </thead>
          <tbody>
            {grid.map((row) => (
              <tr key={row.strike} className={row.isAtm ? "atm-row" : ""}>
                <td className="font-bold" style={{ color: row.isAtm ? "#818cf8" : "var(--text-primary)" }}>
                  {row.strike}
                  {row.isAtm && <span style={{ fontSize: "9px", marginLeft: "4px", color: "#818cf8" }}>ATM</span>}
                </td>
                {row.expiries.map((cell) => (
                  <td
                    key={cell.exp}
                    style={{ background: ivColor(cell.iv), color: ivTextColor(cell.iv), fontWeight: 700, textAlign: "center" }}
                  >
                    {cell.iv}%
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
