import { useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Bar,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from "recharts";

interface FutureIntradayProps {
  symbol: string;
  spot: number;
}

const FUTURES = ["Near Month", "Mid Month", "Far Month"];

const generateFutureData = (spot: number, premium: number) => {
  let seed = spot + premium;
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

  let price = spot + premium;
  let oi = 2000000;
  return times.map((time) => {
    price = Number((price + (rand() - 0.49) * 25).toFixed(2));
    oi = Math.round(oi + (rand() - 0.48) * 50000);
    const basis = Number((price - spot).toFixed(2));
    return { time, price, oi: Math.round(oi / 1000), basis };
  });
};

export function FutureIntraday({ symbol, spot }: FutureIntradayProps) {
  const [selectedFuture, setSelectedFuture] = useState(0);
  const premiums = [45, 90, 135];
  const data = generateFutureData(spot, premiums[selectedFuture]);
  const latest = data[data.length - 1];
  const first = data[0];
  const change = Number((latest.price - first.price).toFixed(2));

  return (
    <div className="tool-section">
      <div className="toggle-tab-group" style={{ width: "fit-content", marginBottom: "12px" }}>
        {FUTURES.map((f, i) => (
          <button
            key={f}
            className={selectedFuture === i ? "active" : ""}
            onClick={() => setSelectedFuture(i)}
            type="button"
          >
            {f}
          </button>
        ))}
      </div>

      <div className="tool-summary-row">
        <div className="summary-chip neutral">
          <span>Futures Price</span>
          <strong>{latest.price.toLocaleString("en-IN")}</strong>
        </div>
        <div className={`summary-chip ${change >= 0 ? "green" : "red"}`}>
          <span>Change</span>
          <strong>{change >= 0 ? "+" : ""}{change}</strong>
        </div>
        <div className="summary-chip neutral">
          <span>Basis (Fut - Spot)</span>
          <strong>{latest.basis > 0 ? "+" : ""}{latest.basis}</strong>
        </div>
        <div className="summary-chip neutral">
          <span>OI</span>
          <strong>{latest.oi}K</strong>
        </div>
      </div>

      <p className="tool-subtitle">{symbol} {FUTURES[selectedFuture]} Futures — Price & OI intraday</p>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 50, left: 10, bottom: 5 }}>
          <CartesianGrid stroke="#1e222b" vertical={false} />
          <XAxis dataKey="time" stroke="#5d6575" fontSize={11} tickLine={false} minTickGap={30} />
          <YAxis
            yAxisId="price"
            orientation="left"
            stroke="#10b981"
            fontSize={11}
            tickLine={false}
            width={65}
            domain={["dataMin - 20", "dataMax + 20"]}
            tickFormatter={(v) => v.toLocaleString("en-IN")}
          />
          <YAxis
            yAxisId="oi"
            orientation="right"
            stroke="#6366f1"
            fontSize={11}
            tickLine={false}
            width={45}
            tickFormatter={(v) => `${v}K`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number, name: string) =>
              name === "Price" ? [val.toLocaleString("en-IN"), name] : [`${val}K`, name]
            }
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar yAxisId="oi" dataKey="oi" name="OI (K)" fill="rgba(99,102,241,0.3)" radius={[2, 2, 0, 0]} />
          <Line yAxisId="price" type="monotone" dataKey="price" name="Price" stroke="#10b981" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
