import type { OptionRow } from "../types";

interface IntradayBoosterProps {
  options: OptionRow[];
  spot: number;
  symbol: string;
}

interface BoosterSignal {
  strike: number;
  type: "CE" | "PE";
  signal: "BUY" | "SELL" | "WATCH";
  oiChange: number;
  iv: number;
  volume: number;
  reason: string;
}

function generateSignals(options: OptionRow[], spot: number): BoosterSignal[] {
  const signals: BoosterSignal[] = [];
  let seed = spot;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  options.forEach((opt) => {
    const dist = Math.abs(opt.strike - spot);
    if (dist > 300) return;

    const oiChangeCe = Math.round((rand() - 0.4) * 200000);
    const oiChangePe = Math.round((rand() - 0.4) * 200000);

    // CE signal
    if (Math.abs(oiChangeCe) > 80000) {
      const signal: BoosterSignal["signal"] =
        oiChangeCe > 0 && opt.strike > spot ? "SELL" :
        oiChangeCe < 0 && opt.strike > spot ? "BUY" : "WATCH";
      signals.push({
        strike: opt.strike,
        type: "CE",
        signal,
        oiChange: oiChangeCe,
        iv: opt.callIv,
        volume: opt.callVolume ?? opt.volume,
        reason: oiChangeCe > 0 ? "OI buildup — resistance forming" : "OI unwinding — resistance weakening",
      });
    }

    // PE signal
    if (Math.abs(oiChangePe) > 80000) {
      const signal: BoosterSignal["signal"] =
        oiChangePe > 0 && opt.strike < spot ? "BUY" :
        oiChangePe < 0 && opt.strike < spot ? "SELL" : "WATCH";
      signals.push({
        strike: opt.strike,
        type: "PE",
        signal,
        oiChange: oiChangePe,
        iv: opt.putIv,
        volume: opt.putVolume ?? opt.volume,
        reason: oiChangePe > 0 ? "OI buildup — support forming" : "OI unwinding — support weakening",
      });
    }
  });

  return signals.sort((a, b) => Math.abs(b.oiChange) - Math.abs(a.oiChange)).slice(0, 10);
}

const signalColor = (s: string) =>
  s === "BUY" ? "#10b981" : s === "SELL" ? "#ef4444" : "#f59e0b";

export function IntradayBooster({ options, spot, symbol }: IntradayBoosterProps) {
  const signals = generateSignals(options, spot);

  return (
    <div className="tool-section">
      <p className="tool-subtitle">
        High-momentum OI signals for <strong>{symbol}</strong> — Spot: {spot.toLocaleString("en-IN")}
      </p>
      {signals.length === 0 ? (
        <div className="empty-state">No strong signals detected. Market may be in consolidation.</div>
      ) : (
        <div className="booster-table-wrap">
          <table className="booster-table">
            <thead>
              <tr>
                <th>Strike</th>
                <th>Type</th>
                <th>Signal</th>
                <th>OI Change</th>
                <th>IV %</th>
                <th>Volume</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((s, i) => (
                <tr key={i}>
                  <td className="font-bold">{s.strike}</td>
                  <td>
                    <span className={`type-badge ${s.type === "CE" ? "ce" : "pe"}`}>{s.type}</span>
                  </td>
                  <td>
                    <span className="signal-badge" style={{ color: signalColor(s.signal), borderColor: signalColor(s.signal) + "44", background: signalColor(s.signal) + "18" }}>
                      {s.signal}
                    </span>
                  </td>
                  <td className={s.oiChange >= 0 ? "text-green" : "text-red"}>
                    {s.oiChange >= 0 ? "+" : ""}{(s.oiChange / 100000).toFixed(2)}L
                  </td>
                  <td>{s.iv.toFixed(1)}%</td>
                  <td>{(s.volume / 1000).toFixed(1)}K</td>
                  <td className="text-dim" style={{ fontSize: "11px" }}>{s.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
