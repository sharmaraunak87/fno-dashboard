import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { CHART } from "../chartTheme";

interface IndexContributorsProps {
  symbol: string;
}

const niftyStocks = [
  { name: "RELIANCE", weight: 9.8, change: 1.2 },
  { name: "HDFC BANK", weight: 8.4, change: -0.6 },
  { name: "INFOSYS", weight: 6.2, change: 2.1 },
  { name: "ICICI BANK", weight: 5.9, change: 0.8 },
  { name: "TCS", weight: 5.1, change: 1.5 },
  { name: "KOTAK BANK", weight: 3.8, change: -1.1 },
  { name: "LT", weight: 3.4, change: 0.4 },
  { name: "AXIS BANK", weight: 3.1, change: -0.3 },
  { name: "BAJFINANCE", weight: 2.9, change: 2.8 },
  { name: "HCLTECH", weight: 2.7, change: 1.9 },
];

const bankNiftyStocks = [
  { name: "HDFC BANK", weight: 28.4, change: -0.6 },
  { name: "ICICI BANK", weight: 22.1, change: 0.8 },
  { name: "KOTAK BANK", weight: 14.2, change: -1.1 },
  { name: "AXIS BANK", weight: 11.8, change: -0.3 },
  { name: "SBI", weight: 8.6, change: 1.4 },
  { name: "INDUSIND", weight: 5.2, change: -2.1 },
  { name: "BANDHAN", weight: 3.1, change: 0.9 },
  { name: "FEDERALBNK", weight: 2.4, change: 0.5 },
];

const finNiftyStocks = [
  { name: "HDFC BANK", weight: 19.2, change: -0.6 },
  { name: "ICICI BANK", weight: 15.8, change: 0.8 },
  { name: "BAJFINANCE", weight: 12.4, change: 2.8 },
  { name: "KOTAK BANK", weight: 10.1, change: -1.1 },
  { name: "AXIS BANK", weight: 8.6, change: -0.3 },
  { name: "SBILIFE", weight: 6.2, change: 1.2 },
  { name: "HDFCLIFE", weight: 5.8, change: 0.7 },
  { name: "BAJAJFINSV", weight: 4.9, change: -0.8 },
];

export function IndexContributors({ symbol }: IndexContributorsProps) {
  const stocks =
    symbol === "BANKNIFTY" ? bankNiftyStocks :
    symbol === "FINNIFTY" ? finNiftyStocks :
    niftyStocks;

  const data = stocks.map((s) => ({
    ...s,
    contribution: Number((s.weight * s.change / 100).toFixed(3)),
  })).sort((a, b) => b.contribution - a.contribution);

  return (
    <div className="tool-section">
      <p className="tool-subtitle">Point contribution of top constituents to {symbol} movement today</p>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 80, bottom: 5 }}>
          <CartesianGrid stroke={CHART.grid} horizontal={false} />
          <XAxis type="number" stroke={CHART.axis} fontSize={11} tickLine={false} tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(2)}`} />
          <YAxis type="category" dataKey="name" stroke={CHART.axis} fontSize={11} tickLine={false} width={80} />
          <Tooltip contentStyle={CHART.tooltip} formatter={(val: number) => [`${val > 0 ? "+" : ""}${val.toFixed(3)} pts`, "Contribution"]} />
          <Bar dataKey="contribution" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.contribution >= 0 ? "#10b981" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
