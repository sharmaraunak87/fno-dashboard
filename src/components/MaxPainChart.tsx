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

interface MaxPainChartProps {
  options: OptionRow[];
  spot: number;
}

function calcMaxPain(options: OptionRow[]): { strike: number; totalPain: number }[] {
  return options.map((target) => {
    let totalPain = 0;
    options.forEach((opt) => {
      // Call writers lose when price > strike
      if (target.strike > opt.strike) {
        totalPain += (target.strike - opt.strike) * opt.callOi;
      }
      // Put writers lose when price < strike
      if (target.strike < opt.strike) {
        totalPain += (opt.strike - target.strike) * opt.putOi;
      }
    });
    return { strike: target.strike, totalPain };
  });
}

const formatCr = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  return `${(v / 1000).toFixed(0)}K`;
};

export function MaxPainChart({ options, spot }: MaxPainChartProps) {
  if (!options.length) return <div className="empty-state">No options data available.</div>;

  const painData = calcMaxPain(options);
  const minPain = painData.reduce((best, d) => d.totalPain < best.totalPain ? d : best, painData[0]);
  const maxPainStrike = minPain.strike;

  return (
    <div className="tool-section">
      <div className="tool-summary-row">
        <div className="summary-chip neutral">
          <span>Max Pain Strike</span>
          <strong style={{ color: "#6366f1" }}>{maxPainStrike}</strong>
        </div>
        <div className="summary-chip neutral">
          <span>Current Spot</span>
          <strong>{spot.toLocaleString("en-IN")}</strong>
        </div>
        <div className={`summary-chip ${spot > maxPainStrike ? "red" : "green"}`}>
          <span>Distance</span>
          <strong>{spot > maxPainStrike ? "+" : ""}{(spot - maxPainStrike).toFixed(0)} pts</strong>
        </div>
      </div>
      <p className="tool-subtitle">
        Max Pain = strike where option writers lose the least. Market tends to gravitate here near expiry.
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={painData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid stroke="#1e222b" vertical={false} />
          <XAxis dataKey="strike" stroke="#5d6575" fontSize={10} tickLine={false} />
          <YAxis tickFormatter={formatCr} stroke="#5d6575" fontSize={11} tickLine={false} width={55} />
          <ReferenceLine x={maxPainStrike} stroke="#6366f1" strokeWidth={2} label={{ value: "Max Pain", fill: "#6366f1", fontSize: 11 }} />
          <ReferenceLine x={Math.round(spot / 50) * 50} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Spot", fill: "#10b981", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number) => [formatCr(val), "Total Writer Pain"]}
          />
          <Bar dataKey="totalPain" name="Writer Pain" radius={[3, 3, 0, 0]}>
            {painData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.strike === maxPainStrike ? "#6366f1" : "rgba(99,102,241,0.35)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
