import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { OptionRow } from "../types";

interface PeCeDifferenceProps {
  options: OptionRow[];
  spot: number;
}

const formatL = (v: number) => {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "+";
  return `${sign}${(abs / 100000).toFixed(1)}L`;
};

export function PeCeDifference({ options, spot }: PeCeDifferenceProps) {
  const data = options
    .filter((o) => Math.abs(o.strike - spot) <= 400)
    .map((opt) => ({
      strike: opt.strike,
      diff: opt.putOi - opt.callOi,
      isAtm: Math.abs(opt.strike - spot) < 30,
    }));

  const totalDiff = data.reduce((s, d) => s + d.diff, 0);
  const bullishStrikes = data.filter((d) => d.diff > 0).length;
  const bearishStrikes = data.filter((d) => d.diff < 0).length;

  return (
    <div className="tool-section">
      <div className="tool-summary-row">
        <div className={`summary-chip ${totalDiff >= 0 ? "green" : "red"}`}>
          <span>Net PE-CE OI</span>
          <strong>{formatL(totalDiff)}</strong>
        </div>
        <div className="summary-chip green">
          <span>Put Heavy Strikes</span>
          <strong>{bullishStrikes}</strong>
        </div>
        <div className="summary-chip red">
          <span>Call Heavy Strikes</span>
          <strong>{bearishStrikes}</strong>
        </div>
        <div className={`summary-chip ${totalDiff >= 0 ? "green" : "red"}`}>
          <span>Bias</span>
          <strong>{totalDiff >= 0 ? "Bullish" : "Bearish"}</strong>
        </div>
      </div>
      <p className="tool-subtitle">
        PE − CE OI per strike. Positive = Put heavy (support), Negative = Call heavy (resistance)
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid stroke="#1e222b" vertical={false} />
          <XAxis dataKey="strike" stroke="#5d6575" fontSize={10} tickLine={false} />
          <YAxis tickFormatter={formatL} stroke="#5d6575" fontSize={11} tickLine={false} width={55} />
          <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
          <ReferenceLine x={Math.round(spot / 50) * 50} stroke="#6366f1" strokeDasharray="4 4" label={{ value: "ATM", fill: "#6366f1", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number) => [formatL(val), "PE − CE OI"]}
          />
          <Bar dataKey="diff" name="PE − CE OI" radius={[3, 3, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.isAtm ? "#6366f1" : entry.diff >= 0 ? "#10b981" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
