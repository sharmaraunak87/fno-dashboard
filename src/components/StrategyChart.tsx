import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { OptionRow } from "../types";

interface StrategyChartProps {
  options: OptionRow[];
  spot: number;
}

type Strategy = "long_call" | "long_put" | "bull_spread" | "bear_spread" | "long_straddle" | "iron_condor";

const STRATEGIES: { value: Strategy; label: string }[] = [
  { value: "long_call", label: "Long Call" },
  { value: "long_put", label: "Long Put" },
  { value: "bull_spread", label: "Bull Call Spread" },
  { value: "bear_spread", label: "Bear Put Spread" },
  { value: "long_straddle", label: "Long Straddle" },
  { value: "iron_condor", label: "Iron Condor" },
];

function getAtmStrike(options: OptionRow[], spot: number): number {
  if (!options.length) return Math.round(spot / 50) * 50;
  return options.reduce((best, opt) =>
    Math.abs(opt.strike - spot) < Math.abs(best.strike - spot) ? opt : best
  ).strike;
}

function calcPayoff(strategy: Strategy, spot: number, atmStrike: number, atmCallPremium: number, atmPutPremium: number): Array<{ price: number; pnl: number }> {
  const range = spot * 0.06;
  const step = range / 40;
  const points = [];

  for (let price = spot - range; price <= spot + range; price += step) {
    let pnl = 0;
    const otmCall = atmStrike + 100;
    const otmPut = atmStrike - 100;
    const otmCallPrem = atmCallPremium * 0.5;
    const otmPutPrem = atmPutPremium * 0.5;

    switch (strategy) {
      case "long_call":
        pnl = Math.max(0, price - atmStrike) - atmCallPremium;
        break;
      case "long_put":
        pnl = Math.max(0, atmStrike - price) - atmPutPremium;
        break;
      case "bull_spread":
        pnl = Math.max(0, price - atmStrike) - atmCallPremium
            - Math.max(0, price - otmCall) + otmCallPrem;
        break;
      case "bear_spread":
        pnl = Math.max(0, atmStrike - price) - atmPutPremium
            - Math.max(0, otmPut - price) + otmPutPrem;
        break;
      case "long_straddle":
        pnl = Math.max(0, price - atmStrike) + Math.max(0, atmStrike - price)
            - atmCallPremium - atmPutPremium;
        break;
      case "iron_condor":
        pnl = otmCallPrem + otmPutPrem
            - Math.max(0, price - otmCall)
            - Math.max(0, otmPut - price);
        break;
    }
    points.push({ price: Number(price.toFixed(0)), pnl: Number(pnl.toFixed(2)) });
  }
  return points;
}

export function StrategyChart({ options, spot }: StrategyChartProps) {
  const [strategy, setStrategy] = useState<Strategy>("long_straddle");

  const atm = getAtmStrike(options, spot);
  const atmOpt = options.find((o) => o.strike === atm);
  const callPrem = atmOpt ? Number((atmOpt.callIv * spot * 0.01 * Math.sqrt(7 / 365)).toFixed(2)) : 80;
  const putPrem = atmOpt ? Number((atmOpt.putIv * spot * 0.01 * Math.sqrt(7 / 365)).toFixed(2)) : 85;

  const payoff = calcPayoff(strategy, spot, atm, callPrem, putPrem);
  const maxProfit = Math.max(...payoff.map((p) => p.pnl));
  const maxLoss = Math.min(...payoff.map((p) => p.pnl));
  const breakevens = payoff.filter((p, i) => i > 0 && Math.sign(payoff[i - 1].pnl) !== Math.sign(p.pnl));

  return (
    <div className="tool-section">
      <div className="strategy-controls">
        <label className="filter-label">Strategy</label>
        <div className="strategy-btn-group">
          {STRATEGIES.map((s) => (
            <button
              key={s.value}
              className={`strategy-btn ${strategy === s.value ? "active" : ""}`}
              onClick={() => setStrategy(s.value)}
              type="button"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tool-summary-row" style={{ marginTop: "12px" }}>
        <div className="summary-chip green">
          <span>Max Profit</span>
          <strong>{maxProfit === Infinity ? "Unlimited" : `₹${maxProfit.toFixed(0)}`}</strong>
        </div>
        <div className="summary-chip red">
          <span>Max Loss</span>
          <strong>₹{Math.abs(maxLoss).toFixed(0)}</strong>
        </div>
        <div className="summary-chip neutral">
          <span>ATM Strike</span>
          <strong>{atm}</strong>
        </div>
        {breakevens.length > 0 && (
          <div className="summary-chip neutral">
            <span>Breakeven</span>
            <strong>{breakevens.map((b) => b.price).join(" / ")}</strong>
          </div>
        )}
      </div>

      <p className="tool-subtitle">Payoff diagram at expiry — Lot size: 1 unit</p>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={payoff} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lossGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e222b" vertical={false} />
          <XAxis dataKey="price" stroke="#5d6575" fontSize={11} tickLine={false} minTickGap={40} />
          <YAxis stroke="#5d6575" fontSize={11} tickLine={false} width={55} tickFormatter={(v) => `₹${v}`} />
          <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} strokeDasharray="4 4" />
          <ReferenceLine x={spot} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: "CMP", fill: "#6366f1", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
            formatter={(val: number) => [`₹${val.toFixed(2)}`, "P&L"]}
            labelFormatter={(label) => `Price: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke="#10b981"
            fill="url(#profitGrad)"
            strokeWidth={2}
            name="P&L"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
