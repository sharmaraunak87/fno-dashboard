import { Activity, Radio, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

interface MetricStripProps {
  isLive: boolean;
  spot: number;
  change: number;
  pcr: number;
  maxPain: number;
  timestamp: string;
}

export function MetricStrip({ isLive, spot, change, pcr, maxPain, timestamp }: MetricStripProps) {
  const isUp = change >= 0;
  const timeStr = new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  return (
    <section className="status-strip" aria-label="Key market indicators">
      <MetricCard
        icon={<Radio className={isLive ? "pulse-icon text-green" : ""} />}
        label={isLive ? "Live Feed" : "Offline Simulation"}
        value={timeStr}
        className={isLive ? "live" : "offline"}
      />
      <MetricCard
        icon={isUp ? <TrendingUp className="text-green" /> : <TrendingDown className="text-red" />}
        label="Spot Price"
        value={spot.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        subValue={`${isUp ? "+" : ""}${change.toFixed(2)}%`}
        tone={isUp ? "up" : "down"}
      />
      <MetricCard
        icon={<Activity className="text-indigo" />}
        label="Put-Call Ratio (PCR)"
        value={pcr.toFixed(2)}
        subValue={pcr > 1.2 ? "Bullish (Put Heavy)" : pcr < 0.8 ? "Bearish (Call Heavy)" : "Neutral"}
        tone={pcr > 1.2 ? "up" : pcr < 0.8 ? "down" : "neutral"}
      />
      <MetricCard
        icon={<ShieldAlert className="text-violet" />}
        label="Max Pain"
        value={maxPain.toLocaleString("en-IN")}
        subValue="Expiry Target"
        tone="neutral"
      />
    </section>
  );
}

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subValue?: string;
  tone?: "up" | "down" | "neutral";
  className?: string;
}

function MetricCard({ icon, label, value, subValue, tone, className = "" }: MetricCardProps) {
  const toneClass = tone === "up" ? "up" : tone === "down" ? "down" : "";
  return (
    <div className={`metric-card ${className} ${toneClass}`}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-body">
        <strong className="metric-value">{value}</strong>
        {subValue && <span className="metric-subvalue">{subValue}</span>}
      </div>
    </div>
  );
}
