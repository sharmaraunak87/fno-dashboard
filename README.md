# FNO Dashboard

A React + Node.js starter for an options and futures analytics dashboard inspired by full-featured FNO platforms.

## What is included

- React + TypeScript + Vite frontend
- Express backend with provider-based market data
- Dhan option-chain adapter with mock fallback
- WebSocket stream for live-style dashboard ticks
- Dashboard modules for price/PCR, call-vs-put OI, multi-strike OI, gamma heatmap, screeners, and options chain
- Roadmap backlog in `docs/roadmap-issues.md`
- Dhan integration notes in `docs/dhan-integration.md`

## Run locally

PowerShell may block the `npm.ps1` shim on this machine, so use `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

Then open:

```text
http://127.0.0.1:5173
```

The backend runs on `http://127.0.0.1:8787` and Vite proxies `/api` plus `/stream`.

## Dhan data setup

Create a local `.env` from `.env.example` and fill in your Dhan credentials:

```powershell
Copy-Item .env.example .env
```

Required values:

```text
MARKET_DATA_PROVIDER=dhan
DHAN_CLIENT_ID=...
DHAN_ACCESS_TOKEN=...
```

Use the full generated Dhan `accessToken`. It should be the JWT access token, not the API key, API secret, consent ID, or token ID.

The backend reads Dhan option-chain data from `https://api.dhan.co/v2/optionchain` and expiry lists from `/optionchain/expirylist`. If credentials are missing, it automatically uses the mock provider so the dashboard still runs.

Security IDs are configurable because they should ultimately be synced from Dhan's instrument list:

```text
DHAN_NIFTY_SECURITY_ID=13
DHAN_BANKNIFTY_SECURITY_ID=25
DHAN_FINNIFTY_SECURITY_ID=27
```

By default, Dhan option-chain responses are trimmed to `20` strikes on each side of ATM so the dashboard stays focused:

```text
DHAN_OPTION_STRIKE_RANGE=20
```

## Next implementation steps

1. Add a Dhan instrument-list sync job and store canonical security IDs.
2. Add database persistence for option-chain snapshots, watchlists, alerts, and historical candles.
3. Add Dhan live-feed WebSocket support for LTP updates between option-chain polls.
4. Convert `docs/roadmap-issues.md` into GitHub Issues once GitHub access is available.
