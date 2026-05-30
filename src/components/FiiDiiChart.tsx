import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { CHART } from "../chartTheme";

// Mock FII/DII daily cash data (in crores)
const generateFiiDiiData = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Mon", "Tue", "Wed", "Thu", "Fri"];
  let seed = 77;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  return days.map((day, i) => ({
    day: `${day} W${Math.floor(i / 5) + 1}`,
    fiiBuy: Math.round(8000 + rand() * 12000),
    fiiSell: Math.round(7000 + rand() * 11000),
    diiBuy: Math.round(5000 + rand() * 8000),
    diiSell: Math.round(4500 + rand() * 7500),
  }));
};

const data = generateFiiDiiData();

const enriched = data.map((d) => ({
  ...d,
  fiiNet: d.fiiBuy - d.fiiSell,
  diiNet: d.diiBuy - d.diiSell,
}));

const formatCr = (val: number) => {
  const abs = Math.abs(val);
  if (abs >= 1000) return `${(val / 1000).toFixed(1)}K Cr`;
  return `${val} Cr`;
};

export function FiiDiiCashChart() {
  return (
    <div className="tool-section">
      <div className="tool-summary-row">
        {["FII Net", "DII Net"].map((label, i) => {
          const net = enriched.reduce((s, d) => s + (i === 0 ? d.fiiNet : d.diiNet), 0);
          return (
            <div key={label} className={`summary-chip ${net >= 0 ? "green" : "red"}`}>
              <span>{label}</span>
              <strong>{net >= 0 ? "+" : ""}{formatCr(net)}</strong>
            </div>
          );
        })}
      </div>

      <p className="tool-subtitle">Net Buy/Sell activity (₹ Crores) — Last 10 trading sessions</p>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={enriched} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="day" stroke={CHART.axis} fontSize={11} tickLine={false} />
          <YAxis tickFormatter={formatCr} stroke={CHART.axis} fontSize={11} tickLine={false} width={70} />
          <Tooltip formatter={(val: number, name: string) => [formatCr(val), name]} contentStyle={CHART.tooltip} />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="fiiNet" name="FII Net" radius={[4, 4, 0, 0]}>
            {enriched.map((entry, idx) => (
              <Cell key={idx} fill={entry.fiiNet >= 0 ? "#10b981" : "#ef4444"} />
            ))}
          </Bar>
          <Bar dataKey="diiNet" name="DII Net" radius={[4, 4, 0, 0]}>
            {enriched.map((entry, idx) => (
              <Cell key={idx} fill={entry.diiNet >= 0 ? "#6366f1" : "#f59e0b"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
