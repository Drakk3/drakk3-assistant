# drakk3-assistant — MVP validation checklist

## Repo validation executed for TKT-018

- [x] `npm run test`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] Automated evidence for `TKT-010` through `src/config/envUtils.test.ts`, `src/shared/providers/appProvidersConfig.test.ts`, and `src/shared/hooks/authGuardUtils.test.ts` covering environment fallback/bootstrap, shared query-client defaults, and route-guard decisions
- [x] Automated evidence for `TKT-011` through `src/shared/hooks/authGuardUtils.test.ts` and `src/shared/screens/loginScreenUtils.test.ts` covering guest/protected redirects plus auth-shell login gating when Supabase config is missing or present
- [x] Automated evidence for `TKT-012` through `src/shared/components/primitives.test.ts` covering token-driven button, badge, and input primitive state resolution without fragile renderer-only assertions
- [x] Automated evidence for `TKT-014` through `src/features/geofencing/hooks/useGeofencing.utils.test.ts` and `src/features/geofencing/hooks/useZoneDetection.utils.test.ts` covering runtime payload validation, presence-state mapping, status labels, and backend-result-to-membership transitions
- [x] Automated evidence for `TKT-013` to `TKT-017` through Vitest coverage on zone evaluation, transition processing, fallback admin CRUD, and operational visibility mapping
- [x] Automated smoke coverage for the Edge Function contract through `src/features/geofencing/services/processZoneTransitionEdge.test.ts`, validating env parsing, bearer-token parsing, payload shape checks, and provider dispatch resolution without live Supabase infrastructure
- [x] Manual code-path review for admin zone CRUD, event visibility, and fallback transition persistence

## Manual runtime checklist

### Admin zone flow
- [ ] Login with a valid admin user when Supabase envs are available
- [ ] Open `/(admin)/zones`
- [ ] Create a zone with coordinates, radius, buffers, and trigger config
- [ ] Edit the same zone and confirm values persist
- [ ] Activate/deactivate a zone and confirm badge/state changes

### Transition and visibility flow
- [ ] Open `/(admin)` dashboard
- [ ] Use `Simulate enter` on the runtime card
- [ ] Confirm `transitionApi` returns an accepted or duplicate result without direct `location_events` inserts from UI code
- [ ] Open `/(admin)/events`
- [ ] Confirm the accepted transition appears in history
- [ ] Confirm operational state updates `inside/outside` and dispatch status

### Supabase-backed verification
- [ ] If envs exist, verify zones come from `zones` + `alexa_triggers`
- [x] Edge Function `supabase/functions/process-zone-transition/index.ts` exists and reuses the canonical transition decision core before persistence
- [x] Edge Function wrapper logic is locally smoke-tested for env/auth/payload/dispatch branches without requiring a deployed function
- [ ] If envs exist, verify accepted transitions are persisted by `process-zone-transition`
- [ ] Confirm `location_events` remains backend-owned and client code only calls the wrapper

## Notes

- Without Supabase envs, the repo now degrades to an explicit typed fallback runtime seeded through `src/features/geofencing/services/fallbackRuntime.ts` and consumed by `src/features/geofencing/services/geofencingApi.ts`.
- The fallback path is ONLY for UI continuity and local validation. Canonical persisted runtime ownership remains backend-first.
- `TKT-010`, `TKT-011`, `TKT-012`, and `TKT-014` now have executable local evidence in-repo; what remains open for those areas is runtime confirmation on a real Expo/Supabase stack, not missing repository-level test coverage.
- The Edge Function is structurally complete, reuses the canonical transition core, and now has a local smoke harness for its env/auth/dispatch branches; live persistence, JWT auth, and deployed function execution still require a configured Supabase project.
- Remaining unchecked items in this document are STRICTLY infrastructure-bound: real Supabase credentials, real auth users/profile provisioning, deployed Edge Function execution, and real client/runtime permission flows on device or emulator.
