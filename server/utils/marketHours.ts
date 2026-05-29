export type MarketHoliday = {
  date: string;
  day: string;
  name: string;
};

export const holidays2026: MarketHoliday[] = [
  { date: "2026-01-15", day: "Thursday", name: "Municipal Corporation Election - Maharashtra" },
  { date: "2026-01-26", day: "Monday", name: "Republic Day" },
  { date: "2026-03-03", day: "Tuesday", name: "Holi" },
  { date: "2026-03-26", day: "Thursday", name: "Shri Ram Navami" },
  { date: "2026-03-31", day: "Tuesday", name: "Shri Mahavir Jayanti" },
  { date: "2026-04-03", day: "Friday", name: "Good Friday" },
  { date: "2026-04-14", day: "Tuesday", name: "Dr. Baba Saheb Ambedkar Jayanti" },
  { date: "2026-05-01", day: "Friday", name: "Maharashtra Day" },
  { date: "2026-05-28", day: "Thursday", name: "Bakri Id" },
  { date: "2026-06-26", day: "Friday", name: "Muharram" },
  { date: "2026-09-14", day: "Monday", name: "Ganesh Chaturthi" },
  { date: "2026-10-02", day: "Friday", name: "Mahatma Gandhi Jayanti" },
  { date: "2026-10-20", day: "Tuesday", name: "Dussehra" },
  { date: "2026-11-10", day: "Tuesday", name: "Diwali - Balipratipada" },
  { date: "2026-11-24", day: "Tuesday", name: "Prakash Gurpurb Sri Guru Nanak Dev" },
  { date: "2026-12-25", day: "Friday", name: "Christmas" }
];

export interface MarketStatus {
  isOpen: boolean;
  reason: "OPEN" | "WEEKEND" | "HOLIDAY" | "BEFORE_MARKET" | "AFTER_MARKET";
  reasonText: string;
  currentTimeIst: string;
  nextOpenTimeIst: string;
}

export function getKolkataTime(date = new Date()): Date {
  // Translate time to Asia/Kolkata timezone
  const kolkataString = date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return new Date(kolkataString);
}

export function getMarketStatus(date = new Date()): MarketStatus {
  const istDate = getKolkataTime(date);
  
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day = String(istDate.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  
  const dayOfWeek = istDate.getDay(); // 0 is Sunday, 6 is Saturday
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  const openTime = 9 * 60 + 15; // 09:15 AM = 555 minutes
  const closeTime = 15 * 60 + 30; // 03:30 PM = 930 minutes
  
  const formattedTimeIst = istDate.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  // 1. Check Weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const nextOpen = getNextTradingDay(istDate);
    return {
      isOpen: false,
      reason: "WEEKEND",
      reasonText: "Market is closed for the weekend.",
      currentTimeIst: formattedTimeIst,
      nextOpenTimeIst: formatNextOpenDate(nextOpen)
    };
  }

  // 2. Check Holiday
  const holiday = holidays2026.find((h) => h.date === dateStr);
  if (holiday) {
    const nextOpen = getNextTradingDay(istDate);
    return {
      isOpen: false,
      reason: "HOLIDAY",
      reasonText: `Market is closed for holiday: ${holiday.name}.`,
      currentTimeIst: formattedTimeIst,
      nextOpenTimeIst: formatNextOpenDate(nextOpen)
    };
  }

  // 3. Check Before Market Hours
  if (timeInMinutes < openTime) {
    return {
      isOpen: false,
      reason: "BEFORE_MARKET",
      reasonText: "Market is not open yet (Opens at 9:15 AM).",
      currentTimeIst: formattedTimeIst,
      nextOpenTimeIst: `${dateStr} 09:15 AM IST`
    };
  }

  // 4. Check After Market Hours
  if (timeInMinutes > closeTime) {
    const nextOpen = getNextTradingDay(istDate);
    return {
      isOpen: false,
      reason: "AFTER_MARKET",
      reasonText: "Market is closed for the day (Closes at 3:30 PM).",
      currentTimeIst: formattedTimeIst,
      nextOpenTimeIst: formatNextOpenDate(nextOpen)
    };
  }

  // 5. Market is Open
  return {
    isOpen: true,
    reason: "OPEN",
    reasonText: "Market is open.",
    currentTimeIst: formattedTimeIst,
    nextOpenTimeIst: ""
  };
}

function getNextTradingDay(startDate: Date): Date {
  const nextDate = new Date(startDate);
  
  while (true) {
    nextDate.setDate(nextDate.getDate() + 1);
    const dayOfWeek = nextDate.getDay();
    
    // Check if weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }
    
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, "0");
    const day = String(nextDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    
    // Check if holiday
    const isHoliday = holidays2026.some((h) => h.date === dateStr);
    if (isHoliday) {
      continue;
    }
    
    // Found next open trading day
    break;
  }
  
  return nextDate;
}

function formatNextOpenDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  
  const dayName = date.toLocaleDateString("en-IN", { weekday: "long" });
  return `${dayName}, ${day}-${date.toLocaleDateString("en-IN", { month: "short" })}-${year} at 09:15 AM IST`;
}
