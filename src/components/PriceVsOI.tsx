import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface PriceVsOIProps {
  symbol: string;
  spot: number;
}

const generatePriceOiData = (spot: number) => {
  let seed = spot;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const times = [];
  for (let h = 9; h <= 15; h++) {
    const maxMin = h === 15 ? 30 : 55;
    for (let m = (h === 9 ? 15 : 0); m <= maxMin; m += 15) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  let price = spot;
  let totalOi = 8000000;
  return times.map((time) => {
    price = Number((price + (rand() - 0.49) * 30).toFixed(2));
    totalOi = Math.round(totalOi + (rand() - 0.45) * 200000);
    return {
      time,
      price,
      totalOi: Math.round(totalOi / 100000),
    };
  });
};

const formatL = (v: number) => `${v}L`;

export function PriceVsOI({ symbol, spot }: PriceVsOIProps) {
  const data = generatePriceOiData(spot);
  const first = data[0];
  const last = data[data.length - 1];
  const priceChange = Number((last.price - first.price).toFixed(2));
  const oiChange = last.totalOi - first.totalOi;

  const interpretation =
    priceChange > 0 && oiChange > 0 ? "Long Build-up (Bullish)" :
    priceChange < 0 && oiChange > 0 ? "Short Build-up (Bearish)" :
    priceChange > 0 && oiChange < 0 ? "Short Covering (Bullish)" :
    "Long Unwinding (Bearish)";

  return (
    <div className="tool-section">
      <div className="tool-summary-row">
        <div className={`summary-chip ${priceChange >= 0 ? "green" : "red"}`}>
          <span>Price Change</span>
          <strong>{priceChange >= 0 ? "+" : ""}{priceChange}</strong>
        </div>
        <div className={`summary-chip ${oiChange >= 0 ? "green" : "red"}`}>
          <span>OI Change</span>
          <strong>{oiChange >= 0 ? "+" : ""}{oiChange}L</strong>
        </div>
        <div className="summary-chip neutral">
          <span>Signal</span>
          <strong style={{ fontSize: "11px" }}>{interpretation}</strong>
        </div>
      </div>
      <p className="tool-subtitle">{symbol} — Price vs Total OI intraday overlay</p>
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
            tickFormatter={formatL}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number, name: string) =>
              name === "Price" ? [val.toLocaleString("en-IN"), name] : [`${val}L`, name]
            }
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar yAxisId="oi" dataKey="totalOi" name="Total OI (L)" fill="rgba(99,102,241,0.3)" radius={[2, 2, 0, 0]} />
          <Line yAxisId="price" type="monotone" dataKey="price" name="Price" stroke="#10b981" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
