const summaryData = [
  {
    category: "FII",
    segment: "Cash",
    buy: 14820.45,
    sell: 13240.12,
    net: 1580.33,
    netOi: 0,
  },
  {
    category: "FII",
    segment: "Index Futures",
    buy: 28450.0,
    sell: 31200.0,
    net: -2750.0,
    netOi: -12400,
  },
  {
    category: "FII",
    segment: "Index Options",
    buy: 182400.0,
    sell: 179800.0,
    net: 2600.0,
    netOi: 8200,
  },
  {
    category: "FII",
    segment: "Stock Futures",
    buy: 9800.0,
    sell: 10200.0,
    net: -400.0,
    netOi: -1800,
  },
  {
    category: "DII",
    segment: "Cash",
    buy: 11240.8,
    sell: 9820.4,
    net: 1420.4,
    netOi: 0,
  },
  {
    category: "DII",
    segment: "Index Futures",
    buy: 4200.0,
    sell: 3800.0,
    net: 400.0,
    netOi: 2100,
  },
];

const formatCr = (v: number) => {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "+";
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(2)}K Cr`;
  return `${sign}₹${abs.toFixed(2)} Cr`;
};

export function FiiDiiSummary() {
  const fiiNetCash = summaryData.filter((d) => d.category === "FII" && d.segment === "Cash").reduce((s, d) => s + d.net, 0);
  const diiNetCash = summaryData.filter((d) => d.category === "DII" && d.segment === "Cash").reduce((s, d) => s + d.net, 0);

  return (
    <div className="tool-section">
      <div className="tool-summary-row">
        <div className={`summary-chip ${fiiNetCash >= 0 ? "green" : "red"}`}>
          <span>FII Net Cash</span>
          <strong>{formatCr(fiiNetCash)}</strong>
        </div>
        <div className={`summary-chip ${diiNetCash >= 0 ? "green" : "red"}`}>
          <span>DII Net Cash</span>
          <strong>{formatCr(diiNetCash)}</strong>
        </div>
      </div>
      <p className="tool-subtitle">Institutional activity across segments — Today's provisional data</p>
      <div className="booster-table-wrap">
        <table className="booster-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Segment</th>
              <th>Buy (Cr)</th>
              <th>Sell (Cr)</th>
              <th>Net (Cr)</th>
              <th>Net OI (Lots)</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map((row, i) => (
              <tr key={i}>
                <td>
                  <span className={`type-badge ${row.category === "FII" ? "ce" : "pe"}`}>{row.category}</span>
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{row.segment}</td>
                <td className="text-green">₹{row.buy.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                <td className="text-red">₹{row.sell.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                <td className={row.net >= 0 ? "text-green font-bold" : "text-red font-bold"}>
                  {row.net >= 0 ? "+" : ""}₹{row.net.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </td>
                <td className={row.netOi >= 0 ? "text-green" : "text-red"}>
                  {row.netOi === 0 ? "—" : `${row.netOi > 0 ? "+" : ""}${row.netOi.toLocaleString("en-IN")}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
