# Multi-Strike OI Checklist

- `[x]` Multi-Strike Tab Component
  - Create `src/components/MultiStrikeOiTab.tsx` containing the filter sidebar and the composed line graph.
- `[x]` App Shell Integration
  - Modify `src/App.tsx` to route the Strike OI Analysis tab to `MultiStrikeOiTab`.
- `[x]` Styling Polish
  - Update `src/styles.css` with the filters card layout, custom toggles, closeable pills, and legend labels.
- `[x]` Build & Validate
  - Run typecheck and bundle check.
- `[x]` Live Testing
  - Run dev server and manually verify automatic top 6 selection and live updates.
