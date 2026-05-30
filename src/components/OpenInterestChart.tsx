import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { OptionRow } from "../types";

interface OpenInterestChartProps {
  options: OptionRow[];
  spot: number;
}

const formatL = (v: number) => `${(v / 100000).toFixed(1)}L`;

export function OpenInterestChart({ options, spot }: OpenInterestChartProps) {
  const data = options
    .filter((o) => Math.abs(o.strike - spot) <= 500)
    .map((opt) => ({
      strike: opt.strike,
      callOi: opt.callOi,
      putOi: opt.putOi,
      isAtm: Math.abs(opt.strike - spot) < 30,
    }));

  const maxCallOi = Math.max(...data.map((d) => d.callOi));
  const maxPutOi = Math.max(...data.map((d) => d.putOi));
  const maxCallStrike = data.find((d) => d.callOi === maxCallOi)?.strike;
  const maxPutStrike = data.find((d) => d.putOi === maxPutOi)?.strike;

  return (
    <div className="tool-section">
      <div className="tool-summary-row">
        <div className="summary-chip red">
          <span>Max Call OI (Resistance)</span>
          <strong>{maxCallStrike} — {formatL(maxCallOi)}</strong>
        </div>
        <div className="summary-chip green">
          <span>Max Put OI (Support)</span>
          <strong>{maxPutStrike} — {formatL(maxPutOi)}</strong>
        </div>
      </div>
      <p className="tool-subtitle">Open Interest distribution — Call OI (resistance) vs Put OI (support) per strike</p>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid stroke="#1e222b" vertical={false} />
          <XAxis dataKey="strike" stroke="#5d6575" fontSize={10} tickLine={false} />
          <YAxis tickFormatter={formatL} stroke="#5d6575" fontSize={11} tickLine={false} width={50} />
          <ReferenceLine x={Math.round(spot / 50) * 50} stroke="#6366f1" strokeDasharray="4 4" label={{ value: "ATM", fill: "#6366f1", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number, name: string) => [formatL(val), name]}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="callOi" name="Call OI" fill="#ef4444" radius={[3, 3, 0, 0]} fillOpacity={0.85} />
          <Bar dataKey="putOi" name="Put OI" fill="#10b981" radius={[3, 3, 0, 0]} fillOpacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
