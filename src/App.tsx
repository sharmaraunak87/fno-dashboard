import {
  Activity,
  BarChart2,
  Calendar,
  CandlestickChart,
  ChevronsLeft,
  ChevronsRight,
  Gauge,
  Layers3,
  LineChart,
  Search,
  TrendingUp,
  Users,
  Zap,
  PieChart,
  ArrowUpDown,
  Target,
  Flame,
  GitBranch,
  Clock,
  Grid,
  Sigma,
  Minus,
  Play,
  BarChart,
  Repeat,
  TrendingDown,
  Cpu,
  Globe
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExpirySelector } from "./components/ExpirySelector";
import { MetricStrip } from "./components/MetricStrip";
import { OptionsChainTable } from "./components/OptionsChainTable";
import { HolidaysTable } from "./components/HolidaysTable";
import { MultiStrikeOiTab } from "./components/MultiStrikeOiTab";
import {
  PricePcrChart,
  CallPutOiChart,
  IvSkewChart,
  GammaHeatmap
} from "./components/AnalyticsCharts";
import { FiiDiiCashChart } from "./components/FiiDiiChart";
import { SectorRotationChart } from "./components/SectorRotation";
import { IntradayBooster } from "./components/IntradayBooster";
import { IndexContributors } from "./components/IndexContributors";
import { IndexWeightage } from "./components/IndexWeightage";
import { AdvanceDeclineChart } from "./components/AdvanceDeclineChart";
import { StrategyChart } from "./components/StrategyChart";
import { SmartOI } from "./components/SmartOI";
import { FutureSentimentCycle } from "./components/FutureSentimentCycle";
import { Timeseries } from "./components/Timeseries";
import { FiiDiiSummary } from "./components/FiiDiiSummary";
import { IvGrid } from "./components/IvGrid";
import { IvHvChart } from "./components/IvHvChart";
import { VolatilitySkew } from "./components/VolatilitySkew";
import { PremiumDecay } from "./components/PremiumDecay";
import { PriceVsOI } from "./components/PriceVsOI";
import { MaxPainChart } from "./components/MaxPainChart";
import { PeCeDifference } from "./components/PeCeDifference";
import { OptionSimulator } from "./components/OptionSimulator";
import { MultiStraddleChart } from "./components/MultiStraddleChart";
import { OpenInterestChart } from "./components/OpenInterestChart";
import { StraddleChart } from "./components/StraddleChart";
import { FutureHeatmap } from "./components/FutureHeatmap";
import { FutureIntraday } from "./components/FutureIntraday";
import { MarketMovers } from "./components/MarketMovers";
import { PutCallRatioChart } from "./components/PutCallRatioChart";
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

