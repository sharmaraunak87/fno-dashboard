import type { OptionRow } from "../types";

interface OptionsChainTableProps {
  rows: OptionRow[];
  spot: number;
}

export function OptionsChainTable({ rows, spot }: OptionsChainTableProps) {
  // Sort rows by strike price ascending
  const sortedRows = [...rows].sort((a, b) => a.strike - b.strike);

  // Helper to format values compactly
  const formatCompact = (val: number) => {
    return Intl.NumberFormat("en-IN", {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(val);
  };

  // Find ATM strike (closest to spot)
  const atmStrike = sortedRows.reduce((best, row) => {
    return Math.abs(row.strike - spot) < Math.abs(best - spot) ? row.strike : best;
  }, sortedRows[0]?.strike ?? 0);

  return (
    <div className="options-chain-wrapper">
      <div className="table-header-indicator">
        <div className="indicator-side calls">CALLS (Bullish Outlook)</div>
        <div className="indicator-center">STRIKE</div>
        <div className="indicator-side puts">PUTS (Bearish Outlook)</div>
      </div>
      <div className="table-wrap">
        <table className="options-chain-table">
          <thead>
            <tr>
              {/* Call Columns */}
              <th className="text-left col-calls">Volume</th>
              <th className="text-right col-calls">OI</th>
              <th className="text-right col-calls">IV</th>
              <th className="text-right col-calls">Delta</th>
              
              {/* Strike Column */}
              <th className="text-center col-strike">Strike</th>
              
              {/* Put Columns */}
              <th className="text-left col-puts">Delta</th>
              <th className="text-left col-puts">IV</th>
              <th className="text-left col-puts">OI</th>
              <th className="text-right col-puts">Volume</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const isItmCall = row.strike < spot;
              const isItmPut = row.strike > spot;
              const isAtm = row.strike === atmStrike;

              return (
                <tr
                  key={row.strike}
                  className={`${isAtm ? "atm-row" : ""} ${isItmCall ? "itm-call-bg" : ""} ${isItmPut ? "itm-put-bg" : ""}`}
                >
                  {/* Call Columns */}
                  <td className="text-left text-dim col-calls">{formatCompact(row.volume * 0.45)}</td>
                  <td className="text-right text-green font-mono col-calls">{formatCompact(row.callOi)}</td>
                  <td className="text-right col-calls">{row.callIv.toFixed(1)}%</td>
                  <td className="text-right col-calls">{row.delta.toFixed(2)}</td>
                  
                  {/* Strike Price (Center) */}
                  <td className="text-center font-bold col-strike">
                    <div className={`strike-badge ${isAtm ? "atm-badge" : ""}`}>
                      {row.strike}
                    </div>
                  </td>
                  
                  {/* Put Columns */}
                  <td className="text-left col-puts">{(row.delta - 1).toFixed(2)}</td>
                  <td className="text-left col-puts">{row.putIv.toFixed(1)}%</td>
                  <td className="text-left text-red font-mono col-puts">{formatCompact(row.putOi)}</td>
                  <td className="text-right text-dim col-puts">{formatCompact(row.volume * 0.55)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
