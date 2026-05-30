import { useState } from "react";
import type { OptionRow } from "../types";

interface TimeseriesProps {
  options: OptionRow[];
  spot: number;
  symbol: string;
}

const TIMES = ["09:15", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];

function buildTimeseries(options: OptionRow[], spot: number) {
  let seed = spot;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const nearStrikes = options
    .filter((o) => Math.abs(o.strike - spot) <= 150)
    .slice(0, 5);

  return TIMES.map((time) => {
    const row: Record<string, any> = { time };
    nearStrikes.forEach((opt) => {
      const callOi = Math.round(opt.callOi * (0.7 + rand() * 0.6));
      const putOi = Math.round(opt.putOi * (0.7 + rand() * 0.6));
      row[`${opt.strike}CE`] = callOi;
      row[`${opt.strike}PE`] = putOi;
    });
    return { row, strikes: nearStrikes };
  });
}

export function Timeseries({ options, spot, symbol }: TimeseriesProps) {
  const [view, setView] = useState<"CE" | "PE">("CE");

  const nearStrikes = options
    .filter((o) => Math.abs(o.strike - spot) <= 150)
    .slice(0, 5);

  let seed = spot;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const rows = TIMES.map((time) => {
    const cells: Record<string, number> = {};
    nearStrikes.forEach((opt) => {
      cells[`${opt.strike}CE`] = Math.round(opt.callOi * (0.7 + rand() * 0.6));
      cells[`${opt.strike}PE`] = Math.round(opt.putOi * (0.7 + rand() * 0.6));
    });
    return { time, cells };
  });

  const formatOi = (v: number) => (v / 100000).toFixed(2) + "L";

  const getCellColor = (val: number, prev: number | undefined) => {
    if (!prev) return "";
    if (val > prev * 1.02) return "cell-up";
    if (val < prev * 0.98) return "cell-down";
    return "";
  };

  return (
    <div className="tool-section">
      <div className="toggle-tab-group" style={{ width: "fit-content", marginBottom: "12px" }}>
        <button className={view === "CE" ? "active" : ""} onClick={() => setView("CE")} type="button">Call OI</button>
        <button className={view === "PE" ? "active" : ""} onClick={() => setView("PE")} type="button">Put OI</button>
      </div>
      <p className="tool-subtitle">{symbol} — OI timeseries across near-ATM strikes (in Lakhs)</p>
      <div className="timeseries-table-wrap">
        <table className="timeseries-table">
          <thead>
            <tr>
              <th>Time</th>
              {nearStrikes.map((opt) => (
                <th key={opt.strike} style={{ color: view === "CE" ? "#ef4444" : "#10b981" }}>
                  {opt.strike} {view}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.time}>
                <td className="font-bold" style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{row.time}</td>
                {nearStrikes.map((opt) => {
                  const key = `${opt.strike}${view}`;
                  const val = row.cells[key];
                  const prevVal = ri > 0 ? rows[ri - 1].cells[key] : undefined;
                  return (
                    <td key={opt.strike} className={getCellColor(val, prevVal)}>
                      {formatOi(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
