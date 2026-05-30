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

interface PutCallRatioChartProps {
  symbol: string;
  currentPcr: number;
}

const generatePcrData = (currentPcr: number) => {
  let seed = currentPcr * 1000;
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

  let pcr = currentPcr * 0.85;
  return times.map((time) => {
    pcr = Math.max(0.5, Math.min(2.5, pcr + (rand() - 0.48) * 0.08));
    return {
      time,
      pcr: Number(pcr.toFixed(3)),
      callOi: Math.round(8000000 + rand() * 4000000),
      putOi: Math.round(8000000 * pcr + rand() * 4000000),
    };
  });
};

export function PutCallRatioChart({ symbol, currentPcr }: PutCallRatioChartProps) {
  const data = generatePcrData(currentPcr);
  const latest = data[data.length - 1];
  const pcrSignal =
    latest.pcr > 1.3 ? "Extremely Bullish" :
    latest.pcr > 1.1 ? "Bullish" :
    latest.pcr > 0.9 ? "Neutral" :
    latest.pcr > 0.7 ? "Bearish" : "Extremely Bearish";

  const signalColor =
    latest.pcr > 1.1 ? "#10b981" :
    latest.pcr < 0.9 ? "#ef4444" : "#6366f1";

  return (
    <div className="tool-section">
      <div className="tool-summary-row">
        <div className="summary-chip neutral">
          <span>Current PCR</span>
          <strong>{latest.pcr.toFixed(3)}</strong>
        </div>
        <div className="summary-chip neutral" style={{ borderColor: signalColor + "44" }}>
          <span>Signal</span>
          <strong style={{ color: signalColor }}>{pcrSignal}</strong>
        </div>
        <div className="summary-chip green">
          <span>Put OI</span>
          <strong>{(latest.putOi / 1000000).toFixed(2)}M</strong>
        </div>
        <div className="summary-chip red">
          <span>Call OI</span>
          <strong>{(latest.callOi / 1000000).toFixed(2)}M</strong>
        </div>
      </div>
      <p className="tool-subtitle">
        {symbol} — PCR intraday trend. PCR &gt; 1.2 = Bullish, PCR &lt; 0.8 = Bearish
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid stroke="#1e222b" vertical={false} />
          <XAxis dataKey="time" stroke="#5d6575" fontSize={11} tickLine={false} minTickGap={30} />
          <YAxis
            stroke="#5d6575"
            fontSize={11}
            tickLine={false}
            width={45}
            domain={[0.5, 2.5]}
            tickFormatter={(v) => v.toFixed(1)}
          />
          <ReferenceLine y={1.2} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Bullish 1.2", fill: "#10b981", fontSize: 10, position: "right" }} />
          <ReferenceLine y={0.8} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Bearish 0.8", fill: "#ef4444", fontSize: 10, position: "right" }} />
          <ReferenceLine y={1.0} stroke="#475569" strokeDasharray="2 4" />
          <Tooltip
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number) => [val.toFixed(3), "PCR"]}
          />
          <Line type="monotone" dataKey="pcr" name="PCR" stroke="#6366f1" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
