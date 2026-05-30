import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { OptionRow } from "../types";

interface VolatilitySkewProps {
  options: OptionRow[];
  spot: number;
}

export function VolatilitySkew({ options, spot }: VolatilitySkewProps) {
  const sorted = [...options]
    .sort((a, b) => a.strike - b.strike)
    .filter((o) => Math.abs(o.strike - spot) <= 500);

  const data = sorted.map((opt) => ({
    strike: opt.strike,
    callIv: opt.callIv,
    putIv: opt.putIv,
    skew: Number((opt.putIv - opt.callIv).toFixed(2)),
    moneyness: Number(((opt.strike / spot - 1) * 100).toFixed(2)),
  }));

  const atmIv = data.find((d) => Math.abs(d.strike - spot) < 30);
  const maxSkew = Math.max(...data.map((d) => Math.abs(d.skew)));

  return (
    <div className="tool-section">
      <div className="tool-summary-row">
        <div className="summary-chip neutral">
          <span>ATM IV</span>
          <strong>{atmIv ? ((atmIv.callIv + atmIv.putIv) / 2).toFixed(1) : "—"}%</strong>
        </div>
        <div className="summary-chip neutral">
          <span>Max Skew</span>
          <strong>{maxSkew.toFixed(1)}%</strong>
        </div>
        <div className={`summary-chip ${(atmIv?.putIv ?? 0) > (atmIv?.callIv ?? 0) ? "red" : "green"}`}>
          <span>Skew Direction</span>
          <strong>{(atmIv?.putIv ?? 0) > (atmIv?.callIv ?? 0) ? "Put Skew" : "Call Skew"}</strong>
        </div>
      </div>
      <p className="tool-subtitle">Volatility smile — Put IV vs Call IV across strikes</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid stroke="#1e222b" vertical={false} />
          <XAxis dataKey="strike" stroke="#5d6575" fontSize={11} tickLine={false} />
          <YAxis stroke="#5d6575" fontSize={11} tickLine={false} width={40} tickFormatter={(v) => `${v}%`} />
          <ReferenceLine x={Math.round(spot / 50) * 50} stroke="#6366f1" strokeDasharray="4 4" label={{ value: "ATM", fill: "#6366f1", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number, name: string) => [`${val.toFixed(2)}%`, name]}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Line type="monotone" dataKey="callIv" name="Call IV" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="putIv" name="Put IV" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="skew" name="Skew (Put-Call)" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
