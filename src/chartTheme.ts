/** Shared Recharts theme — matches the new CSS design system */
export const CHART = {
  grid:    "rgba(255,255,255,0.05)",
  axis:    "#4e5a6e",
  tooltip: { backgroundColor: "#0b0e18", borderColor: "rgba(255,255,255,0.08)", color: "#f1f5f9" },
  green:   "#22c55e",
  red:     "#f43f5e",
  indigo:  "#6366f1",
  amber:   "#f59e0b",
  cyan:    "#06b6d4",
  violet:  "#a78bfa",
  pink:    "#ec4899",
  teal:    "#14b8a6",
} as const;

export const LINE_COLORS = [
  "#f43f5e", "#22c55e", "#6366f1", "#f59e0b",
  "#ec4899", "#06b6d4", "#a78bfa", "#14b8a6",
] as const;
