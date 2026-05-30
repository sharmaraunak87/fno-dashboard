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
import type { OptionRow } from "../types";

interface StraddleChartProps {
  options: OptionRow[];
  spot: number;
  symbol: string;
}

export function StraddleChart({ options, spot, symbol }: StraddleChartProps) {
  const atm = options.reduce(
    (best, opt) => Math.abs(opt.strike - spot) < Math.abs(best.strike - spot) ? opt : best,
    options[0] ?? { strike: Math.round(spot / 50) * 50, callIv: 14, putIv: 15, callOi: 0, putOi: 0, gamma: 0, delta: 0, volume: 0 }
  );

  let seed = spot;
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

  const baseIv = (atm.callIv + atm.putIv) / 2;
  const basePrem = baseIv * spot * 0.01 * Math.sqrt(7 / 365);

  const data = times.map((time, i) => {
    const progress = i / (times.length - 1);
    const decay = 1 - progress * 0.35;
    const noise = (rand() - 0.5) * basePrem * 0.08;
    const straddle = Number((basePrem * decay + noise).toFixed(2));
    const callPrem = Number((straddle * 0.48 + (rand() - 0.5) * 2).toFixed(2));
    const putPrem = Number((straddle - callPrem).toFixed(2));
    return { time, straddle, callPrem, putPrem };
  });

  const latest = data[data.length - 1];
  const first = data[0];
  const decayPct = Number(((first.straddle - latest.straddle) / first.straddle * 100).toFixed(1));

  return (
    <div className="tool-section">
      <div className="tool-summary-row">
        <div className="summary-chip neutral">
          <span>ATM Strike</span>
          <strong>{atm.strike}</strong>
        </div>
        <div className="summary-chip neutral">
          <span>Straddle Premium</span>
          <strong>₹{latest.straddle.toFixed(2)}</strong>
        </div>
        <div className="summary-chip red">
          <span>Theta Decay Today</span>
          <strong>-{decayPct}%</strong>
        </div>
      </div>
      <p className="tool-subtitle">{symbol} ATM {atm.strike} straddle — Intraday premium decay</p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="straddleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e222b" vertical={false} />
          <XAxis dataKey="time" stroke="#5d6575" fontSize={11} tickLine={false} minTickGap={40} />
          <YAxis stroke="#5d6575" fontSize={11} tickLine={false} width={50} tickFormatter={(v) => `₹${v}`} />
          <Tooltip
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number, name: string) => [`₹${val.toFixed(2)}`, name]}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Area type="monotone" dataKey="straddle" name="Straddle" stroke="#6366f1" fill="url(#straddleGrad)" strokeWidth={2.5} />
          <Area type="monotone" dataKey="callPrem" name="Call" stroke="#ef4444" fill="none" strokeWidth={1.5} strokeDasharray="4 3" />
          <Area type="monotone" dataKey="putPrem" name="Put" stroke="#10b981" fill="none" strokeWidth={1.5} strokeDasharray="4 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
