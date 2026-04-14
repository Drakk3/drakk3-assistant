# drakk3-assistant — Architecture

> **Version:** 2.0  
> **Status:** Canonical MVP architecture

---

## 1. Architectural intent

Build the smallest architecture that can ship the geofencing MVP without painting the project into a corner.

The MVP is **admin-first**:
- one authenticated admin experience
- admin-owned zone CRUD
- background location detection on the running device
- persisted enter/exit events
- backend-controlled Alexa/mock dispatch

Future multi-user tracking exists as an extension path, not as current scope.

---

## 2. Canonical system view

```text
┌─────────────────────────────────────────────┐
│ Client — Expo React Native                 │
│ Expo Router · Zustand · React Query        │
│ expo-location · expo-task-manager          │
└───────────────────┬─────────────────────────┘
                    │ authenticated HTTPS
┌───────────────────▼─────────────────────────┐
│ Supabase                                   │
│ Auth · Postgres · RLS · Edge Functions     │
└──────────────┬─────────────────────┬────────┘
               │                     │
       ┌───────▼────────┐   ┌────────▼─────────┐
       │ location_events │   │ Alexa provider   │
       │ presence state  │   │ or mock adapter  │
       └────────────────┘   └──────────────────┘
```

---

## 3. Layer responsibilities

### Client
- authenticate the admin
- fetch active zones
- receive foreground/background GPS updates
- run **candidate** circle detection with Haversine
- keep transient local state required for background execution
- submit candidate transitions to the backend contract
- render admin UI and event history

### Edge Function
- re-validate every candidate transition
- apply hysteresis and deduplication rules
- update `zone_presence_state`
- persist `location_events`
- dispatch Alexa or mock integration
- return deterministic result to the client

### Database
- store canonical zone definitions
- store profile and zone ownership
- store event history and latest zone membership state
- enforce admin-first access through RLS

---

## 4. Canonical geofencing decision

This was the main contradiction in the previous docs. The decision is now CLOSED.

### Chosen model: hybrid detection with one geometry model

- **Client** performs candidate transition detection.
- **Server** validates and persists the final transition.
- **Distance engine for MVP:** Haversine for both client and server.
- **Zone shape for MVP:** circle only (`lat`, `lng`, `radius_meters`).
- **Turf.js is deferred** until polygon or GeoJSON requirements exist.

### Why this choice

#### Benefits
- one geometry model end-to-end
- no client/server disagreement from mixed math libraries
- simpler to test and reason about
- fast enough for circle zones in MVP

#### Tradeoff
- less future-ready than a full Turf.js geospatial stack
- acceptable because polygons are explicitly out of scope

---

## 5. Source of truth

The source of truth is split intentionally:

- `zones` = source of truth for zone definitions
- `zone_presence_state` = source of truth for the latest inside/outside status per user+zone
- `location_events` = immutable history of accepted transitions

The client is **never** the final authority for a persisted enter/exit event.

---

## 6. Runtime flow

```text
GPS update
  → client loads active zones
  → client calculates distance with Haversine
  → client detects candidate enter/exit
  → client calls process-zone-transition Edge Function
  → server re-checks distance and hysteresis window
  → server checks zone_presence_state + idempotency
  → server writes location_events if accepted
  → server updates zone_presence_state
  → server dispatches Alexa or mock provider
  → client receives accepted / ignored / rejected result
```

Detailed runtime rules live in `07-geofencing-runtime.md`.

---

## 7. Folder structure for MVP

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login.tsx
│   └── (admin)/
│       ├── index.tsx
│       ├── zones.tsx
│       └── events.tsx
│
├── features/
│   └── geofencing/
│       ├── components/
│       ├── hooks/
│       │   ├── useGeofencing.ts
│       │   └── useZoneDetection.ts
│       ├── services/
│       │   ├── zoneEngine.ts
│       │   └── transitionApi.ts
│       ├── store/
│       │   └── geofencingStore.ts
│       └── types.ts
│
├── shared/
│   ├── components/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useAuthGuard.ts
│   ├── lib/
│   │   ├── errors.ts
│   │   ├── haversine.ts
│   │   └── supabaseClient.ts
│   └── types/
│       └── database.ts
│
└── config/
    ├── base.ts
    ├── constants.ts
    ├── env.ts
    ├── themes.ts
    └── typography.ts
```

Deferred from MVP:
- `(user)` route group
- group-aware admin map
- feature modules beyond geofencing
- permission management screens

---

## 8. Dependency rules

```text
app/       → features/, shared/
features/  → shared/
shared/    → config/
config/    → no internal imports
```

Additional architectural rules:
- screens contain composition only, not business logic
- stores hold state only; no API calls inside store actions
- services are pure or clearly named integration wrappers
- Edge Functions own server-side side effects

---

## 9. Security boundary

### Direct from client
- auth/session operations
- zone CRUD through Supabase client under RLS
- read event history under RLS

### Through Edge Function only
- candidate transition processing
- event creation
- presence-state mutation
- Alexa/mock dispatch

This boundary keeps the noisy, stateful geofencing workflow off the screen layer and out of direct table writes.

---

## 10. Non-goals for this version

The following are intentionally NOT part of the MVP architecture:
- multi-user passive tracking
- groups and membership distribution
- Turf.js and polygon geofencing
- realtime map presence
- push-notification fanout
- generic module registry behavior
