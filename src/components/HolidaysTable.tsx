import { useEffect, useState } from "react";

export interface MarketHoliday {
  date: string;
  day: string;
  name: string;
}

export function HolidaysTable() {
  const [holidays, setHolidays] = useState<MarketHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/holidays")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load holidays");
        }
        return res.json();
      })
      .then((data: { data: MarketHoliday[] }) => {
        setHolidays(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error fetching holidays");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="holidays-loading">
        <span className="spinner"></span> Loading holiday calendar...
      </div>
    );
  }

  if (error) {
    return <div className="holidays-error">Error: {error}</div>;
  }

  const upcomingHolidays = holidays.filter((h) => new Date(h.date) >= new Date());
  const passedHolidays = holidays.filter((h) => new Date(h.date) < new Date());

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="holidays-container">
      <div className="holidays-summary-card">
        <h3>Trading Holidays Calendar 2026</h3>
        <p>
          NSE and BSE trading holidays for the calendar year 2026. The exchanges remain closed
          on weekends (Saturdays and Sundays) except for special trading sessions (e.g. Muhurat Trading).
        </p>
      </div>

      <div className="holidays-table-wrapper">
        <table className="holidays-table">
          <thead>
            <tr>
              <th className="text-left">Holiday Occasion</th>
              <th className="text-center">Date</th>
              <th className="text-right">Day</th>
            </tr>
          </thead>
          <tbody>
            {upcomingHolidays.map((holiday) => (
              <tr key={holiday.date} className="upcoming-holiday-row">
                <td className="text-left font-bold">{holiday.name}</td>
                <td className="text-center text-indigo font-mono">{formatDate(holiday.date)}</td>
                <td className="text-right text-dim">{holiday.day}</td>
              </tr>
            ))}
            {passedHolidays.map((holiday) => (
              <tr key={holiday.date} className="passed-holiday-row">
                <td className="text-left text-dim">{holiday.name} (Passed)</td>
                <td className="text-center text-dim font-mono">{formatDate(holiday.date)}</td>
                <td className="text-right text-dim">{holiday.day}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
