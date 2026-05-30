import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface IndexWeightageProps {
  symbol: string;
}

const niftySectors = [
  { name: "Financial Services", value: 33.2, color: "#6366f1" },
  { name: "IT", value: 13.8, color: "#10b981" },
  { name: "Oil & Gas", value: 12.4, color: "#f59e0b" },
  { name: "Consumer Goods", value: 8.6, color: "#ec4899" },
  { name: "Automobile", value: 7.1, color: "#06b6d4" },
  { name: "Pharma", value: 5.9, color: "#a855f7" },
  { name: "Metals", value: 4.2, color: "#ef4444" },
  { name: "Others", value: 14.8, color: "#475569" },
];

const bankNiftySectors = [
  { name: "Private Banks", value: 76.5, color: "#6366f1" },
  { name: "Public Banks", value: 14.2, color: "#10b981" },
  { name: "Small Finance", value: 5.8, color: "#f59e0b" },
  { name: "Others", value: 3.5, color: "#475569" },
];

const finNiftySectors = [
  { name: "Banks", value: 53.7, color: "#6366f1" },
  { name: "NBFCs", value: 22.4, color: "#10b981" },
  { name: "Insurance", value: 14.8, color: "#f59e0b" },
  { name: "Others", value: 9.1, color: "#475569" },
];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export function IndexWeightage({ symbol }: IndexWeightageProps) {
  const data =
    symbol === "BANKNIFTY" ? bankNiftySectors :
    symbol === "FINNIFTY" ? finNiftySectors :
    niftySectors;

  return (
    <div className="tool-section">
      <p className="tool-subtitle">Sector-wise weight distribution in {symbol} index</p>
      <ResponsiveContainer width="100%" height={340}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={130}
            innerRadius={60}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number) => [`${val.toFixed(1)}%`, "Weight"]}
          />
          <Legend
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
