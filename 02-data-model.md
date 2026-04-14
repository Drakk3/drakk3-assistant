# drakk3-assistant — Data Model

> **Version:** 2.0  
> **Status:** Final MVP schema definition

---

## 1. MVP schema decision

The previous docs mixed MVP entities with future platform entities.

That is now closed.

### In MVP
- `profiles`
- `zones`
- `alexa_triggers`
- `zone_presence_state`
- `location_events`

### Deferred from MVP
- `groups`
- `group_members`
- `user_permissions`
- `modules`

### Why
- the frozen MVP is admin-first and single-operator
- deferred tables add coordination cost without helping `TKT-010`
- they can be introduced later without breaking the chosen MVP contracts

---

## 2. Table creation order

1. `profiles`
2. `zones`
3. `alexa_triggers`
4. `zone_presence_state`
5. `location_events`

---

## 3. Canonical SQL schema

```sql
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'admin' check (role in ('admin')),
  theme_preference text not null default 'green' check (theme_preference in ('green', 'violet')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null check (radius_meters between 20 and 5000),
  enter_buffer_meters integer not null default 15 check (enter_buffer_meters between 0 and 100),
  exit_buffer_meters integer not null default 15 check (exit_buffer_meters between 0 and 100),
  is_active boolean not null default true,
  alexa_enabled boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.alexa_triggers (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null unique references public.zones(id) on delete cascade,
  provider text not null default 'mock' check (provider in ('mock', 'alexa')),
  message_template text not null,
  target_device text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.zone_presence_state (
  user_id uuid not null references public.profiles(id) on delete cascade,
  zone_id uuid not null references public.zones(id) on delete cascade,
  current_state text not null check (current_state in ('inside', 'outside')),
  last_event_type text check (last_event_type in ('enter', 'exit')),
  last_event_at timestamptz,
  last_distance_meters integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, zone_id)
);

create table public.location_events (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  zone_id uuid not null references public.zones(id) on delete cascade,
  event_type text not null check (event_type in ('enter', 'exit')),
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters integer,
  distance_meters integer not null,
  event_source text not null check (event_source in ('foreground', 'background', 'manual-test')),
  dispatch_status text not null default 'pending' check (dispatch_status in ('pending', 'mocked', 'sent', 'failed', 'skipped')),
  dispatch_error text,
  triggered_at timestamptz not null default now(),
  processed_at timestamptz not null default now()
);
```

---

## 4. Entity rationale

### `profiles`
- mirrors `auth.users`
- holds display name and theme preference
- MVP keeps a single role: `admin`

### `zones`
- stores only circle zones
- per-zone enter/exit buffers make hysteresis explicit and testable
- `alexa_enabled` allows disabling dispatch without deleting configuration

### `alexa_triggers`
- stable integration contract per zone
- `provider` supports `mock` first without changing the app contract

### `zone_presence_state`
- latest accepted inside/outside state per user+zone
- required for server-side dedupe and anti-flapping
- not a historical log

### `location_events`
- immutable accepted transitions only
- `client_event_id` makes retries idempotent
- dispatch fields support operational visibility in the admin UI

---

## 5. Indexes

```sql
create index idx_zones_active on public.zones(is_active);
create index idx_location_events_user_time on public.location_events(user_id, triggered_at desc);
create index idx_location_events_zone_time on public.location_events(zone_id, triggered_at desc);
create index idx_location_events_dispatch_status on public.location_events(dispatch_status, triggered_at desc);
create index idx_zone_presence_state_state on public.zone_presence_state(current_state, updated_at desc);
```

---

## 6. RLS strategy

The MVP is admin-first, but the geofencing pipeline still needs a clear rule set.

### Principle
- interactive table access happens as authenticated admin
- transition processing and integration side effects happen through Edge Functions using server-side privileges
- no temporary open-access table policies

### Policy matrix

| Table | Admin select | Admin insert | Admin update | Admin delete | Service role / Edge Function |
|---|---:|---:|---:|---:|---:|
| `profiles` | yes (own row) | no direct | limited own update | no | bootstrap/provisioning |
| `zones` | yes | yes | yes | yes | yes |
| `alexa_triggers` | yes | yes | yes | yes | yes |
| `zone_presence_state` | yes | no direct | no direct | no direct | full control |
| `location_events` | yes | no direct | no direct | no direct | full control |

### Canonical SQL policies

```sql
alter table public.profiles enable row level security;
alter table public.zones enable row level security;
alter table public.alexa_triggers enable row level security;
alter table public.zone_presence_state enable row level security;
alter table public.location_events enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_update_own_safe_fields"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "zones_admin_all"
  on public.zones
  for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_active = true
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_active = true
  ));

create policy "alexa_triggers_admin_all"
  on public.alexa_triggers
  for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_active = true
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_active = true
  ));

create policy "zone_presence_state_admin_read"
  on public.zone_presence_state
  for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_active = true
  ));

create policy "location_events_admin_read"
  on public.location_events
  for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_active = true
  ));
```

### Important note

`zone_presence_state` and `location_events` are not directly inserted from the client in the MVP. They are written by the transition-processing backend path.

---

## 7. Profile provisioning

`profiles` must be created automatically from `auth.users`.

### Chosen strategy
- create the first admin user manually in Supabase Auth during environment bootstrap
- attach a database trigger that inserts the matching `profiles` row on signup
- default role remains `admin` for MVP because there is no general-user flow yet

### Tradeoff
- not scalable for production multi-user onboarding
- correct for MVP because it removes ambiguity and avoids temporary manual SQL patches later

---

## 8. TypeScript contract baseline

`shared/types/database.ts` should be generated from Supabase schema after migrations are defined.

Domain-level aliases can wrap generated types, but the generated file is the base contract.

Recommended generated entities:
- `Profile`
- `Zone`
- `AlexaTrigger`
- `ZonePresenceState`
- `LocationEvent`

---

## 9. Deferred schema evolution

The following are intentionally postponed:
- groups and membership tables
- granular permissions
- module registry
- polygon geofencing columns
- provider-specific Alexa delivery metadata beyond `dispatch_status` and `dispatch_error`
