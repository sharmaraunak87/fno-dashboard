# Dhan Integration Notes

The backend supports Dhan as the primary market-data provider.

## Current Integration

- Provider selection: `MARKET_DATA_PROVIDER=dhan`
- Credentials: `DHAN_CLIENT_ID` and `DHAN_ACCESS_TOKEN`
- Option-chain endpoint: `POST https://api.dhan.co/v2/optionchain`
- Expiry-list endpoint: `POST https://api.dhan.co/v2/optionchain/expirylist`
- Request fields: `UnderlyingScrip`, `UnderlyingSeg`, and `Expiry`
- Response fields used by the dashboard: `last_price`, `oc`, `ce`, `pe`, `oi`, `volume`, `implied_volatility`, and `greeks`

The Dhan option-chain API is treated as a snapshot source. The local `/stream` endpoint polls every 3 seconds when the Dhan provider is active, matching Dhan's documented option-chain rate-limit cadence.

The backend trims option-chain rows to `DHAN_OPTION_STRIKE_RANGE` strikes on each side of ATM before sending data to the frontend. This keeps charts and tables focused while preserving Dhan as the raw upstream source.

## Credential Checklist

- `DHAN_CLIENT_ID` is the numeric `dhanClientId` from Dhan.
- `DHAN_ACCESS_TOKEN` is the generated `accessToken`, not API key, API secret, consent ID, or token ID.
- The access token should be the full JWT value. In Dhan's docs it starts with `eyJ...` and should contain three dot-separated parts.
- Manual Dhan Web access tokens are valid for 24 hours, so they need to be regenerated when expired.

## Next Data Tasks

1. Add an instrument-list sync so security IDs are resolved from Dhan metadata instead of defaults.
2. Add Dhan live-feed WebSocket support for LTP/quote updates between option-chain polls.
3. Persist option-chain snapshots so IV/OI trends and historical comparisons can be rendered.
4. Add provider-level retries and request caching to avoid duplicate option-chain calls for the same underlying and expiry.
