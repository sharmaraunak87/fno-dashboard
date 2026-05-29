import {
  Activity,
  Bell,
  CandlestickChart,
  Gauge,
  Layers3,
  LineChart,
  Radio,
  Search,
  ShieldAlert,
  TrendingUp
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { MarketTick, OptionRow } from "./types";

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
  const [tick, setTick] = useState<MarketTick>(fallbackTick);
  const [history, setHistory] = useState<Array<{ time: string; spot: number; pcr: number }>>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let fallbackInterval: number | undefined;

    const startFallback = () => {
      window.clearInterval(fallbackInterval);
      setIsLive(false);
      fallbackInterval = window.setInterval(() => {
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
      socket.send(JSON.stringify({ symbol }));
    });

    socket.addEventListener("message", (event) => {
      const nextTick = JSON.parse(event.data) as MarketTick;
      setTick(nextTick);
      setHistory((current) => [
        ...current.slice(-23),
        {
          time: new Date(nextTick.timestamp).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          }),
          spot: nextTick.spot,
          pcr: nextTick.pcr
        }
      ]);
    });

    socket.addEventListener("close", startFallback);
    socket.addEventListener("error", startFallback);

    return () => {
      window.clearInterval(fallbackInterval);
      socket.close();
    };
  }, [symbol]);

  const totals = useMemo(() => {
    const callOi = tick.options.reduce((sum, row) => sum + row.callOi, 0);
    const putOi = tick.options.reduce((sum, row) => sum + row.putOi, 0);
    const volume = tick.options.reduce((sum, row) => sum + row.volume, 0);
    const highestGamma = tick.options.reduce((best, row) => Math.max(best, row.gamma), 0);

    return { callOi, putOi, volume, highestGamma };
  }, [tick.options]);

  const selectedRows = useMemo(() => {
    return [...tick.options]
      .sort((a, b) => Math.abs(a.strike - tick.spot) - Math.abs(b.strike - tick.spot))
      .slice(0, 7)
      .sort((a, b) => a.strike - b.strike);
  }, [tick.options, tick.spot]);

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
          <a className="active" href="#overview">
            <Activity aria-hidden="true" /> Overview
          </a>
          <a href="#oi">
            <Layers3 aria-hidden="true" /> OI Heatmap
          </a>
          <a href="#gamma">
            <Gauge aria-hidden="true" /> Greeks
          </a>
          <a href="#screeners">
            <Search aria-hidden="true" /> Screeners
          </a>
          <a href="#alerts">
            <Bell aria-hidden="true" /> Alerts
          </a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>FNO market dashboard</p>
            <h1>{tick.symbol} options command center</h1>
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

        <section className="status-strip" id="overview">
          <Metric icon={<Radio />} label={isLive ? "Live feed" : "Offline"} value={formatTime(tick.timestamp)} />
          <Metric icon={<TrendingUp />} label="Spot" value={tick.spot.toLocaleString("en-IN")} tone={tick.change >= 0 ? "up" : "down"} />
          <Metric icon={<Activity />} label="PCR" value={tick.pcr.toFixed(2)} />
          <Metric icon={<ShieldAlert />} label="Max pain" value={tick.maxPain.toLocaleString("en-IN")} />
        </section>

        <section className="content-grid">
          <article className="panel market-panel">
            <PanelTitle title="Price and PCR" subtitle="Live ticks from the mock stream" />
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={history}>
                <CartesianGrid stroke="#e6edf3" vertical={false} />
                <XAxis dataKey="time" minTickGap={28} tickLine={false} />
                <YAxis yAxisId="spot" domain={["dataMin - 30", "dataMax + 30"]} tickLine={false} width={72} />
                <YAxis yAxisId="pcr" orientation="right" domain={[0.7, 1.4]} tickLine={false} width={48} />
                <Tooltip />
                <Area yAxisId="spot" type="monotone" dataKey="spot" fill="#d7f4ec" stroke="#178c70" strokeWidth={2} />
                <Line yAxisId="pcr" type="monotone" dataKey="pcr" stroke="#d26b30" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </article>

          <article className="panel">
            <PanelTitle title="Call vs Put OI" subtitle="Aggregate open interest" />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[{ side: "Calls", value: totals.callOi }, { side: "Puts", value: totals.putOi }]}>
                <CartesianGrid stroke="#e6edf3" vertical={false} />
                <XAxis dataKey="side" tickLine={false} />
                <YAxis tickFormatter={compact} tickLine={false} width={54} />
                <Tooltip formatter={(value) => Number(value).toLocaleString("en-IN")} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  <Cell fill="#2276a5" />
                  <Cell fill="#c15f35" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="panel wide-panel" id="oi">
            <PanelTitle title="Multi-strike OI comparison" subtitle="Nearest strikes around spot" />
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={selectedRows}>
                <CartesianGrid stroke="#e6edf3" vertical={false} />
                <XAxis dataKey="strike" tickLine={false} />
                <YAxis tickFormatter={compact} tickLine={false} width={58} />
                <Tooltip formatter={(value) => Number(value).toLocaleString("en-IN")} />
                <Bar dataKey="callOi" name="Call OI" fill="#2276a5" radius={[5, 5, 0, 0]} />
                <Bar dataKey="putOi" name="Put OI" fill="#c15f35" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="panel" id="gamma">
            <PanelTitle title="Gamma heatmap" subtitle="Risk concentration by strike" />
            <div className="heatmap">
              {selectedRows.map((row) => (
                <div
                  className="heat-cell"
                  key={row.strike}
                  style={{ "--heat": `${Math.max(0.2, row.gamma / Math.max(totals.highestGamma, 0.001))}` } as CSSProperties}
                >
                  <span>{row.strike}</span>
                  <strong>{row.gamma.toFixed(5)}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel" id="screeners">
            <PanelTitle title="Screeners" subtitle="Volume and IV watch" />
            <div className="screener-list">
              <Screener label="Volume build-up" value={compact(totals.volume)} state="active" />
              <Screener label="PCR regime" value={tick.pcr > 1 ? "Put heavy" : "Call heavy"} state="neutral" />
              <Screener label="IV expansion" value={`${averageIv(selectedRows).toFixed(1)}%`} state="watch" />
            </div>
          </article>

          <article className="panel table-panel">
            <PanelTitle title="Options chain" subtitle="Greeks, IV, OI and volume" />
            <OptionsTable rows={tick.options} spot={tick.spot} />
          </article>
        </section>
      </section>
    </main>
  );
}

function Metric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="metric">
      <span className="metric-icon">{icon}</span>
      <div>
        <span>{label}</span>
        <strong className={tone}>{value}</strong>
      </div>
    </div>
  );
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="panel-title">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <LineChart aria-hidden="true" />
    </div>
  );
}

