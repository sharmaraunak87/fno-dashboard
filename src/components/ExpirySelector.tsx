import { useEffect, useState } from "react";

interface ExpirySelectorProps {
  symbol: string;
  selectedExpiry: string | undefined;
  onChange: (expiry: string) => void;
}

export function ExpirySelector({ symbol, selectedExpiry, onChange }: ExpirySelectorProps) {
  const [expiries, setExpiries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(`/api/expiries/${symbol}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load expiries: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: { data: string[] }) => {
        if (active) {
          setExpiries(data.data);
          setLoading(false);
          // Auto-select the first expiry if none is selected or current selected is not in the list
          if (data.data.length > 0) {
            if (!selectedExpiry || !data.data.includes(selectedExpiry)) {
              onChange(data.data[0]);
            }
          }
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Error fetching expiries");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className="expiry-loading">
        <span className="spinner"></span> Loading expiries...
      </div>
    );
  }

  if (error) {
    return <div className="expiry-error">Error: {error}</div>;
  }

  if (expiries.length === 0) {
    return <div className="expiry-empty">No expiries found</div>;
  }

  return (
    <div className="expiry-selector-wrapper">
      <label htmlFor="expiry-select" className="expiry-label">
        Expiry Date:
      </label>
      <div className="expiry-pills" id="expiry-select">
        {expiries.slice(0, 7).map((exp) => {
          const dateObj = new Date(exp);
          const formattedDate = dateObj.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "2-digit"
          });
          return (
            <button
              key={exp}
              className={`expiry-pill ${selectedExpiry === exp ? "active" : ""}`}
              onClick={() => onChange(exp)}
              type="button"
            >
              {formattedDate}
            </button>
          );
        })}
        {expiries.length > 7 && (
          <select
            className="expiry-dropdown"
            value={expiries.includes(selectedExpiry ?? "") ? selectedExpiry : expiries[0]}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Select further expiries"
          >
            {expiries.slice(7).map((exp) => {
              const dateObj = new Date(exp);
              const formattedDate = dateObj.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "2-digit"
              });
              return (
                <option key={exp} value={exp}>
                  {formattedDate}
                </option>
              );
            })}
          </select>
        )}
      </div>
    </div>
  );
}
