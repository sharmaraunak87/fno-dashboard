import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine
} from "recharts";

const sectors = [
  { name: "IT", momentum: 2.4, relStrength: 1.8, size: 18000 },
  { name: "Banking", momentum: -0.8, relStrength: -1.2, size: 32000 },
  { name: "Auto", momentum: 1.1, relStrength: 0.6, size: 12000 },
  { name: "Pharma", momentum: 0.3, relStrength: 1.4, size: 9000 },
  { name: "FMCG", momentum: -0.4, relStrength: 0.2, size: 14000 },
  { name: "Metal", momentum: 3.1, relStrength: 2.6, size: 7000 },
  { name: "Energy", momentum: -1.6, relStrength: -0.9, size: 22000 },
  { name: "Realty", momentum: 1.9, relStrength: 1.1, size: 5000 },
  { name: "Infra", momentum: 0.7, relStrength: -0.3, size: 8000 },
  { name: "Media", momentum: -2.1, relStrength: -1.8, size: 3000 },
];

const quadrantLabel = (x: number, y: number) => {
  if (x > 0 && y > 0) return "Leading";
  if (x < 0 && y > 0) return "Improving";
  if (x > 0 && y < 0) return "Weakening";
  return "Lagging";
};

const quadrantColor = (x: number, y: number) => {
  if (x > 0 && y > 0) return "#10b981";
  if (x < 0 && y > 0) return "#6366f1";
  if (x > 0 && y < 0) return "#f59e0b";
  return "#ef4444";
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  const color = quadrantColor(payload.momentum, payload.relStrength);
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={1.5} />
      <text x={cx} y={cy - 14} textAnchor="middle" fill={color} fontSize={11} fontWeight={700}>
        {payload.name}
      </text>
    </g>
  );
};

export function SectorRotationChart() {
  return (
    <div className="tool-section">
      <div className="sector-quadrant-legend">
        {[
          { label: "Leading", color: "#10b981" },
          { label: "Improving", color: "#6366f1" },
          { label: "Weakening", color: "#f59e0b" },
          { label: "Lagging", color: "#ef4444" },
        ].map((q) => (
          <span key={q.label} className="quadrant-chip" style={{ borderColor: q.color, color: q.color }}>
            {q.label}
          </span>
        ))}
      </div>
      <p className="tool-subtitle">Relative Rotation Graph — Momentum vs Relative Strength</p>
      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
          <CartesianGrid stroke="#1e222b" />
          <XAxis
            type="number"
            dataKey="momentum"
            name="Momentum"
            stroke="#5d6575"
            fontSize={11}
            tickLine={false}
            label={{ value: "Momentum →", position: "insideBottom", offset: -10, fill: "#64748b", fontSize: 11 }}
            domain={[-3.5, 3.5]}
          />
          <YAxis
            type="number"
            dataKey="relStrength"
            name="Relative Strength"
            stroke="#5d6575"
            fontSize={11}
            tickLine={false}
            width={55}
            label={{ value: "Rel. Strength →", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }}
            domain={[-3, 3]}
          />
          <ZAxis type="number" dataKey="size" range={[60, 200]} />
          <ReferenceLine x={0} stroke="#2a2e39" strokeWidth={1.5} />
          <ReferenceLine y={0} stroke="#2a2e39" strokeWidth={1.5} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number, name: string) => [val.toFixed(2), name]}
          />
          <Scatter data={sectors} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
