import {
  Activity,
  Bell,
  Calendar,
  CandlestickChart,
  Gauge,
  Layers3,
  Search,
  TrendingUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ExpirySelector } from "./components/ExpirySelector";
import { MetricStrip } from "./components/MetricStrip";
import { OptionsChainTable } from "./components/OptionsChainTable";
import { HolidaysTable } from "./components/HolidaysTable";
import {
  PricePcrChart,
  CallPutOiChart,
  StrikeOiChart,
  IvSkewChart,
  GammaHeatmap
} from "./components/AnalyticsCharts";
import type { MarketTick, OptionRow, MarketStatus } from "./types";

const symbols = ["NIFTY", "BANKNIFTY", "FINNIFTY"];

const fallbackTick: MarketTick = {
  symbol: "NIFTY",
  spot: 22550,
  change: 0.28,
  pcr: 1.04,
  maxPain: 22550,
  timestamp: new Date().toISOString(),
  options: []
};

export function App() {
  const [symbol, setSymbol] = useState("NIFTY");
  const [selectedExpiry, setSelectedExpiry] = useState<string | undefined>(undefined);
  const [tick, setTick] = useState<MarketTick>(fallbackTick);
  const [history, setHistory] = useState<Array<{ time: string; spot: number; pcr: number }>>([]);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [marketHours, setMarketHours] = useState<MarketStatus | null>(null);

  // Reset expiry when symbol changes to let ExpirySelector auto-select the first one
  useEffect(() => {
    setSelectedExpiry(undefined);
  }, [symbol]);

  // Query market hours status periodically to handle automatic transitions
  useEffect(() => {
    const fetchStatus = () => {
      fetch("/api/market-status")
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data: { data: MarketStatus }) => {
          setMarketHours(data.data);
        })
        .catch(() => {});
    };

    fetchStatus();
    const statusInterval = window.setInterval(fetchStatus, 15000);
    return () => window.clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    let fallbackInterval: number | undefined;

    const startFallback = () => {
      window.clearInterval(fallbackInterval);
      setIsLive(false);
      fallbackInterval = window.setInterval(() => {
        // If market is closed, we freeze and display cached ticks instead of ticking mocks!
        if (marketHours && !marketHours.isOpen) {
          return;
        }

        const nextTick = createLocalTick(symbol);
        setTick(nextTick);
        setHistory((current) => [
          ...current.slice(-23),
          {
            time: formatTime(nextTick.timestamp),
            spot: nextTick.spot,
            pcr: nextTick.pcr
          }
        ]);
      }, 2500);
    };

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/stream`);

    socket.addEventListener("open", () => {
      window.clearInterval(fallbackInterval);
      setIsLive(true);
      socket.send(JSON.stringify({ symbol, expiry: selectedExpiry }));
    });

    socket.addEventListener("message", (event) => {
      const nextTick = JSON.parse(event.data) as MarketTick;
      setTick(nextTick);
      if (nextTick.marketHours) {
        setMarketHours(nextTick.marketHours);
      }
      
      setHistory((current) => {
        const timeVal = new Date(nextTick.timestamp).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
        
        // Prevent duplicate logs if time hasn't changed (e.g. frozen closed state)
        if (current.length > 0 && current[current.length - 1].time === timeVal) {
          return current;
        }
        
        return [
          ...current.slice(-23),
          {
            time: timeVal,
            spot: nextTick.spot,
            pcr: nextTick.pcr
          }
        ];
      });
    });

    socket.addEventListener("close", startFallback);
    socket.addEventListener("error", startFallback);

    return () => {
      window.clearInterval(fallbackInterval);
      socket.close();
    };
  }, [symbol, selectedExpiry, marketHours]);

  // Aggregate totals
  const totals = useMemo(() => {
    const callOi = tick.options.reduce((sum, row) => sum + row.callOi, 0);
    const putOi = tick.options.reduce((sum, row) => sum + row.putOi, 0);
    const volume = tick.options.reduce((sum, row) => sum + row.volume, 0);

    return { callOi, putOi, volume };
  }, [tick.options]);

  const averageIv = useMemo(() => {
    if (!tick.options.length) return 0;
    return tick.options.reduce((sum, row) => sum + (row.callIv + row.putIv) / 2, 0) / tick.options.length;
  }, [tick.options]);

  // Detect display settings
  const isMarketClosed = marketHours ? !marketHours.isOpen : false;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <CandlestickChart aria-hidden="true" />
          <div>
            <strong>FNO Desk</strong>
            <span>Options analytics</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Dashboard modules">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            <Activity aria-hidden="true" /> Live Overview
          </button>
          <button
            className={activeTab === "oi" ? "active" : ""}
            onClick={() => setActiveTab("oi")}
          >
            <Layers3 aria-hidden="true" /> Strike OI Analysis
          </button>
          <button
            className={activeTab === "greeks" ? "active" : ""}
            onClick={() => setActiveTab("greeks")}
          >
            <Gauge aria-hidden="true" /> Gamma & IV Smile
          </button>
          <button
            className={activeTab === "screeners" ? "active" : ""}
            onClick={() => setActiveTab("screeners")}
          >
            <Search aria-hidden="true" /> Screeners & Watch
          </button>
          <button
            className={activeTab === "holidays" ? "active" : ""}
            onClick={() => setActiveTab("holidays")}
          >
            <Calendar aria-hidden="true" /> Market Holidays
          </button>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="subtitle">FNO MARKET DASHBOARD</p>
            <h1>{tick.symbol} Options Command Center</h1>
          </div>
          <div className="symbol-switcher" aria-label="Select index">
            {symbols.map((item) => (
              <button
                className={item === symbol ? "selected" : ""}
                key={item}
                onClick={() => setSymbol(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </header>

        {/* Market Status Banner */}
        {isMarketClosed && marketHours && (
          <div className="market-closed-banner" role="alert">
            <span className="banner-pulse-dot"></span>
            <div className="banner-content">
              <strong>MARKET CLOSED:</strong> {marketHours.reasonText} Showing final closing snapshot as of{" "}
              <strong>{new Date(tick.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</strong>.
              {marketHours.nextOpenTimeIst && (
                <span className="banner-next-open">
                  {" "}Market opens next on <strong>{marketHours.nextOpenTimeIst}</strong>.
                </span>
              )}
            </div>
          </div>
        )}

        {activeTab !== "holidays" && (
          <>
            {/* Expiry Selector Bar */}
            <section className="expiry-bar">
              <ExpirySelector
                symbol={symbol}
                selectedExpiry={selectedExpiry}
                onChange={setSelectedExpiry}
              />
            </section>

            {/* Live Metrics strip */}
            <MetricStrip
              isLive={isLive && !isMarketClosed}
              spot={tick.spot}
              change={tick.change}
              pcr={tick.pcr}
              maxPain={tick.maxPain}
              timestamp={tick.timestamp}
            />
          </>
        )}

        {/* Tab Contents */}
        <section className="content-grid">
          {activeTab === "holidays" ? (
            <article className="panel wide-panel">
              <HolidaysTable />
            </article>
          ) : (
            <>
              {activeTab === "overview" && (
                <>
                  <article className="panel wide-panel">
                    <PanelTitle title="Price and PCR Timeline" subtitle="Ticking price action vs PCR trend" />
                    <PricePcrChart history={history} />
                  </article>

                  <article className="panel">
                    <PanelTitle title="Call vs Put Volume" subtitle="Aggregate open interest ratio" />
                    <CallPutOiChart callOi={totals.callOi} putOi={totals.putOi} />
                  </article>
                </>
              )}

              {activeTab === "oi" && (
                <article className="panel wide-panel">
                  <PanelTitle title="Multi-Strike OI Comparison" subtitle="Visualizing support (green) and resistance (red) across strikes" />
                  <StrikeOiChart options={tick.options} spot={tick.spot} />
                </article>
              )}

              {activeTab === "greeks" && (
                <>
                  <article className="panel">
                    <PanelTitle title="Gamma Exposure (GEX)" subtitle="Net Gamma concentration across strikes" />
                    <GammaHeatmap options={tick.options} spot={tick.spot} />
                  </article>

                  <article className="panel">
                    <PanelTitle title="Implied Volatility (IV) Smile" subtitle="Comparing Call & Put IV skews" />
                    <IvSkewChart options={tick.options} spot={tick.spot} />
                  </article>
                </>
              )}

              {activeTab === "screeners" && (
                <article className="panel wide-panel">
                  <PanelTitle title="Market Screeners" subtitle="Scan for volatility expansion and volume spikes" />
                  <div className="screener-grid">
                    <div className="screener-card active">
                      <span>Volume Build-up</span>
                      <strong>{totals.volume.toLocaleString("en-IN")}</strong>
                      <p>Aggregate trading activity across the option chain</p>
                    </div>
                    <div className="screener-card neutral">
                      <span>PCR Regime</span>
                      <strong>{tick.pcr > 1.2 ? "Bullish (Put Heavy)" : tick.pcr < 0.8 ? "Bearish (Call Heavy)" : "Neutral"}</strong>
                      <p>Ratio of put options open interest relative to calls</p>
                    </div>
                    <div className="screener-card watch">
                      <span>IV Percentile (Estimated)</span>
                      <strong>{averageIv.toFixed(1)}%</strong>
                      <p>Average implied volatility across nearest strikes</p>
                    </div>
                  </div>
                </article>
              )}

              {/* Options Chain table is always shown at the bottom for trading access */}
              <article className="panel table-panel wide-panel">
                <PanelTitle title="Real-Time Options Chain" subtitle="Side-by-side calls/puts with at-the-money highlighting" />
                <OptionsChainTable rows={tick.options} spot={tick.spot} />
              </article>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="panel-title-bar">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

// Fallback random tick creator for offline mode
let localSeed = 88;

function localRandom() {
  localSeed = (localSeed * 1103515245 + 12345) % 2147483648;
  return localSeed / 2147483648;
}

function createLocalTick(symbol: string): MarketTick {
  const base = symbol === "BANKNIFTY" ? 48600 : symbol === "FINNIFTY" ? 21400 : 22550;
  const spot = Number((base + (localRandom() - 0.48) * 160).toFixed(2));
  const baseStrike = Math.round(spot / 50) * 50;
  const options = Array.from({ length: 17 }, (_, index) => {
    const strike = baseStrike + (index - 8) * 50;
    const distance = Math.abs(strike - spot);
    const weight = Math.max(0.2, 1 - distance / 650);

    return {
      strike,
      callOi: Math.round((125000 + localRandom() * 760000) * weight * (strike >= spot ? 1.12 : 0.84)),
      putOi: Math.round((132000 + localRandom() * 810000) * weight * (strike <= spot ? 1.16 : 0.8)),
      callIv: Number((9 + localRandom() * 12 + distance / 260).toFixed(2)),
      putIv: Number((10 + localRandom() * 13 + distance / 280).toFixed(2)),
      gamma: Number((0.0004 + weight * 0.0038 + localRandom() * 0.0009).toFixed(5)),
      delta: Number((0.5 - (strike - spot) / 1300).toFixed(2)),
      volume: Math.round(10000 + localRandom() * 95000 * weight)
    };
  });
  const callOi = options.reduce((sum, row) => sum + row.callOi, 0);
  const putOi = options.reduce((sum, row) => sum + row.putOi, 0);

  return {
    symbol,
    spot,
    change: Number(((localRandom() - 0.48) * 1.2).toFixed(2)),
    pcr: Number((putOi / callOi).toFixed(2)),
    maxPain: options.reduce((best, row) => (Math.abs(row.callOi - row.putOi) < Math.abs(best.callOi - best.putOi) ? row : best), options[0]).strike,
    timestamp: new Date().toISOString(),
    options
  };
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
