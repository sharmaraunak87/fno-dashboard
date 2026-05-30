import { useState } from "react";
import type { OptionRow } from "../types";

interface OptionSimulatorProps {
  options: OptionRow[];
  spot: number;
}

type LegType = "CE" | "PE";
type Action = "BUY" | "SELL";

interface Leg {
  id: number;
  strike: number;
  type: LegType;
  action: Action;
  lots: number;
  premium: number;
}

const LOT_SIZE: Record<string, number> = {
  NIFTY: 75,
  BANKNIFTY: 30,
  FINNIFTY: 40,
};

let legIdCounter = 1;

function calcPremium(opt: OptionRow | undefined, type: LegType, spot: number, strike: number): number {
  if (opt) return type === "CE" ? Number((opt.callIv * spot * 0.01 * Math.sqrt(7 / 365)).toFixed(2)) : Number((opt.putIv * spot * 0.01 * Math.sqrt(7 / 365)).toFixed(2));
  const intrinsic = type === "CE" ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
  return Number((intrinsic + spot * 0.005).toFixed(2));
}

export function OptionSimulator({ options, spot }: OptionSimulatorProps) {
  const [legs, setLegs] = useState<Leg[]>([]);
  const [targetPrice, setTargetPrice] = useState(spot);
  const [lotSize] = useState(75);

  const addLeg = () => {
    const atm = options.reduce((best, opt) =>
      Math.abs(opt.strike - spot) < Math.abs(best.strike - spot) ? opt : best,
      options[0] ?? { strike: Math.round(spot / 50) * 50, callIv: 14, putIv: 15, callOi: 0, putOi: 0, gamma: 0, delta: 0, volume: 0 }
    );
    const premium = calcPremium(atm, "CE", spot, atm.strike);
    setLegs((prev) => [...prev, {
      id: legIdCounter++,
      strike: atm.strike,
      type: "CE",
      action: "BUY",
      lots: 1,
      premium,
    }]);
  };

  const removeLeg = (id: number) => setLegs((prev) => prev.filter((l) => l.id !== id));

  const updateLeg = (id: number, field: keyof Leg, value: any) => {
    setLegs((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const updated = { ...l, [field]: value };
      if (field === "strike" || field === "type") {
        const opt = options.find((o) => o.strike === updated.strike);
        updated.premium = calcPremium(opt, updated.type, spot, updated.strike);
      }
      return updated;
    }));
  };

  const calcPnl = (leg: Leg, price: number): number => {
    const intrinsic = leg.type === "CE" ? Math.max(0, price - leg.strike) : Math.max(0, leg.strike - price);
    const pnl = (intrinsic - leg.premium) * leg.lots * lotSize;
    return leg.action === "BUY" ? pnl : -pnl;
  };

  const totalPnl = legs.reduce((sum, leg) => sum + calcPnl(leg, targetPrice), 0);
  const maxLoss = legs.reduce((sum, leg) => {
    const worstPnl = leg.action === "BUY" ? -leg.premium * leg.lots * lotSize : 0;
    return sum + worstPnl;
  }, 0);

  const breakeven = legs.length === 1 ? (
    legs[0].action === "BUY"
      ? legs[0].type === "CE"
        ? legs[0].strike + legs[0].premium
        : legs[0].strike - legs[0].premium
      : null
  ) : null;

  return (
    <div className="tool-section">
      <div className="simulator-controls">
        <button className="btn-play-pause" onClick={addLeg} type="button" style={{ width: "fit-content" }}>
          + Add Leg
        </button>
        <div className="filter-group" style={{ flexDirection: "row", alignItems: "center", gap: "12px" }}>
          <label className="filter-label">Target Price:</label>
          <input
            type="number"
            className="filter-input"
            style={{ width: "120px" }}
            value={targetPrice}
            step={50}
            onChange={(e) => setTargetPrice(Number(e.target.value))}
          />
        </div>
      </div>

      {legs.length === 0 ? (
        <div className="empty-state" style={{ marginTop: "20px" }}>
          Click "Add Leg" to build your option strategy. Add multiple legs to simulate spreads and complex strategies.
        </div>
      ) : (
        <>
          <div className="booster-table-wrap" style={{ marginTop: "16px" }}>
            <table className="booster-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Strike</th>
                  <th>Type</th>
                  <th>Lots</th>
                  <th>Premium</th>
                  <th>P&L @ Target</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {legs.map((leg) => {
                  const pnl = calcPnl(leg, targetPrice);
                  return (
                    <tr key={leg.id}>
                      <td>
                        <select
                          className="filter-input"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                          value={leg.action}
                          onChange={(e) => updateLeg(leg.id, "action", e.target.value as Action)}
                        >
                          <option value="BUY">BUY</option>
                          <option value="SELL">SELL</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="filter-input"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                          value={leg.strike}
                          onChange={(e) => updateLeg(leg.id, "strike", Number(e.target.value))}
                        >
                          {options.map((o) => (
                            <option key={o.strike} value={o.strike}>{o.strike}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="filter-input"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                          value={leg.type}
                          onChange={(e) => updateLeg(leg.id, "type", e.target.value as LegType)}
                        >
                          <option value="CE">CE</option>
                          <option value="PE">PE</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="filter-input"
                          style={{ width: "60px", padding: "4px 8px", fontSize: "12px" }}
                          value={leg.lots}
                          min={1}
                          max={50}
                          onChange={(e) => updateLeg(leg.id, "lots", Number(e.target.value))}
                        />
                      </td>
                      <td>₹{leg.premium.toFixed(2)}</td>
                      <td className={pnl >= 0 ? "text-green font-bold" : "text-red font-bold"}>
                        {pnl >= 0 ? "+" : ""}₹{pnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                      <td>
                        <button
                          onClick={() => removeLeg(leg.id)}
                          style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px" }}
                          type="button"
                          aria-label="Remove leg"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="tool-summary-row" style={{ marginTop: "16px" }}>
            <div className={`summary-chip ${totalPnl >= 0 ? "green" : "red"}`}>
              <span>Total P&L @ {targetPrice}</span>
              <strong>{totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
            </div>
            <div className="summary-chip red">
              <span>Max Loss</span>
              <strong>₹{Math.abs(maxLoss).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
            </div>
            {breakeven !== null && (
              <div className="summary-chip neutral">
                <span>Breakeven</span>
                <strong>{breakeven?.toFixed(0)}</strong>
              </div>
            )}
            <div className="summary-chip neutral">
              <span>Lot Size</span>
              <strong>{lotSize}</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
