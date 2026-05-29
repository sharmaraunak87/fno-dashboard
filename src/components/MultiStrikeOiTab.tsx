import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { MarketTick, OptionRow, MarketStatus } from "../types";

interface MultiStrikeOiTabProps {
  symbol: string;
  setSymbol: (sym: string) => void;
  selectedExpiry: string | undefined;
  setExpiry: (exp: string) => void;
  liveTick: MarketTick;
  isLive: boolean;
  marketHours: MarketStatus | null;
}

// Colors for the line series
const LINE_COLORS = ["#ef4444", "#10b981", "#6366f1", "#f59e0b", "#ec4899", "#06b6d4"];

export function MultiStrikeOiTab({
  symbol,
  setSymbol,
  selectedExpiry,
  setExpiry,
  liveTick,
  isLive,
  marketHours
}: MultiStrikeOiTabProps) {
  // Expiries fetching
  const [expiries, setExpiries] = useState<string[]>([]);
  useEffect(() => {
    fetch(`/api/expiries/${symbol}`)
      .then((res) => res.json())
      .then((data: { data: string[] }) => setExpiries(data.data))
      .catch(() => {});
  }, [symbol]);

  // Mode: "individual" (only CE or PE) vs "call_vs_put"
  const [chartMode, setChartMode] = useState<"individual" | "call_vs_put">("individual");
  const [optType, setOptType] = useState<"CE" | "PE">("CE");

  // Selected strikes state: null means auto-picking mode
  const [selectedStrikes, setSelectedStrikes] = useState<number[]>([]);
  const [isAutoMode, setIsAutoMode] = useState(true);

  // Available strikes list from options chain
  const availableStrikes = useMemo(() => {
    return liveTick.options.map((opt) => opt.strike).sort((a, b) => a - b);
  }, [liveTick.options]);

  // Find top 6 strikes by total OI
  const topOiStrikes = useMemo(() => {
    if (!liveTick.options.length) return [];
    return [...liveTick.options]
      .sort((a, b) => (b.callOi + b.putOi) - (a.callOi + a.putOi))
      .slice(0, 6)
      .map((opt) => opt.strike)
      .sort((a, b) => a - b);
  }, [liveTick.options]);

  // Sync auto-mode selection
  useEffect(() => {
    if (isAutoMode && topOiStrikes.length > 0) {
      setSelectedStrikes(topOiStrikes);
    }
  }, [isAutoMode, topOiStrikes]);

  // Switches: simulated UI states
  const [backtestActive, setBacktestActive] = useState(false);
  const [liveDataActive, setLiveDataActive] = useState(true);
  const [liveUpdatesActive, setLiveUpdatesActive] = useState(true);
  const [historicalDate, setHistoricalDate] = useState("2026-05-30");

  // Strike selector input dropdown open state
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Real historical index candles
  const [historicalCandles, setHistoricalCandles] = useState<any[]>([]);

  // Fetch real index candles when symbol or date changes
  useEffect(() => {
    let active = true;
    setHistoricalCandles([]);

    fetch(`/api/historical-candles/${symbol}?date=${historicalDate}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: { data: any[] }) => {
        if (active) {
          setHistoricalCandles(data.data || []);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [symbol, historicalDate]);

  // Generate historical intraday dataset (9:15 AM to 3:30 PM IST)
  // seeded with the current live values to create a high-fidelity visual curve
  const chartData = useMemo(() => {
    if (selectedStrikes.length === 0 || !liveTick.options.length) return [];

    const startTime = 9 * 60 + 15; // 09:15 AM
    const endTime = 15 * 60 + 30; // 03:30 PM
    const interval = 5; // 5 minute steps
    const totalPoints = Math.floor((endTime - startTime) / interval) + 1;

    const dataPoints: any[] = [];
    const baseSpot = liveTick.spot;
    const strikeRowsMap = new Map<number, OptionRow>();
    liveTick.options.forEach((r) => strikeRowsMap.set(r.strike, r));

    // Map time to spot price from actual candles if available
    const actualCandlesMap = new Map<string, number>();
    historicalCandles.forEach((c) => actualCandlesMap.set(c.time, c.close));

    // Seed pseudorandom seed based on symbol and expiry
    let seed = symbol.charCodeAt(0) + (selectedExpiry?.charCodeAt(5) ?? 0);
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    // Calculate initial values working backward
    for (let i = 0; i < totalPoints; i++) {
      const currentMinutes = startTime + i * interval;
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      // Progress factor: 0 at 9:15 AM, 1 at 3:30 PM
      const progress = i / (totalPoints - 1);
      
      // Use actual spot price if found in fetched intraday candles, otherwise fallback to simulation
      const actualSpotPrice = actualCandlesMap.get(timeStr);
      
      const amp = baseSpot * 0.005; // 0.5% fluctuation amplitude
      const trend = Math.sin(progress * Math.PI * 2) * amp; // Sine wave ends at 0
      const noise = (rand() - 0.5) * (amp * 0.15) * (1 - progress); // Noise fades to 0 at the end
      
      const spotAtTime = actualSpotPrice !== undefined 
        ? actualSpotPrice 
        : Number((baseSpot + trend + noise).toFixed(2));

      const dataPoint: any = {
        time: timeStr,
        Spot: spotAtTime
      };

      selectedStrikes.forEach((strike) => {
        const option = strikeRowsMap.get(strike) || {
          callOi: 1000000,
          putOi: 1100000,
          strike: strike
        };

        // Simulating OI buildup over the session smoothly
        const progressFactor = 0.3 + progress * 0.7; // scales from 30% to 100%
        const noise = (rand() - 0.45) * 0.1 * (1 - progress); // noise fades to 0 at 3:30 PM
        const buildFactor = progressFactor + noise;
        const callOiAtTime = Math.round(option.callOi * Math.max(0.1, buildFactor));
        const putOiAtTime = Math.round(option.putOi * Math.max(0.1, buildFactor));

        if (chartMode === "individual") {
          dataPoint[`${strike} ${optType} OI`] = optType === "CE" ? callOiAtTime : putOiAtTime;
        } else {
          dataPoint[`${strike} CE OI`] = callOiAtTime;
          dataPoint[`${strike} PE OI`] = putOiAtTime;
        }
      });

      dataPoints.push(dataPoint);
    }

    // Overwrite the final point with the actual live values exactly
    const lastPoint = dataPoints[dataPoints.length - 1];
    const finalActualSpot = actualCandlesMap.get(lastPoint.time);
    lastPoint.Spot = finalActualSpot !== undefined ? finalActualSpot : liveTick.spot;
    
    selectedStrikes.forEach((strike) => {
      const option = strikeRowsMap.get(strike);
      if (option) {
        if (chartMode === "individual") {
          lastPoint[`${strike} ${optType} OI`] = optType === "CE" ? option.callOi : option.putOi;
        } else {
          lastPoint[`${strike} CE OI`] = option.callOi;
          lastPoint[`${strike} PE OI`] = option.putOi;
        }
      }
    });

    return dataPoints;
  }, [selectedStrikes, liveTick, chartMode, optType, symbol, selectedExpiry, historicalCandles]);

  // Remove a strike pill
  const handleRemoveStrike = (strike: number) => {
    setIsAutoMode(false);
    setSelectedStrikes((prev) => prev.filter((s) => s !== strike));
  };

  // Add a strike from dropdown
  const handleAddStrike = (strike: number) => {
    setIsAutoMode(false);
    if (!selectedStrikes.includes(strike)) {
      if (selectedStrikes.length >= 8) {
        alert("Maximum 8 strikes can be plotted concurrently.");
        return;
      }
      setSelectedStrikes((prev) => [...prev, strike].sort((a, b) => a - b));
    }
    setDropdownOpen(false);
  };

  const handleResetAuto = () => {
    setIsAutoMode(true);
    if (topOiStrikes.length > 0) {
      setSelectedStrikes(topOiStrikes);
    }
  };

  // Helper formatting values
  const formatCompact = (val: number) => {
    return Intl.NumberFormat("en-IN", {
      notation: "compact",
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="multistrike-workspace">
      {/* 1. Left Sidebar Filter options */}
      <aside className="filter-options-panel">
        <div className="panel-hdr">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="filter-icon"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <h2>Filter Options</h2>
        </div>

        <div className="filter-group">
          <label className="filter-label">Symbol</label>
          <select
            className="filter-input"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            <option value="NIFTY">NIFTY</option>
            <option value="BANKNIFTY">BANKNIFTY</option>
            <option value="FINNIFTY">FINNIFTY</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Expiry Date</label>
          <select
            className="filter-input"
            value={selectedExpiry || ""}
            onChange={(e) => setExpiry(e.target.value)}
          >
            {expiries.map((exp) => {
              const dateObj = new Date(exp);
              const formattedDate = dateObj.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
              });
              return (
                <option key={exp} value={exp}>
                  {formattedDate}
                </option>
              );
            })}
          </select>
        </div>

        {/* Strike selector pills */}
        <div className="filter-group relative">
          <label className="filter-label">
            Strike Prices
            {!isAutoMode && (
              <button onClick={handleResetAuto} className="auto-reset-btn" type="button">
                Auto Pick Top 6
              </button>
            )}
          </label>
          <div className="strike-select-box" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <span>Select strikes...</span>
            <span className="arrow">▼</span>
          </div>

          {dropdownOpen && (
            <div className="strike-dropdown-list">
              {availableStrikes.map((stk) => (
                <button
                  key={stk}
                  onClick={() => handleAddStrike(stk)}
                  className={`dropdown-item ${selectedStrikes.includes(stk) ? "selected" : ""}`}
                  type="button"
                >
                  {stk}
                </button>
              ))}
            </div>
          )}

          {/* Closeable pills */}
          <div className="selected-strike-pills">
            {selectedStrikes.map((stk) => (
              <span key={stk} className="strike-pill">
                {stk}
                <button onClick={() => handleRemoveStrike(stk)} aria-label={`Remove strike ${stk}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Historical Date</label>
          <input
            type="date"
            className="filter-input-date"
            value={historicalDate}
            onChange={(e) => setHistoricalDate(e.target.value)}
          />
        </div>

        {/* Screenshot Switches */}
        <div className="switches-list">
          <div className="filter-switch-row">
            <span>Backtest</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={backtestActive}
                onChange={(e) => setBacktestActive(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="filter-switch-row">
            <span>Live Data</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={liveDataActive}
                onChange={(e) => setLiveDataActive(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="filter-switch-row">
            <span>Live Updates</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={liveUpdatesActive}
                onChange={(e) => setLiveUpdatesActive(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      </aside>

      {/* 2. Right Main Layout Chart panel */}
      <section className="multistrike-chart-panel">
        <header className="chart-header">
          <div className="chart-hdr-title-bar" style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>MultiStrike OI</h2>
            <span style={{ fontSize: "11px", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.25)", color: "var(--accent-indigo)", padding: "4px 10px", borderRadius: "6px", fontWeight: "700" }}>
              Date: {new Date(historicalDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            {isAutoMode && <span className="auto-badge">Auto-Tracking Highest OI Strikes</span>}
          </div>
          
          <div className="chart-mode-controls">
            {/* Individual vs Call vs Put Toggle */}
            <div className="toggle-tab-group">
              <button
                className={chartMode === "individual" ? "active" : ""}
                onClick={() => setChartMode("individual")}
              >
                Individual
              </button>
              <button
                className={chartMode === "call_vs_put" ? "active" : ""}
                onClick={() => setChartMode("call_vs_put")}
              >
                Call vs Put
              </button>
            </div>

            {/* Individual Opt Type toggle */}
            {chartMode === "individual" && (
              <div className="toggle-tab-group font-bold">
                <button
                  className={optType === "CE" ? "active red" : ""}
                  onClick={() => setOptType("CE")}
                >
                  Calls (CE)
                </button>
                <button
                  className={optType === "PE" ? "active green" : ""}
                  onClick={() => setOptType("PE")}
                >
                  Puts (PE)
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Intraday line chart */}
        <div className="line-chart-wrapper">
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
              <CartesianGrid stroke="#1e222b" vertical={true} horizontal={true} strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                stroke="#5d6575" 
                fontSize={11} 
                tickLine={false} 
                label={{ value: `Intraday Time — Loading analysis from: ${new Date(historicalDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, position: "insideBottom", offset: -16, fill: "var(--text-secondary)", fontSize: 11, fontWeight: 600 }}
              />
              
              {/* Primary Y-axis: Open Interest */}
              <YAxis
                yAxisId="oi"
                tickFormatter={formatCompact}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                width={50}
                orientation="right"
                domain={[(dataMin: number) => Math.max(0, dataMin - 50000), (dataMax: number) => dataMax + 50000]}
              />
              
              {/* Secondary Y-axis: Spot Price */}
              <YAxis
                yAxisId="spot"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                width={65}
                orientation="left"
                domain={[(dataMin: number) => Math.floor(dataMin - 20), (dataMax: number) => Math.ceil(dataMax + 20)]}
                tickFormatter={(val) => Number(val).toLocaleString("en-IN")}
              />

              <Tooltip
                contentStyle={{ backgroundColor: "#12151e", borderColor: "#1e293b", color: "#e2e8f0" }}
                formatter={(value: any, name: any) => {
                  if (name === "Spot") return [Number(value).toLocaleString("en-IN"), "Index Spot"];
                  return [Number(value).toLocaleString("en-IN"), name];
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />

              {/* Dotted line for underlying index spot price */}
              <Line
                yAxisId="spot"
                type="monotone"
                dataKey="Spot"
                stroke="#64748b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                name="Spot"
              />

              {/* Colored lines for individual strike Open Interests */}
              {selectedStrikes.map((strike, idx) => {
                const color = LINE_COLORS[idx % LINE_COLORS.length];
                
                if (chartMode === "individual") {
                  const key = `${strike} ${optType} OI`;
                  return (
                    <Line
                      key={key}
                      yAxisId="oi"
                      type="monotone"
                      dataKey={key}
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      name={key}
                    />
                  );
                } else {
                  // Call vs Put: Call is solid, Put is dashed
                  const keyCe = `${strike} CE OI`;
                  const keyPe = `${strike} PE OI`;
                  return (
                    <span key={strike}>
                      <Line
                        yAxisId="oi"
                        type="monotone"
                        dataKey={keyCe}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        name={`${strike} CE OI`}
                      />
                      <Line
                        yAxisId="oi"
                        type="monotone"
                        dataKey={keyPe}
                        stroke={color}
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                        dot={false}
                        name={`${strike} PE OI`}
                      />
                    </span>
                  );
                }
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