// Nav groups for sidebar
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { id: "overview", label: "Live Overview", icon: Activity },
      { id: "holidays", label: "Market Holidays", icon: Calendar },
    ]
  },
  {
    label: "Options",
    items: [
      { id: "oi", label: "Strike OI Analysis", icon: Layers3 },
      { id: "smart_oi", label: "Smart OI", icon: Zap },
      { id: "open_interest", label: "Open Interest", icon: BarChart2 },
      { id: "pe_ce_diff", label: "PE-CE Difference", icon: Minus },
      { id: "multistrike_chart", label: "MultiStrike Chart", icon: LineChart },
      { id: "multistraddle", label: "Multi-Straddle Chart", icon: GitBranch },
      { id: "straddle", label: "Straddle Chart", icon: Repeat },
      { id: "price_vs_oi", label: "Price vs OI", icon: TrendingUp },
      { id: "max_pain", label: "Max Pain", icon: Target },
      { id: "pcr", label: "Put-Call Ratio", icon: ArrowUpDown },
      { id: "timeseries", label: "Timeseries", icon: Clock },
      { id: "option_chain", label: "Option Chain Live", icon: Grid },
    ]
  },
  {
    label: "Volatility",
    items: [
      { id: "greeks", label: "Gamma Exposure", icon: Gauge },
      { id: "iv_skew", label: "Volatility Skew", icon: Sigma },
      { id: "iv_hv", label: "IV-HV", icon: BarChart },
      { id: "iv_grid", label: "IV Grid", icon: Grid },
      { id: "premium_decay", label: "Premium Decay", icon: TrendingDown },
    ]
  },
  {
    label: "Futures",
    items: [
      { id: "future_sentiment", label: "Future Sentiment", icon: Cpu },
      { id: "future_heatmap", label: "Future Heatmap", icon: Flame },
      { id: "future_intraday", label: "Future Intraday", icon: Play },
    ]
  },
  {
    label: "Market",
    items: [
      { id: "fii_dii", label: "FII/DII Cash", icon: Users },
      { id: "fii_dii_summary", label: "FII/DII Summary", icon: Users },
      { id: "sector_rotation", label: "Sector Rotation", icon: Globe },
      { id: "index_contributors", label: "Index Contributors", icon: TrendingUp },
      { id: "index_weightage", label: "Index Weightage", icon: PieChart },
      { id: "advance_decline", label: "Advance Decline", icon: ArrowUpDown },
      { id: "market_movers", label: "Market Movers", icon: Flame },
      { id: "intraday_booster", label: "Intraday Booster", icon: Zap },
    ]
  },
  {
    label: "Strategy",
    items: [
      { id: "strategy_chart", label: "Strategy Chart", icon: GitBranch },
      { id: "simulator", label: "Simulator", icon: Play },
      { id: "screeners", label: "Screeners & Watch", icon: Search },
    ]
  },
];

// Tabs that don't need expiry/metric strip
const NO_EXPIRY_TABS = new Set([
  "holidays", "fii_dii", "fii_dii_summary", "sector_rotation",
  "index_contributors", "index_weightage", "advance_decline",
  "market_movers", "intraday_booster", "future_sentiment",
  "future_heatmap", "future_intraday", "screeners"
]);

// Tabs that use full-width layout (no options chain at bottom)
const FULL_WIDTH_TABS = new Set([
  "oi", "holidays", "fii_dii", "fii_dii_summary", "sector_rotation",
  "index_contributors", "index_weightage", "advance_decline",
  "market_movers", "intraday_booster", "future_sentiment",
  "future_heatmap", "future_intraday", "timeseries", "simulator",
  "strategy_chart", "screeners"
]);