function Screener({ label, value, state }: { label: string; value: string; state: "active" | "neutral" | "watch" }) {
  return (
    <div className={`screener ${state}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OptionsTable({ rows, spot }: { rows: OptionRow[]; spot: number }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Strike</th>
            <th>Call OI</th>
            <th>Put OI</th>
            <th>Call IV</th>
            <th>Put IV</th>
            <th>Delta</th>
            <th>Gamma</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className={Math.abs(row.strike - spot) < 30 ? "atm" : ""} key={row.strike}>
              <td>{row.strike}</td>
              <td>{compact(row.callOi)}</td>
              <td>{compact(row.putOi)}</td>
              <td>{row.callIv}%</td>
              <td>{row.putIv}%</td>
              <td>{row.delta}</td>
              <td>{row.gamma.toFixed(5)}</td>
              <td>{compact(row.volume)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function compact(value: number) {
  return Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function averageIv(rows: OptionRow[]) {
  if (!rows.length) {
    return 0;
  }

  return rows.reduce((sum, row) => sum + (row.callIv + row.putIv) / 2, 0) / rows.length;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
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
    symbol,
    spot,
    change: Number(((localRandom() - 0.48) * 1.2).toFixed(2)),
    pcr: Number((putOi / callOi).toFixed(2)),
    maxPain: options.reduce((best, row) => (Math.abs(row.callOi - row.putOi) < Math.abs(best.callOi - best.putOi) ? row : best), options[0]).strike,
    timestamp: new Date().toISOString(),
    options
  };
}
