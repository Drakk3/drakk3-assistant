# Master App — Project Context

## Overview

`drakk3-assistant` is an Expo React Native app with a Supabase backend.

The frozen MVP is intentionally narrow:
- admin authentication
- admin-managed circle zones
- background location-based `enter` / `exit` detection
- persisted `location_events`
- Alexa integration through a mockable backend contract

This repository is currently planning-complete for that MVP and ready to start implementation from `TKT-010`.

---

## Canonical decisions

### Scope
- admin-first only
- no general-user experience in MVP
- no groups, granular permissions, realtime presence, or extra modules in MVP

### Geofencing architecture
- client performs candidate detection
- backend validates and persists accepted transitions
- Haversine is the only geometry model for MVP
- circle zones only; no polygons and no Turf.js in MVP

### Backend ownership
- `location_events` and `zone_presence_state` are backend-owned runtime records
- Alexa dispatch happens behind an Edge Function boundary

---

## MVP entities

- `profiles`
- `zones`
- `alexa_triggers`
- `zone_presence_state`
- `location_events`

Deferred entities:
- `groups`
- `group_members`
- `user_permissions`
- `modules`

---

## Codebase shape planned for implementation

```text
src/
├── app/
│   ├── (auth)/
│   └── (admin)/
├── features/
│   └── geofencing/
├── shared/
└── config/
```

Golden rule: features never import from other features.

---

## Primary references

- `01-architecture.md`
- `02-data-model.md`
- `03-design-system.md`
- `05-technical-backlog.md`
- `06-mvp-scope.md`
- `07-geofencing-runtime.md`
- `08-backend-foundation.md`
- `09-execution-plan.md`
