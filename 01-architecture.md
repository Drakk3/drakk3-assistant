# drakk3ai — Architecture

> **Document version:** 1.0
> **Status:** Base definition — pre-code
>
> ### Update policy
> This document may be updated once the codebase is running.
> **No changes may be applied without explicit confirmation from @drakk3 (David).**
> Proposed updates must be presented as a diff of the affected section,
> with a reason for the change. Update is only valid after verbal or written approval.

---

## Layer overview

```
┌─────────────────────────────────────┐
│         Client — Expo RN            │
│  Expo Router · Zustand · RQ · Maps  │
└──────────────┬──────────────────────┘
               │ HTTPS / REST + Realtime WS
┌──────────────▼──────────────────────┐
│         Backend — Supabase          │
│  Auth · PostgreSQL · Realtime       │
│  Edge Functions · RLS               │
└──────┬───────────────┬──────────────┘
       │               │
┌──────▼──────┐ ┌──────▼──────────────┐
│ Alexa ASK   │ │ Expo Notifications  │
│ voice alerts│ │ FCM · APNs          │
└─────────────┘ └─────────────────────┘
```

---

## Folder structure

```
src/
├── app/                        # Expo Router — screens only, no logic
│   ├── (auth)/
│   │   └── login.tsx
│   ├── (admin)/
│   │   ├── index.tsx           # Admin home / dashboard
│   │   ├── map.tsx             # Live map with users + zones
│   │   ├── zones.tsx           # Zone management
│   │   └── users.tsx           # User & group management
│   └── (user)/
│       └── index.tsx           # User home (passive view)
│
├── features/
│   ├── geofencing/
│   │   ├── components/         # ZoneCircle, UserMarker, ZoneCard
│   │   ├── hooks/
│   │   │   ├── useGeofencing.ts        # Main hook — starts background task
│   │   │   └── useZoneDetection.ts     # Haversine engine
│   │   ├── services/
│   │   │   ├── zoneEngine.ts           # Detection logic (pure functions)
│   │   │   └── alexaTrigger.ts         # Calls Edge Function
│   │   ├── store/
│   │   │   └── geofencingStore.ts      # Zustand slice
│   │   └── types.ts
│   │
│   └── [future-module]/        # Same pattern — replicate this structure
│
├── shared/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePermissions.ts
│   │   └── useGroups.ts
│   ├── lib/
│   │   ├── supabaseClient.ts   # Singleton — imported everywhere
│   │   └── haversine.ts        # Pure geo utility
│   └── types/
│       ├── database.ts         # Generated from Supabase schema
│       └── index.ts            # Re-exports
│
└── config/
    ├── themes.ts               # Accent tokens per theme
    ├── base.ts                 # Fixed tokens (bg, text, semantic)
    ├── constants.ts            # App-wide constants
    └── env.ts                  # Typed env variables
```

---

## Dependency rules

Features never import from each other. Violations break the architecture.

```
app/         → can import from: features/, shared/
features/X   → can import from: shared/ only
shared/      → can import from: config/ only
config/      → no imports (pure config)
```

If two features need the same thing → it moves to `shared/`.
If a screen needs logic → it lives in a feature hook, not in the screen file.

---

## Expo Router — route groups

| Group | Access | Guard |
|---|---|---|
| `(auth)` | Public | Redirect to `(admin)` or `(user)` if session exists |
| `(admin)` | Admin only | Redirect to `(auth)` if no session or role !== 'admin' |
| `(user)` | Authenticated users | Redirect to `(auth)` if no session |

Route protection lives in a shared `useAuthGuard` hook called at the layout level of each group.

---

## Supabase client — singleton pattern

```ts
// shared/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '../types/database';

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage:         AsyncStorage,
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl:false,
  },
});
```

Import `supabase` from this file everywhere. Never instantiate a second client.

---

## Edge Functions — when to use

Use Edge Functions for logic that must not run on the client:

| Use case | Where |
|---|---|
| Trigger Alexa notification | Edge Function |
| Send push notification to group | Edge Function |
| Validate zone entry server-side | Edge Function |
| Read/write DB directly | Client via Supabase SDK (RLS handles security) |
| Format display data | Client |

Edge Functions live in `supabase/functions/[name]/index.ts` outside `src/`.

---

## Background GPS task

`expo-task-manager` registers a background task that survives app minimization.
The task runs on every significant location change and calls `zoneEngine.ts`.

```ts
// Registered once at app startup
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) return;
  const { locations } = data as LocationTaskData;
  locations.forEach(loc => checkZones(loc.coords));
});
```

State change logic (enter/exit) is managed in `geofencingStore` to prevent
duplicate triggers while the user remains inside a zone.