export function App() {
  const [symbol, setSymbol] = useState("NIFTY");
  const [selectedExpiry, setSelectedExpiry] = useState<string | undefined>(undefined);
  const [tick, setTick] = useState<MarketTick>(fallbackTick);
  const [history, setHistory] = useState<Array<{ time: string; spot: number; pcr: number }>>([]);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [marketHours, setMarketHours] = useState<MarketStatus | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const marketHoursRef = useRef(marketHours);
  useEffect(() => { marketHoursRef.current = marketHours; }, [marketHours]);

  useEffect(() => { setSelectedExpiry(undefined); }, [symbol]);

  useEffect(() => {
    let active = true;
    const url = `/api/snapshot/${symbol}${selectedExpiry ? `?expiry=${selectedExpiry}` : ""}`;
    fetch(url)
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data: MarketTick) => { if (active) setTick(data); })
      .catch(() => {});
    return () => { active = false; };
  }, [symbol, selectedExpiry]);

  useEffect(() => {
    const fetchStatus = () => {
      fetch("/api/market-status")
        .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
        .then((data: { data: MarketStatus }) => setMarketHours(data.data))
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
        if (marketHoursRef.current && !marketHoursRef.current.isOpen) return;
        const nextTick = createLocalTick(symbol);
        setTick(nextTick);
        setHistory((current) => [...current.slice(-23), { time: formatTime(nextTick.timestamp), spot: nextTick.spot, pcr: nextTick.pcr }]);
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
      if (nextTick.marketHours) setMarketHours(nextTick.marketHours);
      setHistory((current) => {
        const timeVal = new Date(nextTick.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        if (current.length > 0 && current[current.length - 1].time === timeVal) return current;
        return [...current.slice(-23), { time: timeVal, spot: nextTick.spot, pcr: nextTick.pcr }];
      });
    });
    socket.addEventListener("close", startFallback);
    socket.addEventListener("error", startFallback);
    return () => { window.clearInterval(fallbackInterval); socket.close(); };
  }, [symbol, selectedExpiry]);

  const totals = useMemo(() => ({
    callOi: tick.options.reduce((sum, row) => sum + row.callOi, 0),
    putOi: tick.options.reduce((sum, row) => sum + row.putOi, 0),
    volume: tick.options.reduce((sum, row) => sum + row.volume, 0),
  }), [tick.options]);

  const averageIv = useMemo(() => {
    if (!tick.options.length) return 0;
    return tick.options.reduce((sum, row) => sum + (row.callIv + row.putIv) / 2, 0) / tick.options.length;
  }, [tick.options]);

  const isMarketClosed = marketHours ? !marketHours.isOpen : false;
  const showExpiry = !NO_EXPIRY_TABS.has(activeTab);
  const showOptionsChain = !FULL_WIDTH_TABS.has(activeTab) && activeTab !== "holidays";

  return (
    <main className={`app-shell ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="brand">
          <div className="brand-logo-section">
            <CandlestickChart aria-hidden="true" />
            {!isSidebarCollapsed && <div><strong>FNO Desk</strong><span>Options analytics</span></div>}
          </div>
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="sidebar-toggle-btn"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} type="button">
            {isSidebarCollapsed ? <ChevronsRight aria-hidden="true" /> : <ChevronsLeft aria-hidden="true" />}
          </button>
        </div>
        <nav className="nav-list" aria-label="Dashboard modules">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="nav-group">
              {!isSidebarCollapsed && <span className="nav-group-label">{group.label}</span>}
              {group.items.map(({ id, label, icon: Icon }) => (
                <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)} title={label}>
                  <Icon aria-hidden="true" />
                  {!isSidebarCollapsed && <span>{label}</span>}
                </button>
              ))}
            </div>
          ))}
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
              <button className={item === symbol ? "selected" : ""} key={item} onClick={() => setSymbol(item)} type="button">{item}</button>
            ))}
          </div>
        </header>

        {isMarketClosed && marketHours && (
          <div className="market-closed-banner" role="alert">
            <span className="banner-pulse-dot"></span>
            <div className="banner-content">
              <strong>MARKET CLOSED:</strong> {marketHours.reasonText} Showing final closing snapshot as of{" "}
              <strong>{new Date(tick.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</strong>.
              {marketHours.nextOpenTimeIst && (
                <span className="banner-next-open"> Market opens next on <strong>{marketHours.nextOpenTimeIst}</strong>.</span>
              )}
            </div>
          </div>
        )}

        {showExpiry && (
          <>
            <section className="expiry-bar">
              <ExpirySelector symbol={symbol} selectedExpiry={selectedExpiry} onChange={setSelectedExpiry} />
            </section>
            <MetricStrip isLive={isLive && !isMarketClosed} spot={tick.spot} change={tick.change} pcr={tick.pcr} maxPain={tick.maxPain} timestamp={tick.timestamp} />
          </>
        )}

        <section className="content-grid">
          {activeTab === "holidays" && (
            <article className="panel wide-panel"><HolidaysTable /></article>
          )}

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
            <MultiStrikeOiTab symbol={symbol} setSymbol={setSymbol} selectedExpiry={selectedExpiry}
              setExpiry={setSelectedExpiry} liveTick={tick} isLive={isLive} marketHours={marketHours} />
          )}

          {activeTab === "smart_oi" && (
            <article className="panel wide-panel">
              <PanelTitle title="Smart OI" subtitle="OI change analysis — identify buildup vs unwinding" />
              <SmartOI options={tick.options} spot={tick.spot} />
            </article>
          )}

          {activeTab === "open_interest" && (
            <article className="panel wide-panel">
              <PanelTitle title="Open Interest" subtitle="Call vs Put OI distribution across strikes" />
              <OpenInterestChart options={tick.options} spot={tick.spot} />
            </article>
          )}

          {activeTab === "pe_ce_diff" && (
            <article className="panel wide-panel">
              <PanelTitle title="PE-CE Difference" subtitle="Net Put minus Call OI per strike — bullish/bearish bias" />
              <PeCeDifference options={tick.options} spot={tick.spot} />
            </article>
          )}

          {activeTab === "multistrike_chart" && (
            <article className="panel wide-panel">
              <PanelTitle title="MultiStrike Chart" subtitle="Multi-strike OI comparison chart" />
              <MultiStrikeOiTab symbol={symbol} setSymbol={setSymbol} selectedExpiry={selectedExpiry}
                setExpiry={setSelectedExpiry} liveTick={tick} isLive={isLive} marketHours={marketHours} />
            </article>
          )}

          {activeTab === "multistraddle" && (
            <article className="panel wide-panel">
              <PanelTitle title="Multi-Straddle Chart" subtitle="Straddle premium intraday for top 5 near-ATM strikes" />
              <MultiStraddleChart options={tick.options} spot={tick.spot} symbol={symbol} />
            </article>
          )}

          {activeTab === "straddle" && (
            <article className="panel wide-panel">
              <PanelTitle title="Straddle Chart" subtitle="ATM straddle premium intraday decay" />
              <StraddleChart options={tick.options} spot={tick.spot} symbol={symbol} />
            </article>
          )}

          {activeTab === "price_vs_oi" && (
            <article className="panel wide-panel">
              <PanelTitle title="Price vs OI" subtitle="Intraday price and OI overlay — identify long/short build-up" />
              <PriceVsOI symbol={symbol} spot={tick.spot} />
            </article>
          )}

          {activeTab === "max_pain" && (
            <article className="panel wide-panel">
              <PanelTitle title="Max Pain" subtitle="Strike where option writers lose the least — expiry magnet" />
              <MaxPainChart options={tick.options} spot={tick.spot} />
            </article>
          )}

          {activeTab === "pcr" && (
            <article className="panel wide-panel">
              <PanelTitle title="Put-Call Ratio" subtitle="PCR intraday trend — sentiment indicator" />
              <PutCallRatioChart symbol={symbol} currentPcr={tick.pcr} />
            </article>
          )}

          {activeTab === "timeseries" && (
            <article className="panel wide-panel">
              <PanelTitle title="Timeseries" subtitle="OI timeseries across near-ATM strikes" />
              <Timeseries options={tick.options} spot={tick.spot} symbol={symbol} />
            </article>
          )}

          {activeTab === "option_chain" && (
            <article className="panel wide-panel">
              <PanelTitle title="Option Chain Live" subtitle="Real-time side-by-side calls/puts with ATM highlighting" />
              <OptionsChainTable rows={tick.options} spot={tick.spot} />
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

          {activeTab === "iv_skew" && (
            <article className="panel wide-panel">
              <PanelTitle title="Volatility Skew" subtitle="Put vs Call IV skew across strikes" />
              <VolatilitySkew options={tick.options} spot={tick.spot} />
            </article>
          )}

          {activeTab === "iv_hv" && (
            <article className="panel wide-panel">
              <PanelTitle title="IV-HV Chart" subtitle="Implied vs Historical Volatility — 30 day comparison" />
              <IvHvChart symbol={symbol} currentIv={averageIv} />
            </article>
          )}

          {activeTab === "iv_grid" && (
            <article className="panel wide-panel">
              <PanelTitle title="IV Grid" subtitle="Implied Volatility across strikes and expiries" />
              <IvGrid options={tick.options} spot={tick.spot} symbol={symbol} />
            </article>
          )}

          {activeTab === "premium_decay" && (
            <article className="panel wide-panel">
              <PanelTitle title="Premium Decay" subtitle="Theta decay curve — ATM option premium erosion" />
              <PremiumDecay options={tick.options} spot={tick.spot} />
            </article>
          )}

          {activeTab === "future_sentiment" && (
            <article className="panel wide-panel">
              <PanelTitle title="Future Sentiment Cycle" subtitle="Long/Short build-up matrix across symbols and expiries" />
              <FutureSentimentCycle symbol={symbol} />
            </article>
          )}

          {activeTab === "future_heatmap" && (
            <article className="panel wide-panel">
              <PanelTitle title="Future Heatmap" subtitle="Futures price change heatmap across symbols" />
              <FutureHeatmap />
            </article>
          )}

          {activeTab === "future_intraday" && (
            <article className="panel wide-panel">
              <PanelTitle title="Future Intraday" subtitle="Futures price and OI intraday chart" />
              <FutureIntraday symbol={symbol} spot={tick.spot} />
            </article>
          )}

          {activeTab === "fii_dii" && (
            <article className="panel wide-panel">
              <PanelTitle title="FII/DII Cash" subtitle="Institutional buy/sell activity — last 10 sessions" />
              <FiiDiiCashChart />
            </article>
          )}

          {activeTab === "fii_dii_summary" && (
            <article className="panel wide-panel">
              <PanelTitle title="FII/DII Summary" subtitle="Institutional activity across all segments" />
              <FiiDiiSummary />
            </article>
          )}

          {activeTab === "sector_rotation" && (
            <article className="panel wide-panel">
              <PanelTitle title="Sector Rotation" subtitle="Relative Rotation Graph — momentum vs relative strength" />
              <SectorRotationChart />
            </article>
          )}

          {activeTab === "index_contributors" && (
            <article className="panel wide-panel">
              <PanelTitle title="Index Contributors" subtitle="Top constituent point contributions today" />
              <IndexContributors symbol={symbol} />
            </article>
          )}

          {activeTab === "index_weightage" && (
            <article className="panel wide-panel">
              <PanelTitle title="Index Weightage" subtitle="Sector-wise weight distribution in the index" />
              <IndexWeightage symbol={symbol} />
            </article>
          )}

          {activeTab === "advance_decline" && (
            <article className="panel wide-panel">
              <PanelTitle title="Advance Decline Ratio" subtitle="Nifty 50 advances vs declines intraday" />
              <AdvanceDeclineChart />
            </article>
          )}

          {activeTab === "market_movers" && (
            <article className="panel wide-panel">
              <PanelTitle title="Market Movers" subtitle="Top gainers, losers and most active F&O stocks" />
              <MarketMovers />
            </article>
          )}

          {activeTab === "intraday_booster" && (
            <article className="panel wide-panel">
              <PanelTitle title="Intraday Booster" subtitle="High-momentum OI signals for quick intraday trades" />
              <IntradayBooster options={tick.options} spot={tick.spot} symbol={symbol} />
            </article>
          )}

          {activeTab === "strategy_chart" && (
            <article className="panel wide-panel">
              <PanelTitle title="Strategy Chart" subtitle="Option strategy payoff diagram at expiry" />
              <StrategyChart options={tick.options} spot={tick.spot} />
            </article>
          )}

          {activeTab === "simulator" && (
            <article className="panel wide-panel">
              <PanelTitle title="Simulator" subtitle="Build and simulate multi-leg option strategies" />
              <OptionSimulator options={tick.options} spot={tick.spot} />
            </article>
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

          {/* Options chain shown at bottom for relevant tabs */}
          {showOptionsChain && (
            <article className="panel table-panel wide-panel">
              <PanelTitle title="Real-Time Options Chain" subtitle="Side-by-side calls/puts with at-the-money highlighting" />
              <OptionsChainTable rows={tick.options} spot={tick.spot} />
            </article>
          )}
        </section>
      </section>
    </main>
  );
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="panel-title-bar">
      <div><h2>{title}</h2><p>{subtitle}</p></div>
    </div>
  );
}

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
    symbol, spot,
    change: Number(((localRandom() - 0.48) * 1.2).toFixed(2)),
    pcr: Number((putOi / callOi).toFixed(2)),
    maxPain: options.reduce((best, row) => (Math.abs(row.callOi - row.putOi) < Math.abs(best.callOi - best.putOi) ? row : best), options[0]).strike,
    timestamp: new Date().toISOString(),
    options
  };
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
