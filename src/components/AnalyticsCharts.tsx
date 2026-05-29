import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { OptionRow } from "../types";

// Helper to format values compactly
const formatCompact = (val: number) => {
  return Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(val);
};

// 1. Price and PCR Chart
interface PricePcrChartProps {
  history: Array<{ time: string; spot: number; pcr: number }>;
}

export function PricePcrChart({ history }: PricePcrChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={history}>
        <defs>
          <linearGradient id="colorSpot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1e222b" vertical={false} />
        <XAxis dataKey="time" minTickGap={25} stroke="#5d6575" fontSize={11} tickLine={false} />
        <YAxis
          yAxisId="spot"
          domain={["dataMin - 50", "dataMax + 50"]}
          stroke="#5d6575"
          fontSize={11}
          tickLine={false}
          width={65}
        />
        <YAxis
          yAxisId="pcr"
          orientation="right"
          domain={["dataMin - 0.1", "dataMax + 0.1"]}
          stroke="#5d6575"
          fontSize={11}
          tickLine={false}
          width={45}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#15171e", borderColor: "#2a2e39", color: "#d9d9d9" }}
        />
        <Area yAxisId="spot" type="monotone" dataKey="spot" fill="url(#colorSpot)" stroke="#10b981" strokeWidth={2} name="Spot Price" />
        <Line yAxisId="pcr" type="monotone" dataKey="pcr" stroke="#d26b30" strokeWidth={2} dot={false} name="PCR" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// 2. Call vs Put OI Summary
interface CallPutOiChartProps {
  callOi: number;
  putOi: number;
}

export function CallPutOiChart({ callOi, putOi }: CallPutOiChartProps) {
  const data = [
    { name: "Calls (Resistance)", value: callOi, color: "#ef4444" },
    { name: "Puts (Support)", value: putOi, color: "#10b981" }
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid stroke="#1e222b" vertical={false} />
        <XAxis dataKey="name" stroke="#5d6575" fontSize={11} tickLine={false} />
        <YAxis
          tickFormatter={formatCompact}
          stroke="#5d6575"
          fontSize={11}
          tickLine={false}
          width={50}
        />
        <Tooltip
          formatter={(value) => formatCompact(Number(value))}
          contentStyle={{ backgroundColor: "#15171e", borderColor: "#2a2e39", color: "#d9d9d9" }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// 3. Multi-Strike OI Comparison (Horizontal or Vertical comparison)
interface StrikeOiChartProps {
  options: OptionRow[];
  spot: number;
}

export function StrikeOiChart({ options, spot }: StrikeOiChartProps) {
  // Take nearest 8 strikes around spot for charting
  const sortedOptions = [...options]
    .sort((a, b) => Math.abs(a.strike - spot) - Math.abs(b.strike - spot))
    .slice(0, 8)
    .sort((a, b) => a.strike - b.strike);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={sortedOptions} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid stroke="#1e222b" vertical={false} />
        <XAxis dataKey="strike" stroke="#5d6575" fontSize={11} tickLine={false} />
        <YAxis
          tickFormatter={formatCompact}
          stroke="#5d6575"
          fontSize={11}
          tickLine={false}
          width={50}
        />
        <Tooltip
          formatter={(value) => Number(value).toLocaleString("en-IN")}
          contentStyle={{ backgroundColor: "#15171e", borderColor: "#2a2e39", color: "#d9d9d9" }}
        />
        <Bar dataKey="callOi" name="Call OI" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="putOi" name="Put OI" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 4. IV Skew (Volatility Smile) Chart
export function IvSkewChart({ options, spot }: StrikeOiChartProps) {
  const sortedOptions = [...options]
    .sort((a, b) => Math.abs(a.strike - spot) - Math.abs(b.strike - spot))
    .slice(0, 10)
    .sort((a, b) => a.strike - b.strike);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={sortedOptions} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid stroke="#1e222b" horizontal={true} vertical={false} />
        <XAxis dataKey="strike" stroke="#5d6575" fontSize={11} tickLine={false} />
        <YAxis
          stroke="#5d6575"
          fontSize={11}
          tickLine={false}
          tickFormatter={(val) => `${val}%`}
          width={45}
        />
        <Tooltip
          formatter={(value) => `${Number(value).toFixed(1)}%`}
          contentStyle={{ backgroundColor: "#15171e", borderColor: "#2a2e39", color: "#d9d9d9" }}
        />
        <Line type="monotone" dataKey="callIv" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Call IV" />
        <Line type="monotone" dataKey="putIv" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Put IV" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 5. Gamma Exposure (Heatmap-like list)
interface GammaHeatmapProps {
  options: OptionRow[];
  spot: number;
}

export function GammaHeatmap({ options, spot }: GammaHeatmapProps) {
  const sortedOptions = [...options]
    .sort((a, b) => Math.abs(a.strike - spot) - Math.abs(b.strike - spot))
    .slice(0, 8)
    .sort((a, b) => a.strike - b.strike);

  const maxGamma = Math.max(...sortedOptions.map((row) => row.gamma), 0.0001);

  return (
    <div className="gamma-heatmap-grid">
      {sortedOptions.map((row) => {
        const ratio = row.gamma / maxGamma;
        // Background opacity based on ratio
        const opacity = Math.max(0.15, ratio);
        return (
          <div
            className="gamma-cell"
            key={row.strike}
            style={{
              background: `rgba(99, 102, 241, ${opacity * 0.35})`,
              borderLeft: `4px solid rgba(99, 102, 241, ${opacity})`
            }}
          >
            <span className="gamma-strike">{row.strike}</span>
            <strong className="gamma-value">{row.gamma.toFixed(5)}</strong>
            <span className="gamma-pct">{Math.round(ratio * 100)}% of Max</span>
          </div>
        );
      })}
    </div>
  );
}
