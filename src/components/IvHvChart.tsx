import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface IvHvChartProps {
  symbol: string;
  currentIv: number;
}

const generateIvHvData = (baseIv: number) => {
  let seed = baseIv * 100;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const days = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }));
  }

  let iv = baseIv;
  let hv = baseIv * 0.85;
  return days.map((date) => {
    iv = Math.max(8, Math.min(35, iv + (rand() - 0.5) * 1.5));
    hv = Math.max(6, Math.min(30, hv + (rand() - 0.5) * 0.8));
    const ivp = Math.round(((iv - 8) / (35 - 8)) * 100);
    return {
      date,
      iv: Number(iv.toFixed(2)),
      hv: Number(hv.toFixed(2)),
      ivp,
    };
  });
};

export function IvHvChart({ symbol, currentIv }: IvHvChartProps) {
  const data = generateIvHvData(currentIv);
  const latest = data[data.length - 1];
  const ivPremium = Number((latest.iv - latest.hv).toFixed(2));

  return (
    <div className="tool-section">
      <div className="tool-summary-row">
        <div className="summary-chip neutral">
          <span>Current IV</span>
          <strong>{latest.iv}%</strong>
        </div>
        <div className="summary-chip neutral">
          <span>30D HV</span>
          <strong>{latest.hv}%</strong>
        </div>
        <div className={`summary-chip ${ivPremium > 0 ? "red" : "green"}`}>
          <span>IV Premium</span>
          <strong>{ivPremium > 0 ? "+" : ""}{ivPremium}%</strong>
        </div>
        <div className="summary-chip neutral">
          <span>IVP</span>
          <strong>{latest.ivp}%</strong>
        </div>
      </div>
      <p className="tool-subtitle">{symbol} — 30-day IV vs Historical Volatility comparison</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid stroke="#1e222b" vertical={false} />
          <XAxis dataKey="date" stroke="#5d6575" fontSize={10} tickLine={false} minTickGap={40} />
          <YAxis stroke="#5d6575" fontSize={11} tickLine={false} width={40} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number, name: string) => [`${val.toFixed(2)}%`, name]}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Line type="monotone" dataKey="iv" name="IV (Implied)" stroke="#6366f1" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="hv" name="HV (Historical)" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
