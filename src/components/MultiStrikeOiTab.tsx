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
const LINE_COLORS = ["#ef4444", "#10b981", "#6366f1", "#f59e0b", "#ec4899", "#06b6d4", "#a855f7", "#14b8a6"];

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
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: { data: string[] }) => setExpiries(data.data))
      .catch(() => {});
  }, [symbol]);

  const [dateMode, setDateMode] = useState<"live" | "historical">("live");
  const [historicalDate, setHistoricalDate] = useState("2026-05-30");

  const todayDateStr = useMemo(() => {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return formatter.format(d);
  }, []);

  // Selection mode: "custom" | "high_oi" | "high_volume"
  const [selectionMode, setSelectionMode] = useState<"custom" | "high_oi" | "high_volume" >("high_oi");
  const [selectedContracts, setSelectedContracts] = useState<Array<{ strike: number; type: "CE" | "PE" }>>([]);

  // Sync historicalDate default on dateMode changes
  useEffect(() => {
    if (dateMode === "live") {
      setHistoricalDate(todayDateStr);
    } else {
      setHistoricalDate("2026-05-29");
    }
  }, [dateMode, todayDateStr]);

  // Compute top 6 highest-OI option contracts restricted to +/- 10 strikes around CMP
  const topOiContracts = useMemo(() => {
    if (!liveTick.options.length) return [];
    const spot = liveTick.spot;
    let atmIndex = 0;
    let minDiff = Number.POSITIVE_INFINITY;
    
    for (let i = 0; i < liveTick.options.length; i++) {
      const diff = Math.abs(liveTick.options[i].strike - spot);
      if (diff < minDiff) {
        minDiff = diff;
        atmIndex = i;
      }
    }

    const startIdx = Math.max(0, atmIndex - 10);
    const endIdx = Math.min(liveTick.options.length, atmIndex + 11);
    const candidates = liveTick.options.slice(startIdx, endIdx);

    const flatContracts: Array<{ strike: number; type: "CE" | "PE"; value: number }> = [];
    candidates.forEach((opt) => {
      flatContracts.push({ strike: opt.strike, type: "CE", value: opt.callOi });
      flatContracts.push({ strike: opt.strike, type: "PE", value: opt.putOi });
    });

    return flatContracts
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map(({ strike, type }) => ({ strike, type }));
  }, [liveTick.options, liveTick.spot]);

  // Compute top 6 highest-volume option contracts restricted to +/- 10 strikes around CMP
  const topVolumeContracts = useMemo(() => {
    if (!liveTick.options.length) return [];
    const spot = liveTick.spot;
    let atmIndex = 0;
    let minDiff = Number.POSITIVE_INFINITY;
    
    for (let i = 0; i < liveTick.options.length; i++) {
      const diff = Math.abs(liveTick.options[i].strike - spot);
      if (diff < minDiff) {
        minDiff = diff;
        atmIndex = i;
      }
    }

    const startIdx = Math.max(0, atmIndex - 10);
    const endIdx = Math.min(liveTick.options.length, atmIndex + 11);
    const candidates = liveTick.options.slice(startIdx, endIdx);

    const flatContracts: Array<{ strike: number; type: "CE" | "PE"; value: number }> = [];
    candidates.forEach((opt) => {
      flatContracts.push({ strike: opt.strike, type: "CE", value: opt.callVolume ?? opt.volume ?? 0 });
      flatContracts.push({ strike: opt.strike, type: "PE", value: opt.putVolume ?? opt.volume ?? 0 });
    });

    return flatContracts
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map(({ strike, type }) => ({ strike, type }));
  }, [liveTick.options, liveTick.spot]);

  // Sync auto selected contracts
  useEffect(() => {
    if (selectionMode === "high_oi" && topOiContracts.length > 0) {
      setSelectedContracts(topOiContracts);
    } else if (selectionMode === "high_volume" && topVolumeContracts.length > 0) {
      setSelectedContracts(topVolumeContracts);
    }
  }, [selectionMode, topOiContracts, topVolumeContracts]);

  // Real historical index candles
  const [historicalCandles, setHistoricalCandles] = useState<any[]>([]);

  // Fetch real index candles when symbol or date changes
  useEffect(() => {
    let active = true;
    setHistoricalCandles([]);

    const fetchData = () => {
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
    };

    fetchData();

    let intervalId: number | undefined;
    if (historicalDate === todayDateStr) {
      intervalId = window.setInterval(fetchData, 30000);
    }

    return () => {
      active = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [symbol, historicalDate, todayDateStr]);

  // Needed security IDs based on selected contracts
  const neededSecurityIds = useMemo(() => {
    const ids: number[] = [];
    const optionMap = new Map<number, OptionRow>();
    liveTick.options.forEach((opt) => optionMap.set(opt.strike, opt));

    selectedContracts.forEach((contract) => {
      const opt = optionMap.get(contract.strike);
      if (!opt) return;

      const secId = contract.type === "CE" ? opt.callSecurityId : opt.putSecurityId;
      if (secId) ids.push(secId);
    });
    return ids;
  }, [selectedContracts, liveTick.options]);

  // Real historical option candles mapped by securityId
  const [historicalOptionCandles, setHistoricalOptionCandles] = useState<Record<number, any[]>>({});
  const [isLoadingOptionCandles, setIsLoadingOptionCandles] = useState(false);

  const hasOptionCandlesData = useMemo(() => {
    return Object.values(historicalOptionCandles).some((candles) => candles && candles.length > 0);
  }, [historicalOptionCandles]);

  const neededSecurityIdsKey = neededSecurityIds.join(",");

  useEffect(() => {
    if (neededSecurityIds.length === 0) {
      setHistoricalOptionCandles({});
      return;
    }

    let active = true;
    setIsLoadingOptionCandles(true);

    const fetchOptionData = () => {
      const promises = neededSecurityIds.map((secId) =>
        fetch(`/api/historical-option-candles/${secId}?date=${historicalDate}`)
          .then((res) => {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then((data: { data: any[] }) => ({ secId, data: data.data || [] }))
          .catch(() => ({ secId, data: [] }))
      );

      Promise.all(promises).then((results) => {
        if (!active) return;
        const newMap: Record<number, any[]> = {};
        results.forEach(({ secId, data }) => {
          newMap[secId] = data;
        });
        setHistoricalOptionCandles(newMap);
        setIsLoadingOptionCandles(false);
      });
    };

    fetchOptionData();

    let intervalId: number | undefined;
    if (historicalDate === todayDateStr) {
      intervalId = window.setInterval(fetchOptionData, 30000);
    }

    return () => {
      active = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [neededSecurityIdsKey, historicalDate, todayDateStr]);

  // Generate historical intraday dataset (9:15 AM to 3:30 PM IST)
  // seeded with the current live values to create a high-fidelity visual curve
  const chartData = useMemo(() => {
    if (selectedContracts.length === 0 || !liveTick.options.length) return [];

    const startTime = 9 * 60 + 15; // 09:15 AM
    const endTime = 15 * 60 + 30; // 03:30 PM
    const interval = 1; // 1 minute steps
    const totalPoints = Math.floor((endTime - startTime) / interval) + 1;

    const dataPoints: any[] = [];
    const baseSpot = liveTick.spot;
    const strikeRowsMap = new Map<number, OptionRow>();
    liveTick.options.forEach((r) => strikeRowsMap.set(r.strike, r));

    // Map time to spot price from actual candles if available
    const actualCandlesMap = new Map<string, number>();
    historicalCandles.forEach((c) => actualCandlesMap.set(c.time, c.close));

    // Get live timestamp time in minutes from midnight (IST)
    let liveMinutes = 15 * 60 + 30;
    if (historicalDate === todayDateStr) {
      const liveD = liveTick.timestamp ? new Date(liveTick.timestamp) : new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "numeric",
        hour12: false
      });
      const parts = formatter.formatToParts(liveD);
      const hPart = parts.find(p => p.type === "hour");
      const mPart = parts.find(p => p.type === "minute");
      if (hPart && mPart) {
        liveMinutes = Number(hPart.value) * 60 + Number(mPart.value);
      }
    }

    // Seed pseudorandom seed based on symbol and expiry
    let seed = symbol.charCodeAt(0) + (selectedExpiry?.charCodeAt(5) ?? 0);
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    // Calculate values
    for (let i = 0; i < totalPoints; i++) {
      const currentMinutes = startTime + i * interval;
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      // Progress factor: 0 at 9:15 AM, 1 at 3:30 PM
      const progress = i / (totalPoints - 1);
      
      const isFuturePoint = (historicalDate === todayDateStr) && (currentMinutes > liveMinutes);
      if (isFuturePoint) {
        dataPoints.push({
          time: timeStr,
          Spot: null
        });
        continue;
      }

      // If it is the current live tick time and today, overwrite with ticking quotes directly
      if (currentMinutes === liveMinutes && historicalDate === todayDateStr) {
        const dataPoint: any = {
          time: timeStr,
          Spot: liveTick.spot
        };
        selectedContracts.forEach((contract) => {
          const option = strikeRowsMap.get(contract.strike);
          if (option) {
            dataPoint[`${contract.strike} ${contract.type} OI`] = contract.type === "CE" ? option.callOi : option.putOi;
          }
        });
        dataPoints.push(dataPoint);
        continue;
      }

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

      selectedContracts.forEach((contract) => {
        const option = strikeRowsMap.get(contract.strike);
        
        const secId = option ? (contract.type === "CE" ? option.callSecurityId : option.putSecurityId) : undefined;
        const candles = secId ? historicalOptionCandles[secId] : undefined;
        const actualCandle = candles?.find((c) => c.time === timeStr);
        const actualOi = actualCandle?.open_interest;

        const fallbackOption = option || {
          callOi: 1000000,
          putOi: 1100000,
          strike: contract.strike
        };

        // Simulating OI buildup over the session smoothly
        const progressFactor = 0.3 + progress * 0.7; // scales from 30% to 100%
        const noise = (rand() - 0.45) * 0.1 * (1 - progress); // noise fades to 0 at 3:30 PM
        const buildFactor = progressFactor + noise;
        const simOi = contract.type === "CE"
          ? Math.round(fallbackOption.callOi * Math.max(0.1, buildFactor))
          : Math.round(fallbackOption.putOi * Math.max(0.1, buildFactor));

        const finalOi = actualOi !== undefined ? actualOi : (historicalDate === todayDateStr ? simOi : null);

        dataPoint[`${contract.strike} ${contract.type} OI`] = finalOi;
      });

      dataPoints.push(dataPoint);
    }

    // Overwrite the final point with the actual live values exactly if not today
    if (historicalDate !== todayDateStr) {
      const lastPoint = dataPoints[dataPoints.length - 1];
      const finalActualSpot = actualCandlesMap.get(lastPoint.time);
      lastPoint.Spot = finalActualSpot !== undefined ? finalActualSpot : liveTick.spot;
      
      selectedContracts.forEach((contract) => {
        const option = strikeRowsMap.get(contract.strike);
        const secId = option ? (contract.type === "CE" ? option.callSecurityId : option.putSecurityId) : undefined;
        const candle = secId ? historicalOptionCandles[secId]?.find((c) => c.time === lastPoint.time) : undefined;

        const finalOi = candle?.open_interest !== undefined 
          ? candle.open_interest 
          : (option ? (contract.type === "CE" ? option.callOi : option.putOi) : (contract.type === "CE" ? 1000000 : 1100000));

        lastPoint[`${contract.strike} ${contract.type} OI`] = finalOi;
      });
    }

    return dataPoints;
  }, [selectedContracts, liveTick, symbol, selectedExpiry, historicalCandles, historicalOptionCandles, historicalDate, todayDateStr]);

  // Add a contract (calls selection table)
  const handleAddContract = (strike: number, type: "CE" | "PE") => {
    setSelectedContracts((prev) => {
      let currentList = prev;
      if (selectionMode === "high_oi") {
        currentList = topOiContracts;
      } else if (selectionMode === "high_volume") {
        currentList = topVolumeContracts;
      }
      if (currentList.some((c) => c.strike === strike && c.type === type)) {
        return currentList;
      }
      if (currentList.length >= 8) {
        alert("Maximum 8 contracts can be plotted concurrently.");
        return currentList;
      }
      return [...currentList, { strike, type }];
    });
    setSelectionMode("custom");
  };

  // Remove a contract (pills or table click)
  const handleRemoveContract = (strike: number, type: "CE" | "PE") => {
    setSelectedContracts((prev) => {
      let currentList = prev;
      if (selectionMode === "high_oi") {
        currentList = topOiContracts;
      } else if (selectionMode === "high_volume") {
        currentList = topVolumeContracts;
      }
      return currentList.filter((c) => !(c.strike === strike && c.type === type));
    });
    setSelectionMode("custom");
  };

  // Dynamic remaining days display
  const getRemainingDaysText = (expiryStr: string) => {
    if (!expiryStr) return "";
    const expiryParts = expiryStr.split("-");
    if (expiryParts.length !== 3) return "";
    const expDate = new Date(Number(expiryParts[0]), Number(expiryParts[1]) - 1, Number(expiryParts[2]));
    
    const baseStr = dateMode === "live" ? todayDateStr : historicalDate;
    const baseParts = baseStr.split("-");
    if (baseParts.length !== 3) return "";
    const baseDate = new Date(Number(baseParts[0]), Number(baseParts[1]) - 1, Number(baseParts[2]));
    
    expDate.setHours(0, 0, 0, 0);
    baseDate.setHours(0, 0, 0, 0);
    
    const diffTime = expDate.getTime() - baseDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "today";
    if (diffDays < 0) return "expired";
    return `${diffDays}d`;
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
        {/* Live vs Historical Segmented Toggle */}
        <div className="toggle-tab-group wide-toggles">
          <button
            className={dateMode === "live" ? "active" : ""}
            onClick={() => setDateMode("live")}
            type="button"
          >
            Live
          </button>
          <button
            className={dateMode === "historical" ? "active" : ""}
            onClick={() => setDateMode("historical")}
            type="button"
          >
            Historical
          </button>
        </div>

        {/* Expiry Selector */}
        <div className="filter-group">
          <label className="filter-label">Expiry</label>
          <select
            className="filter-input"
            value={selectedExpiry || ""}
            onChange={(e) => setExpiry(e.target.value)}
          >
            {expiries.map((exp) => {
              const dateObj = new Date(exp);
              const formattedDate = dateObj.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric"
              });
              const remDays = getRemainingDaysText(exp);
              const remDaysText = remDays ? ` (${remDays})` : "";
              return (
                <option key={exp} value={exp}>
                  {formattedDate}{remDaysText}
                </option>
              );
            })}
          </select>
        </div>

        {/* Historical Date Input shown if dateMode is historical */}
        {dateMode === "historical" && (
          <div className="filter-group">
            <label className="filter-label">Historical Date</label>
            <input
              type="date"
              className="filter-input-date"
              value={historicalDate}
              onChange={(e) => setHistoricalDate(e.target.value)}
            />
          </div>
        )}

        {/* High Volume selection card */}
        <div className={`auto-select-card ${selectionMode === "high_volume" ? "active" : ""}`}>
          <span>High Volume</span>
          <button onClick={() => setSelectionMode("high_volume")} type="button">Select</button>
        </div>

        {/* High OI selection card */}
        <div className={`auto-select-card ${selectionMode === "high_oi" ? "active" : ""}`}>
          <span>High OI</span>
          <button onClick={() => setSelectionMode("high_oi")} type="button">Select</button>
        </div>

        {/* Custom Strikes Container */}
        <div className="custom-strikes-container">
          <div className="custom-strikes-hdr">
            <h3>Custom Strikes</h3>
            {selectionMode === "custom" && <span className="selected-badge">✓ Selected</span>}
          </div>

          {/* Closeable color pills */}
          <div className="custom-strike-pills-list">
            {selectedContracts.map((contract, idx) => {
              const color = LINE_COLORS[idx % LINE_COLORS.length];
              return (
                <div key={`${contract.strike}-${contract.type}`} className="custom-strike-pill">
                  <div className="custom-strike-pill-left">
                    <span className="custom-strike-pill-dot" style={{ backgroundColor: color }}></span>
                    <span>{contract.strike} {contract.type}</span>
                  </div>
                  <button
                    className="custom-strike-pill-close"
                    onClick={() => handleRemoveContract(contract.strike, contract.type)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add / Remove strikes table */}
          <div className="strike-table-wrapper">
            <table className="strike-table">
              <thead>
                <tr>
                  <th style={{ color: "#ef4444" }}>CALL</th>
                  <th>STRIKE</th>
                  <th style={{ color: "#10b981" }}>PUT</th>
                </tr>
              </thead>
              <tbody>
                {liveTick.options.map((opt) => {
                  const isCeAdded = selectedContracts.some(
                    (c) => c.strike === opt.strike && c.type === "CE"
                  );
                  const isPeAdded = selectedContracts.some(
                    (c) => c.strike === opt.strike && c.type === "PE"
                  );
                  return (
                    <tr key={opt.strike}>
                      <td>
                        {isCeAdded ? (
                          <span
                            className="selected-cell ce"
                            onClick={() => handleRemoveContract(opt.strike, "CE")}
                          >
                            CE ×
                          </span>
                        ) : (
                          <button
                            className="add-btn"
                            onClick={() => handleAddContract(opt.strike, "CE")}
                            type="button"
                          >
                            Add CE
                          </button>
                        )}
                      </td>
                      <td>{opt.strike}</td>
                      <td>
                        {isPeAdded ? (
                          <span
                            className="selected-cell pe"
                            onClick={() => handleRemoveContract(opt.strike, "PE")}
                          >
                            PE ×
                          </span>
                        ) : (
                          <button
                            className="add-btn"
                            onClick={() => handleAddContract(opt.strike, "PE")}
                            type="button"
                          >
                            Add PE
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            {selectionMode === "high_oi" && <span className="auto-badge">Auto-Tracking Top OI Strikes</span>}
            {selectionMode === "high_volume" && <span className="auto-badge">Auto-Tracking Top Volume Strikes</span>}
            {selectionMode === "custom" && <span className="auto-badge" style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.12)" }}>Custom Strikes Selection</span>}
          </div>
        </header>

        {historicalDate !== todayDateStr && !isLoadingOptionCandles && !hasOptionCandlesData && (
          <div className="warning-banner" style={{ margin: "0 24px 16px 24px", padding: "12px 16px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "6px", color: "#f87171", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>No historical Open Interest (OI) data available for expiry <strong>{selectedExpiry ? new Date(selectedExpiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}</strong> on <strong>{new Date(historicalDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>. This contract was likely not active or trading on this date.</span>
          </div>
        )}

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

              {/* Colored lines for individual selected contracts */}
              {selectedContracts.map((contract, idx) => {
                const color = LINE_COLORS[idx % LINE_COLORS.length];
                const key = `${contract.strike} ${contract.type} OI`;
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
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
