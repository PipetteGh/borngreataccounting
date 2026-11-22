# PERFORMANCE AUDIT (`BorngreatAccounting`)

## 1. Identified Bottlenecks & Optimizations Applied
| Layer | Bottleneck Identified | Optimization Implemented | Impact |
|---|---|---|---|
| **Backend API (`packages/server/src/main.ts`)** | Large JSON payloads (`/api/items`, `/api/accounts`, `/api/financial_statements/*`) were transmitted uncompressed | Added native `zlib.gzipSync` middleware for JSON responses `> 1 KB` when client sends `Accept-Encoding: gzip` | **70–85% payload size reduction** |
| **React Query Cache (`App.tsx`, `hooks/query/base.tsx`)** | `new QueryClient(queryConfig)` was instantiated inside `App()` render function and `refetchOnWindowFocus: true` refetched all active queries on every window focus/alt-tab | Moved `queryClient` to module scope; set `refetchOnWindowFocus: false` and `staleTime: 60000` | **Eliminated redundant refetches & cache resets** |
| **POS Register (`POSPage.tsx`)** | Rendering 250+ product cards on open and linear array scans on barcode input slowed keystrokes | Default view displays **Top 10 Most Purchased** items; pre-indexed `O(1)` `skuMap` (`Map<string, PosItem>`); capped search DOM nodes to 60; optimistic local stock & sales count updates on checkout | **Sub-millisecond barcode lookup & instant POS rendering** |
| **Automation Bulk Execution (`AutomationPage.tsx`)** | Sequential requests would block on 200+ matched items | Batched concurrent execution in chunks of `10` via `Promise.allSettled` | **~10x faster bulk inventory updates** |
| **Dashboard & Report Charts (`FinancialCharts.tsx`)** | Third-party charting libraries add 150–400 KB gzipped bundle weight | Built zero-dependency SVG chart primitives (`BarChartCard`, `DonutChartCard`, `HorizontalBarListCard`, `KpiMetricCard`) | **0 KB external dependency overhead** |
| **Tenancy Model Init (`TenantModelsInitialize.module.ts`)** | Every HTTP request created a new `ContextId`, resolved 9 DI models, and re-ran Objection `initialize(knexInstance, models)` | Deduplicated per `Knex` pool via `WeakSet<Knex>` + `WeakMap<Knex, Promise<boolean>>` in-flight guard | **1x init per tenant pool instead of every request** |
| **Auth & Tenancy DB Lookups (`AuthSignin.service.ts`, `TenancyContext.service.ts`, `TenancyGlobal.guard.ts`)** | Each authenticated request repeated `system_users`, `tenants`, and `user_tenants` SQL queries across `JwtStrategy` + 3 guards | Added per-request CLS reuse + 15s in-memory cache (`verifiedUserCache`, `tenantCache`, `membershipCache`) for active/initialized tenants | **Zero redundant System DB queries on warm requests** |
| **Serialization & Compression (`serialize.interceptor.ts`, `to-json.interceptor.ts`, `main.ts`)** | `deepdash` `mapKeysDeep` / `mapValuesDeep` caused `265.75 ms` CPU blocking per 500-row transform | Replaced with fast WeakMap-guarded iterative recursion + memoized key-case maps (`camelToSnakeKeyCache`, `snakeToCamelKeyCache`) and `Z_BEST_SPEED` gzip | **`54.0x` faster (`265.75 ms` → `4.92 ms`)** |
| **Gateway & Static Delivery (`windows-gateway.js`)** | Served `2.61 MB` JS bundle uncompressed from disk with no `Cache-Control`, `ETag`, or keep-alive backend sockets | Added persistent `http.Agent({ keepAlive: true })`, RAM static cache with pre-compressed `gzip`, `ETag`/`304`, and `immutable` headers on `/assets/*` | **`12.4x` faster (`18.67 ms` → `1.50 ms` warm), `84.3%` smaller transfer** |
| **Webapp Bundle & UI Caching (`vite.config.ts`, `utils/index.tsx`, `HomepageInsights.tsx`, `POSPage.tsx`)** | Duplicate `*-legacy-*.js` build doubled compile time (`3m 6s`) & shipping size; `/pos` and `/` showed spinners on repeat visits | Removed `@vitejs/plugin-legacy`, split `vendor-react`/`vendor-blueprint`/`vendor-utils` chunks, memoized client case conversion, and added stale-while-revalidate caches for `/` and `/pos` | **`2.6x` faster build (`71s`), `~3x` faster Chromium dashboard load (`14.9s` → `5.18s`)** |

## 2. Measured Before vs. After Benchmark (2026-11-22)

Measured against live `http://127.0.0.1:4100` (Gateway → NestJS API → MariaDB/Redis) on identical tenant dataset (`benchmark_perf.js`):

| Metric | Before | After | Improvement |
|---|---|---|---|
| **500-Row `SerializeInterceptor` Roundtrip** | `265.75 ms` | **`4.92 ms`** | **`54.0x` faster (`-98.1%`)** |
| **Main JS Bundle Transfer (`Accept-Encoding: gzip`)** | `2,611,997 B` (`none`) | **`409,947 B`** (`gzip`, `immutable`, `ETag`) | **`6.37x` smaller (`-84.3%`)** |
| **Warm Gateway Asset Delivery / `304` Revalidation** | `18.67 ms` (no cache) | **`1.50 ms`** warm / **`1.07 ms`** (`304`) | **`12.4x` faster** |
| **`GET /` HTML Size (`gzip`)** | `2,312 B` | **`614 B`** | **`73.4%` smaller** |
| **`GET /api/accounts` (5-run warm avg)** | `76.83 ms` | **`41.45 ms`** (`min 22.02 ms`) | **`1.85x` faster (`-46.0%`)** |
| **`GET /api/items?page=1&page_size=200` (warm avg)** | `54.92 ms` | **`25.30 ms`** (`min 20.73 ms`) | **`2.17x` faster (`-53.9%`)** |
| **`GET /api/reports/profit-loss-sheet` (warm avg)** | `45.19 ms` | **`29.09 ms`** (`min 22.26 ms`) | **`1.55x` faster (`-35.6%`)** |
| **`GET /api/reports/balance-sheet` (warm avg)** | `67.97 ms` | **`34.47 ms`** (`min 31.25 ms`) | **`1.97x` faster (`-49.3%`)** |
| **`GET /api/reports/sales-by-items` (warm avg)** | `30.43 ms` | **`18.43 ms`** (`min 17.65 ms`) | **`1.65x` faster (`-39.4%`)** |
| **Dashboard 9-Request Parallel Burst (warm avg)** | `319.84 ms` | **`170.65 ms`** (`min 126.74 ms`) | **`1.87x` faster (`-46.6%`)** |
| **Chromium Fresh Dashboard Load (`global-setup.ts`)** | `14,917 ms` | **`5,175 ms`** | **`2.88x` faster (`-65.3%`)** |
| **Webapp Production Vite Build (`webapp build`)** | `186 s` (`3m 6s`) | **`71 s`** (`1m 11s`) | **`2.62x` faster (`-61.8%`)** |
