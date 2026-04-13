# drakk3ai — Code Review Rules

These rules apply to all `.ts`, `.tsx`, `.js`, `.jsx` files.
Review every changed file against ALL sections below. Flag violations as BLOCK or WARN.

---

## Architecture

- **BLOCK** — feature imports from another feature (`features/A` importing from `features/B`)
- **BLOCK** — screen file (`app/`) contains business logic (supabase calls, state mutations, derived calculations) — logic belongs in hooks
- **BLOCK** — `shared/` imports from `features/`
- **BLOCK** — `config/` imports from anywhere except Node built-ins
- **WARN** — component file contains more than one exported component

---

## TypeScript

- **BLOCK** — use of `any` type anywhere
- **BLOCK** — type assertion (`as SomeType`) without a preceding type guard or validation
- **BLOCK** — function parameter or return type is missing
- **BLOCK** — `// @ts-ignore` or `// @ts-expect-error` without an explicit reason comment
- **WARN** — `type` used for object shapes (prefer `interface`)
- **WARN** — `interface` used for unions or utility types (prefer `type`)
- **WARN** — barrel `index.ts` that re-exports everything from a directory

---

## Naming

- **BLOCK** — component file not in PascalCase (e.g. `zoneCard.tsx`)
- **BLOCK** — hook file does not start with `use` (e.g. `geofencing.ts` instead of `useGeofencing.ts`)
- **BLOCK** — store file does not end with `Store` (e.g. `geofencing.ts` instead of `geofencingStore.ts`)
- **WARN** — boolean variable without `is` / `has` / `can` prefix
- **WARN** — event handler without `handle` prefix (e.g. `zoneEnter` instead of `handleZoneEnter`)
- **WARN** — constant not in `SCREAMING_SNAKE_CASE`
- **WARN** — interface or type prefixed with `I` (e.g. `IZone`)

---

## Components

- **BLOCK** — direct `supabase` call inside a component — all DB access goes through hooks/services
- **BLOCK** — `async` function directly in an event handler — extract to hook
- **BLOCK** — hardcoded color hex value in a component style — use theme tokens or `base` constants
- **BLOCK** — default export for a component — named exports only
- **WARN** — `console.log` left in component code
- **WARN** — `StyleSheet.create` with hardcoded color values

---

## Hooks

- **BLOCK** — hook returns an array instead of an object (e.g. `return [value, setter]`)
- **BLOCK** — direct `supabase` call outside of a try/catch block
- **WARN** — missing `useCallback` on a function passed as a dependency or prop
- **WARN** — missing `useMemo` on an expensive derived value with array/object deps

---

## Services

- **BLOCK** — service file imports React or any React hook
- **BLOCK** — service function has side effects (state mutation, external call) without being clearly named for it
- **WARN** — service function is not a pure function and is not documented as impure

---

## Stores (Zustand)

- **BLOCK** — store action contains side effects (API calls, subscriptions) — side effects belong in hooks
- **WARN** — state mutation done outside of a store action
- **WARN** — store action name is not a verb

---

## Error handling

- **BLOCK** — `async` function without `try/catch`
- **BLOCK** — `.catch()` chained on a promise — use `try/catch` instead
- **WARN** — caught error is silently swallowed (empty catch block)
- **WARN** — error not passed to `handleError()` from `shared/lib/errors`

---

## Design system

- **WARN** — hardcoded shadow (`shadowColor`, `shadowOffset`, `elevation`) anywhere in styles
- **WARN** — `textAlign: 'center'` in any component style
- **WARN** — `borderRadius` value above 14 (except `radiusPill: 999`)
- **WARN** — `borderWidth` value other than `0.5` or `1` (focus state only)
- **WARN** — gradient used anywhere (`LinearGradient` import or similar)
