# FNO Dashboard: Multi-Strike OI Feature Expansion Plan

We are adding an advanced, interactive **Multi-Strike OI** module to the dashboard, matching the visual layouts in the user's screenshots. This includes a left-hand filter sidebar, auto-selection of the top 6 highest-OI strikes, live tracking/replacement of strikes based on volume build-up, and a Recharts line chart tracking strike OI against spot price over a 9:15 AM to 3:30 PM timeline.

## User Review Required

> [!IMPORTANT]
> - **Filter Sidebar**: We will construct a dedicated split layout on the "Strike OI Analysis" tab. The left side will contain a `Filter Options` panel with selectors for: Symbol, Expiry Date, Strike Prices (with pill-based multi-select), Historical Date picker, and toggles for `Live Data` and `Live Updates`.
> - **Top 6 Highest-OI Strike Selection**: The system will automatically pick the top 6 strikes with the highest Open Interest (OI) from the current options chain. If a new strike overtakes an existing one in OI during the trading session, the app will update the tracking set.
> - **Historical Timeline Simulation**: To display a realistic timeline (9:15 AM to 3:30 PM IST) immediately upon loading the tab (even after hours), the frontend will generate a high-fidelity array of historical intraday ticks. The live WebSocket connection will then append new ticks onto this timeline as they arrive.

## Proposed Changes

We will introduce a dedicated component for Multi-Strike analysis:

### 1. [NEW] [MultiStrikeOiTab.tsx](file:///C:/Users/ACER/Documents/Codex/2026-05-29/justticks-in-is-a-comprehensive-stock-2/src/components/MultiStrikeOiTab.tsx)
- Contains the split-panel workspace:
  - **Left Sidebar (Filter Options)**:
    - Symbol dropdown (NIFTY, BANKNIFTY, FINNIFTY).
    - Expiry dropdown (fetches expiries dynamically).
    - Strike Prices multi-select search dropdown. Selected strikes are displayed as closeable pills (e.g. `24000 CE x`).
    - Historical Date picker.
    - Status toggles matching the screenshots (`Live Data`, `Live Updates`).
  - **Right Main Content Panel**:
    - Mode switcher: `Individual` (visualizing Call or Put OI separately) vs `Call vs Put` (comparing CE/PE of selected strikes).
    - **Timeline Line Chart**:
      - Secondary axis: Spot price (dotted grey line).
      - Primary axis: Open Interest values for up to 6 selected strikes.
      - Smooth interpolation lines, interactive tooltips, and color legends matching the screenshot.

### 2. [MODIFY] [App.tsx](file:///C:/Users/ACER/Documents/Codex/2026-05-29/justticks-in-is-a-comprehensive-stock-2/src/App.tsx)
- Connect the symbol and expiry state from the `MultiStrikeOiTab` sidebar filter to the global state (so changing them in the sidebar updates the whole dashboard and WebSocket stream).
- Pass ticking values and history lists into the Multi-Strike tab.

### 3. [MODIFY] [styles.css](file:///C:/Users/ACER/Documents/Codex/2026-05-29/justticks-in-is-a-comprehensive-stock-2/src/styles.css)
- Implement rules for:
  - `.filter-options-panel` card (styling drop-downs, date picker, toggles, close buttons).
  - Split container layout for the MultiStrike workspace.
  - Interactive pill items for selected strikes.
  - Multi-Strike toggle buttons (`Individual` vs `Call vs Put`).

## Verification Plan

## Automated Tests
- Run `npm run typecheck` to verify no compilation and typing errors.
- Run `npm run build` to confirm Vite production bundler passes.

## Manual Verification
- Open the tab "Strike OI Analysis" at `http://127.0.0.1:5174/`.
- Verify the sidebar displays on the left side with active dropdowns and toggles.
- Confirm the Multi-Strike chart auto-selects the top 6 strikes with the highest OI initially.
- Try deleting a strike pill and adding a new one via the dropdown, confirming the chart adjusts lines instantly.
- Toggle between `Individual` and `Call vs Put` and check chart renders.
