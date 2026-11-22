# Frontend Testing & Auditing Guide (Agent A)

## Scope
`packages/webapp/src` — React 18, Vite 5, TypeScript, BlueprintJS, React Router v5, Formik + Yup, `@tanstack/react-query`, Redux.

## Audit Checklist
1. **React Hooks & State**:
   - Ensure `QueryClient` is instantiated at module scope (`packages/webapp/src/components/App.tsx`), never inside render functions.
   - Verify `useEffect`, `useMemo`, and `useCallback` dependency arrays prevent infinite loops and stale closures.
2. **API Integration & Case Transformation**:
   - New query hooks must use `useApiFetcher({ enableCamelCaseTransform: true })`.
   - Direct `axios` calls must pass `Authorization: Bearer ${token}` and `'organization-id': organizationId` headers and wrap responses with `transformToCamelCase(res.data)`.
   - Always validate array payloads with `Array.isArray(...)` before `.map()` / `.filter()`.
3. **Modals, Fullscreen & Portals**:
   - BlueprintJS `<Dialog>` inside native fullscreen containers (`requestFullscreen()`) must set `portalContainer={isFullscreen && rootRef.current ? rootRef.current : undefined}` so the dialog is not hidden behind the browser top layer.
4. **Forms & Validation**:
   - Verify Formik `initialValues`, Yup schemas (`*.schema.tsx`), and submission error handling (`AppToaster`).
5. **Build & Verification Commands**:
   - Production build check: `pnpm --filter @borngreataccounting/webapp build`
   - Playwright E2E check: `pnpm run e2e:webapp`
