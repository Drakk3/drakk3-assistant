# Master App — Project Base Context

## Overview

Personal cross-platform app (Expo React Native) that works as an extensible master platform. Starts with a geofencing module that notifies Alexa when a user enters a proximity zone. The architecture is designed so new modules and features can be added without structural refactors.

---

## Tech Stack

### Client
- **Framework:** Expo React Native (with Expo Router for navigation)
- **Global state:** Zustand (slices per feature)
- **Server/cache:** React Query
- **Maps:** react-native-maps (Google Maps on Android, Apple Maps on iOS)
- **GPS / background tracking:** expo-location + expo-task-manager
- **Language:** Strict TypeScript

### Backend
- **BaaS:** Supabase
  - Auth with JWT and Row Level Security (RLS)
  - PostgreSQL as main database
  - Edge Functions for server logic (webhooks, triggers, Alexa)
  - Realtime for live user positions

### External Services
- **Alexa:** Alexa Skills Kit (ASK) — voice notifications per zone
- **Geospatial:** Turf.js (runs in Edge Functions for proximity calculations)
- **Push notifications:** Expo Notifications (FCM + APNs)

### Tooling
- TypeScript, ESLint, Prettier
- GitHub + Expo EAS for builds and deploys

---

## Folder Structure (feature-first)

```
src/
├── app/                        ← Expo Router (screens)
│   ├── (auth)/                 ← Login, splash
│   ├── (admin)/                ← Admin-only screens
│   └── (user)/                 ← General user screens
│
├── features/
│   ├── geofencing/             ← Module 1 (active)
│   │   ├── components/
│   │   ├── hooks/              ← useGeofencing, useZoneDetection
│   │   ├── services/           ← zoneEngine.ts, alexaTrigger.ts
│   │   ├── store/              ← Zustand slice
│   │   └── types.ts
│   └── [future-module]/        ← Pattern to replicate
│
├── shared/
│   ├── components/             ← Button, Card, Avatar, MapView
│   ├── hooks/                  ← useAuth, usePermissions, useGroups
│   ├── lib/                    ← supabaseClient.ts, turf.ts
│   └── types/                  ← User, Zone, Group, Permission
│
└── config/                     ← env, constants, theme
```

**Golden rule:** features never import from each other. Anything shared moves up to `shared/`.

---

## Database Entities and Tables

### `profiles`
Extends Supabase's `auth.users`. Does not replace the native auth table.

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | same id as auth.users |
| display_name | text | visible name |
| role | text | `'admin'` or `'user'` |
| avatar_url | text | optional |
| is_active | boolean | |
| created_at | timestamptz | |

### `groups`
Groups users together to share information among them. Only users within the same group receive notifications about each other.

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | group name |
| description | text | optional |
| created_by | uuid FK → profiles | always the admin |
| created_at | timestamptz | |

### `group_members`
Pivot table users ↔ groups.

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| group_id | uuid FK → groups | |
| user_id | uuid FK → profiles | |
| joined_at | timestamptz | |

### `user_permissions`
Granular permissions per module. Allows scaling without modifying `profiles`.

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles | |
| module_key | text | e.g. `'geofencing'` |
| can_view | boolean | |
| can_interact | boolean | |
| granted_at | timestamptz | |

### `zones`
Proximity zones defined by a center coordinate + radius in meters.

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "Home", "Work" |
| latitude | float | center coordinate |
| longitude | float | center coordinate |
| radius_meters | integer | zone radius |
| is_active | boolean | |
| group_id | uuid FK → groups | zone belongs to a group |
| created_by | uuid FK → profiles | |
| created_at | timestamptz | |

> **Design note:** no complex polygons. One zone = one coordinate + one radius. The circle is drawn automatically on the map. Detection algorithm uses Haversine distance: if `distance(user, center) ≤ radius_meters` → user is inside the zone.

### `alexa_triggers`
Alexa message configuration per zone. Each zone has its own.

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| zone_id | uuid FK → zones | one-to-one |
| message_template | text | e.g. `"{name} is arriving home"` |
| alexa_device_id | text | target device |
| is_active | boolean | |

### `location_events`
Log of every time a user enters or exits a zone. Source of truth for triggers and notifications.

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles | |
| zone_id | uuid FK → zones | |
| event_type | text | `'enter'` or `'exit'` |
| latitude | float | exact position at moment of event |
| longitude | float | exact position at moment of event |
| distance_meters | integer | distance to zone center |
| triggered_at | timestamptz | |

### `modules`
Registry of available modules in the app. Admin can enable/disable.

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| key | text unique | e.g. `'geofencing'` |
| name | text | human-readable name |
| is_enabled | boolean | |
| config | jsonb | module-specific configuration |

---

## Defined User Flows

### App Access
- For now only the admin has access
- Auth architecture is ready to manually invite users in the future
- Login: email + password via Supabase Auth

### General User (when they exist)
- Passively tracked in the background (sees nothing actively)
- Receives push notifications when **another user in their group** enters or exits a zone
- No access to the admin map or zone configuration
- Only sees what the admin allows via `user_permissions`

### Groups
- Admin creates groups and assigns users
- Zones belong to a group
- Notifications (push + Alexa) only fire for members of the same group

### Zone Creation (admin only)
- Admin inputs: name, coordinate (lat/lng), radius in meters, and Alexa message
- Zone is automatically drawn as a circle on the map
- No manual polygon drawing

### Zone Detection Engine
- `expo-task-manager` runs a background task that receives GPS position periodically
- For each position update, runs Haversine against all active zones in the user's group
- If `distance ≤ radius_meters` AND previous state was "outside" → fires `enter` event
- If `distance > radius_meters` AND previous state was "inside" → fires `exit` event
- Event is saved to `location_events` and triggers the corresponding Edge Function

### Alexa Trigger on Zone Entry
1. User enters zone → `location_events` receives record with `event_type: 'enter'`
2. Supabase Edge Function listens to the insert via webhook/trigger
3. Edge Function looks up the `alexa_trigger` for that zone
4. Replaces `{name}` in `message_template` with the user's display name
5. Calls the Alexa Notifications API with the final message
6. Alexa announces on the configured device

---

## Geofencing Module Permissions

| Permission (`module_key: 'geofencing'`) | Admin | General User |
|---|---|---|
| View map with all users | ✓ | ✗ |
| Be tracked | ✓ | ✓ |
| Receive zone push notifications | ✓ | ✓ (if in group) |
| Create / edit zones | ✓ | ✗ |
| View location_events history | ✓ | ✗ |

---

## Code Methodology

**Feature-first with shared domain.**

- Each module lives in `features/[name]/` with everything it needs (components, hooks, services, store, types)
- Code shared across modules lives in `shared/`
- Features never import from each other directly
- When a new module is added, its folder is created under `features/` without touching anything else

**Applied principles:**
- Clean Code: descriptive names, small functions with a single responsibility
- Strict TypeScript: no `any`, interfaces defined in each feature's `types.ts`
- Separation of concerns: UI in components, logic in hooks/services, state in store
