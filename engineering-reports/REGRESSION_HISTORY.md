# REGRESSION HISTORY (`BorngreatAccounting`)

| Date | Issue ID | Regression / Symptom | Root Cause | Fix & Prevention |
|---|---|---|---|---|
| 2026-11-15 | `BUG-001` | Windows registration failed with `502 Bad Gateway` | Native `bcrypt` C++ addon failed to load on target Windows machines | Switched to pure-JS `bcryptjs` across `Auth.utils.ts` and `SystemUser.ts` |
| 2026-11-15 | `BUG-005` | POS `Complete Sale` clipped in non-fullscreen mode after setting `calc(100vh - 56px)` | Dashboard top bar + container padding exceeded `56px` | Dynamic `getBoundingClientRect().top` viewport measurement + sticky action bar |
| 2026-11-15 | `BUG-005B` | POS receipt modal invisible in Full Screen mode | BlueprintJS `<Dialog>` portaled into `document.body` outside `document.fullscreenElement` | Set `portalContainer={isFullscreen && rootRef.current ? rootRef.current : undefined}` |
| 2026-11-17 | `BUG-007` | Docker Homepage showed `"Sorry about that! Something went wrong"` | `salesByItems` returned an object where `.data` was not an array, crashing `rawItems.map` | Strict `Array.isArray(...)` guards + `InsightsErrorBoundary` wrapper |
| 2026-11-17 | `BUG-008` | Homepage & Report charts showed `0` or mismatched totals vs PDF/table | `findRowByLabel` matched `AGGREGATE` header rows instead of `TOTAL` rows (`INCOME`, `EXPENSES`, `NET_INCOME`, `ASSETS`, `LIABILITY`, `EQUITY`) | Matched exact server schema node IDs prioritizing `rowTypes.includes('TOTAL')` and resolved `total` column index from `table.columns` |
