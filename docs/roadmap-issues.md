# Roadmap Issues

Use these as GitHub Issue titles and bodies when the repository is connected.

## Phase 1: Foundation

### Set up market data adapter layer

Create a backend adapter interface for live ticks, options chain, futures data, and historical candles. Start with the current mock provider and Dhan provider behind the same interface.

Acceptance criteria:
- Adapter exposes typed methods for snapshot, expiry-list, stream subscription, and historical queries.
- Mock provider remains available for local development.
- Provider errors are normalized before reaching API routes.

### Add Dhan instrument-list sync

Download and persist Dhan's instrument list so index and option security IDs are not hardcoded in the app.

Acceptance criteria:
- Instrument metadata is stored locally with security ID, symbol, segment, expiry, strike, and option type.
- NIFTY, BANKNIFTY, and FINNIFTY dashboard presets resolve from stored metadata.
- Sync can be run manually and later scheduled.

### Add Dhan live-feed stream adapter

Use Dhan's live market feed WebSocket for LTP and quote updates between option-chain snapshots.

Acceptance criteria:
- Backend subscribes to selected dashboard instruments only.
- Reconnect and resubscribe logic handles feed disconnects.
- UI receives normalized dashboard ticks through the existing `/stream` endpoint.

### Add persistence schema

Choose PostgreSQL or MongoDB and create schemas for instruments, ticks, options snapshots, watchlists, alerts, and user preferences.

Acceptance criteria:
- Local development database setup is documented.
- Migrations or schema initialization scripts exist.
- Snapshot write/read paths are covered by basic tests.

## Phase 2: Analytics

### Build OI heatmap module

Create a strike-by-expiry OI heatmap with call/put toggles and intensity scale.

Acceptance criteria:
- User can switch between call OI, put OI, and net OI.
- Heatmap works across desktop and mobile widths.
- Cells expose strike, expiry, OI, and OI change in tooltip/details.

### Add call vs put OI analysis

Implement aggregate OI analytics, PCR trends, and max-pain visualization.

Acceptance criteria:
- Displays total call OI, total put OI, PCR, and max pain.
- Shows intraday PCR trend.
- Handles missing data gracefully.

### Implement Greeks calculation service

Add Delta, Gamma, Theta, Vega, and IV calculations for option rows.

Acceptance criteria:
- Service accepts spot, strike, expiry, volatility, rate, and option side.
- Unit tests cover ATM, ITM, and OTM examples.
- UI shows Greeks in the options chain table.

### Build gamma heatmap

Visualize gamma concentration by strike and expiry.

Acceptance criteria:
- Gamma intensity is normalized per selected expiry.
- User can inspect highest gamma strikes.
- Works with streamed updates.

### Build multi-strike OI comparison

Compare selected strikes across call OI, put OI, OI change, volume, and IV.

Acceptance criteria:
- User can select at least five strikes.
- Comparison chart updates with the live symbol.
- Table and chart stay synchronized.

### Add IV charts

Show IV trend, IV skew, and IV percentile.

Acceptance criteria:
- IV trend supports intraday and historical ranges.
- Skew chart compares strikes around ATM.
- Empty states explain unavailable history.

### Add futures trend analysis

Track futures price, basis, volume, and open-interest changes.

Acceptance criteria:
- Displays long buildup, short buildup, short covering, and long unwinding signals.
- Signals are derived in a shared analytics function.
- Screener can filter symbols by signal.

## Phase 3: Workflow

### Build watchlist management

Allow users to create watchlists for indices, stocks, and FNO contracts.

Acceptance criteria:
- User can add, remove, reorder, and rename watchlists.
- Watchlist persists between sessions.
- Selected watchlist drives dashboard context.

### Build alerts and notifications

Create alerts for price, OI change, PCR, IV, and volume conditions.

Acceptance criteria:
- Alerts support above, below, and percentage-change operators.
- Triggered alerts are visible in an alerts panel.
- Backend evaluates alerts from incoming ticks.

### Add technical indicators

Add RSI, MACD, ATR, VWAP, and moving averages to chart modules.

Acceptance criteria:
- Indicators are calculated in a reusable analytics package.
- User can toggle indicators on charts.
- Calculations include tests for known sample data.
