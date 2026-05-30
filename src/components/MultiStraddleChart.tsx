import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { OptionRow } from "../types";
import { CHART } from "../chartTheme";

interface MultiStraddleChartProps {
  options: OptionRow[];
  spot: number;
  symbol: string;
}

const LINE_COLORS = ["#ef4444", "#10b981", "#6366f1", "#f59e0b", "#ec4899"];

function getAtmStrikes(options: OptionRow[], spot: number, count: number): number[] {
  return [...options]
    .sort((a, b) => Math.abs(a.strike - spot) - Math.abs(b.strike - spot))
    .slice(0, count)
    .map((o) => o.strike)
    .sort((a, b) => a - b);
}

const generateStraddleData = (options: OptionRow[], spot: number, strikes: number[]) => {
  let seed = spot;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const times: string[] = [];
  for (let h = 9; h <= 15; h++) {
    const maxMin = h === 15 ? 30 : 55;
    for (let m = (h === 9 ? 15 : 0); m <= maxMin; m += 5) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }


  const optMap = new Map(options.map((o) => [o.strike, o]));

  return times.map((time) => {
    const point: Record<string, any> = { time };
    strikes.forEach((strike) => {
      const opt = optMap.get(strike);
      const baseIv = opt ? (opt.callIv + opt.putIv) / 2 : 14;
      const basePrem = baseIv * spot * 0.01 * Math.sqrt(7 / 365);
      const decay = 1 - (times.indexOf(time) / times.length) * 0.3;
      const noise = (rand() - 0.5) * basePrem * 0.1;
      point[`${strike} Straddle`] = Number((basePrem * decay + noise).toFixed(2));
    });
    return point;
  });
};

export function MultiStraddleChart({ options, spot, symbol }: MultiStraddleChartProps) {
  const strikes = getAtmStrikes(options, spot, 5);
  const data = generateStraddleData(options, spot, strikes);

  return (
    <div className="tool-section">
      <p className="tool-subtitle">
        {symbol} — Straddle premium (Call + Put) intraday decay for top 5 near-ATM strikes
      </p>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="time" stroke={CHART.axis} fontSize={11} tickLine={false} minTickGap={40} />
          <YAxis stroke={CHART.axis} fontSize={11} tickLine={false} width={50} tickFormatter={(v) => `₹${v}`} />
          <Tooltip contentStyle={CHART.tooltip}
            formatter={(val: number, name: string) => [`₹${val.toFixed(2)}`, name]}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          {strikes.map((strike, idx) => (
            <Line
              key={strike}
              type="monotone"
              dataKey={`${strike} Straddle`}
              stroke={LINE_COLORS[idx % LINE_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
