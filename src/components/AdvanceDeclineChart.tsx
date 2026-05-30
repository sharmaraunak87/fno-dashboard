import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { CHART } from "../chartTheme";

const generateAdData = () => {
  let seed = 55;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const times = [];
  for (let h = 9; h <= 15; h++) {
    const maxMin = h === 15 ? 30 : 55;
    for (let m = (h === 9 ? 15 : 0); m <= maxMin; m += 5) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  let advances = 25;
  let declines = 25;
  return times.map((time) => {
    advances = Math.max(5, Math.min(45, advances + Math.round((rand() - 0.48) * 6)));
    declines = 50 - advances;
    return {
      time,
      advances,
      declines,
      adRatio: Number((advances / Math.max(1, declines)).toFixed(2)),
    };
  });
};

const data = generateAdData();

export function AdvanceDeclineChart() {
  const latest = data[data.length - 1];

  return (
    <div className="tool-section">
      <div className="tool-summary-row">
        <div className="summary-chip green">
          <span>Advances</span>
          <strong>{latest.advances}</strong>
        </div>
        <div className="summary-chip red">
          <span>Declines</span>
          <strong>{latest.declines}</strong>
        </div>
        <div className="summary-chip neutral">
          <span>A/D Ratio</span>
          <strong>{latest.adRatio}</strong>
        </div>
      </div>
      <p className="tool-subtitle">Nifty 50 — Advances vs Declines intraday (out of 50 stocks)</p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="advGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="decGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="time" stroke={CHART.axis} fontSize={11} tickLine={false} minTickGap={30} />
          <YAxis stroke={CHART.axis} fontSize={11} tickLine={false} width={35} domain={[0, 50]} />
          <Tooltip contentStyle={CHART.tooltip} />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Area type="monotone" dataKey="advances" name="Advances" stroke="#10b981" fill="url(#advGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="declines" name="Declines" stroke="#ef4444" fill="url(#decGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
