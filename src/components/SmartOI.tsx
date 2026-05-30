import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine
} from "recharts";
import type { OptionRow } from "../types";

interface SmartOIProps {
  options: OptionRow[];
  spot: number;
}

const formatL = (val: number) => {
  const abs = Math.abs(val);
  if (abs >= 100000) return `${(val / 100000).toFixed(1)}L`;
  return `${(val / 1000).toFixed(0)}K`;
};

export function SmartOI({ options, spot }: SmartOIProps) {
  // Simulate OI change (in real app this would come from prev snapshot diff)
  let seed = spot;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const data = options
    .filter((opt) => Math.abs(opt.strike - spot) <= 400)
    .map((opt) => {
      const callOiChange = Math.round((rand() - 0.42) * opt.callOi * 0.3);
      const putOiChange = Math.round((rand() - 0.42) * opt.putOi * 0.3);
      return {
        strike: opt.strike,
        callOiChange,
        putOiChange,
        isAtm: Math.abs(opt.strike - spot) < 30,
      };
    });

  const totalCallBuild = data.filter((d) => d.callOiChange > 0).reduce((s, d) => s + d.callOiChange, 0);
  const totalPutBuild = data.filter((d) => d.putOiChange > 0).reduce((s, d) => s + d.putOiChange, 0);
  const sentiment = totalPutBuild > totalCallBuild ? "Bullish" : "Bearish";

  return (
    <div className="tool-section">
      <div className="tool-summary-row">
        <div className="summary-chip green">
          <span>Put Build-up</span>
          <strong>+{formatL(totalPutBuild)}</strong>
        </div>
        <div className="summary-chip red">
          <span>Call Build-up</span>
          <strong>+{formatL(totalCallBuild)}</strong>
        </div>
        <div className={`summary-chip ${sentiment === "Bullish" ? "green" : "red"}`}>
          <span>Smart OI Signal</span>
          <strong>{sentiment}</strong>
        </div>
      </div>
      <p className="tool-subtitle">OI change per strike — Green = buildup, Red = unwinding</p>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid stroke="#1e222b" vertical={false} />
          <XAxis dataKey="strike" stroke="#5d6575" fontSize={10} tickLine={false} />
          <YAxis tickFormatter={formatL} stroke="#5d6575" fontSize={11} tickLine={false} width={50} />
          <ReferenceLine y={0} stroke="#475569" />
          <Tooltip
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number, name: string) => [formatL(val), name]}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="callOiChange" name="Call OI Δ" radius={[3, 3, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.callOiChange >= 0 ? "#ef4444" : "#10b981"} />
            ))}
          </Bar>
          <Bar dataKey="putOiChange" name="Put OI Δ" radius={[3, 3, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.putOiChange >= 0 ? "#10b981" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
