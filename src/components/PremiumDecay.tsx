import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { OptionRow } from "../types";

interface PremiumDecayProps {
  options: OptionRow[];
  spot: number;
}

function blackScholesApprox(S: number, K: number, T: number, iv: number, isCall: boolean): number {
  if (T <= 0) return Math.max(0, isCall ? S - K : K - S);
  const sigma = iv / 100;
  const d1 = (Math.log(S / K) + 0.5 * sigma * sigma * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const N = (x: number) => 0.5 * (1 + Math.sign(x) * (1 - Math.exp(-0.7 * x * x)));
  if (isCall) return S * N(d1) - K * N(d2);
  return K * N(-d2) - S * N(-d1);
}

export function PremiumDecay({ options, spot }: PremiumDecayProps) {
  const atm = options.reduce((best, opt) =>
    Math.abs(opt.strike - spot) < Math.abs(best.strike - spot) ? opt : best,
    options[0] ?? { strike: Math.round(spot / 50) * 50, callIv: 14, putIv: 15, callOi: 0, putOi: 0, gamma: 0, delta: 0, volume: 0 }
  );

  const daysToExpiry = 7;
  const data = [];

  for (let daysLeft = daysToExpiry; daysLeft >= 0; daysLeft--) {
    const T = daysLeft / 365;
    const callPrem = blackScholesApprox(spot, atm.strike, T, atm.callIv, true);
    const putPrem = blackScholesApprox(spot, atm.strike, T, atm.putIv, false);
    const straddlePrem = callPrem + putPrem;
    data.push({
      day: daysLeft === 0 ? "Expiry" : `${daysLeft}D`,
      callPremium: Number(callPrem.toFixed(2)),
      putPremium: Number(putPrem.toFixed(2)),
      straddlePremium: Number(straddlePrem.toFixed(2)),
    });
  }

  data.reverse();

  const todayIdx = data.length - 1;
  const todayData = data[todayIdx];

  return (
    <div className="tool-section">
      <div className="tool-summary-row">
        <div className="summary-chip neutral">
          <span>ATM Strike</span>
          <strong>{atm.strike}</strong>
        </div>
        <div className="summary-chip red">
          <span>Call Premium</span>
          <strong>₹{todayData?.callPremium.toFixed(2)}</strong>
        </div>
        <div className="summary-chip green">
          <span>Put Premium</span>
          <strong>₹{todayData?.putPremium.toFixed(2)}</strong>
        </div>
        <div className="summary-chip neutral">
          <span>Straddle</span>
          <strong>₹{todayData?.straddlePremium.toFixed(2)}</strong>
        </div>
      </div>
      <p className="tool-subtitle">Theta decay curve — ATM option premium erosion over {daysToExpiry} days to expiry</p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="callDecayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="putDecayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e222b" vertical={false} />
          <XAxis dataKey="day" stroke="#5d6575" fontSize={11} tickLine={false} />
          <YAxis stroke="#5d6575" fontSize={11} tickLine={false} width={50} tickFormatter={(v) => `₹${v}`} />
          <Tooltip
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number, name: string) => [`₹${val.toFixed(2)}`, name]}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Area type="monotone" dataKey="callPremium" name="Call Premium" stroke="#ef4444" fill="url(#callDecayGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="putPremium" name="Put Premium" stroke="#10b981" fill="url(#putDecayGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="straddlePremium" name="Straddle" stroke="#6366f1" fill="none" strokeWidth={2} strokeDasharray="5 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
