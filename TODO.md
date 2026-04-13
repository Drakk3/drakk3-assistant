# drakk3ai — TODO List

> Task states: `[ ]` pending · `[x]` done · `[-]` blocked · `[~]` in progress
>
> **Update policy:** same as architecture docs — no changes without @drakk3 (David) approval.

---

## Setup — Environment

> Goal: verify and prepare the local machine to run and preview an Expo React Native project.

### Node & package manager

- [ ] Verify Node.js is installed and is v18 or higher (`node --version`)
- [ ] Verify a package manager is available — npm, yarn, or bun (`npm --version` / `bun --version`)
- [ ] Decide which package manager to use for this project (recommendation: bun for speed)

### Expo CLI

- [ ] Verify `npx expo --version` works (no global install needed, uses npx)
- [ ] Install Expo CLI globally if preferred: `npm install -g expo-cli`
- [ ] Log in to Expo account: `npx expo login` (required for EAS builds later)

### Mobile preview — choose one path

**Path A — Physical device (simplest)**
- [ ] Install Expo Go on iOS device (App Store)
- [ ] Install Expo Go on Android device (Play Store)
- [ ] Verify device and dev machine are on the same WiFi network

**Path B — iOS Simulator (macOS only)**
- [ ] Verify Xcode is installed and up to date (`xcode-select --version`)
- [ ] Verify Xcode Command Line Tools are installed (`xcode-select -p`)
- [ ] Open Xcode at least once to accept license and finish component install
- [ ] Verify a simulator is available: open Xcode → Window → Devices and Simulators

**Path C — Android Emulator**
- [ ] Install Android Studio
- [ ] Install Android SDK via Android Studio SDK Manager (API level 33+)
- [ ] Set `ANDROID_HOME` environment variable
- [ ] Create an AVD (Android Virtual Device) via AVD Manager
- [ ] Verify emulator boots: `emulator -list-avds`

### Supabase CLI

- [ ] Install Supabase CLI: `brew install supabase/tap/supabase` (macOS) or check docs for Linux/Windows
- [ ] Verify install: `supabase --version`
- [ ] Log in to Supabase CLI: `supabase login`

### Git & GGA

- [ ] Verify git is configured with name and email (`git config --list`)
- [ ] Verify GGA (Gentleman Guardian Angel) pre-commit hook is active (`.gga` config already in repo)
- [ ] Confirm GGA Claude provider is accessible (API key in environment)

---

## Setup — Project Bootstrap

> Goal: initialize the Expo project and install all dependencies from the architecture doc.

### Init

- [ ] Initialize Expo project with TypeScript template inside this repo (or decide on separate repo)
- [ ] Confirm Expo Router is set as the navigation strategy at init time
- [ ] Verify the generated folder structure matches `01-architecture.md` before touching anything

### TypeScript config

- [ ] Set `strict: true` in `tsconfig.json`
- [ ] Set `noImplicitAny: true`
- [ ] Verify path aliases are configured for `src/` if needed

### Tooling config

- [ ] Configure ESLint (with TypeScript + React Native rules)
- [ ] Configure Prettier
- [ ] Verify both run without errors on an empty project

### Core dependencies

- [ ] `zustand` — global state
- [ ] `@tanstack/react-query` — server/cache layer
- [ ] `@supabase/supabase-js` — Supabase client
- [ ] `@react-native-async-storage/async-storage` — token + theme persistence
- [ ] `react-native-maps` — Google Maps (Android) / Apple Maps (iOS)
- [ ] `expo-location` — GPS tracking
- [ ] `expo-task-manager` — background GPS task
- [ ] `expo-haptics` — haptic feedback on zone events
- [ ] `expo-notifications` — push notifications (FCM + APNs)

### Environment variables

- [ ] Create `.env` file in project root (not committed)
- [ ] Add `EXPO_PUBLIC_SUPABASE_URL` from Supabase project settings
- [ ] Add `EXPO_PUBLIC_SUPABASE_ANON_KEY` from Supabase project settings
- [ ] Add `.env` to `.gitignore`

---

## Setup — Supabase Project

> Goal: create and configure the Supabase project so the DB is ready before writing any client code.

### Project creation

- [ ] Create new Supabase project at supabase.com (or via CLI)
- [ ] Note project URL and anon key → go into `.env`
- [ ] Enable the project region closest to the user's location

### Database schema

- [ ] Run table creation SQL from `02-data-model.md` in correct order (1 → 8)
- [ ] Run all index creation statements from `02-data-model.md`
- [ ] Run all RLS `enable` statements
- [ ] Run all RLS policy statements
- [ ] Run seed: `insert into public.modules` for the geofencing module
- [ ] Verify all 8 tables exist in Supabase Table Editor

### Auth config

- [ ] Enable Email/Password auth in Supabase Auth settings
- [ ] Disable public signups (admin-only access for now)
- [ ] Create admin user manually via Supabase Auth dashboard
- [ ] Insert corresponding row in `profiles` for the admin user (role: 'admin')

### Type generation (optional at this stage)

- [ ] Decide: manual types (already written in `02-data-model.md`) vs Supabase CLI auto-generation
- [ ] If CLI: `supabase gen types typescript --project-id <id> > src/shared/types/database.ts`

---

## Setup — First Boot

> Goal: the app runs, shows something on screen, and connects to Supabase.

- [ ] Run `npx expo start` — verify QR code or simulator launches
- [ ] Verify app boots without TypeScript errors
- [ ] Verify ESLint passes on the initial project
- [ ] Verify Supabase client initializes without errors (check console for auth session)
- [ ] Verify theme loads from AsyncStorage (or defaults to 'green')

---

## Backlog

> Features and tasks to plan and prioritize after setup is complete. No order implied.

### Auth module
- [ ] Login screen (`app/(auth)/login.tsx`) with email + password
- [ ] `useAuth` hook — wraps Supabase session
- [ ] `useAuthGuard` hook — route protection for each group
- [ ] Redirect logic per route group based on role

### Config layer
- [ ] `config/base.ts` — base tokens
- [ ] `config/themes.ts` — green + violet accent tokens + `buildTheme()`
- [ ] `config/typography.ts` — type scale
- [ ] `config/motion.ts` — duration + easing
- [ ] `config/constants.ts` — `LOCATION_TASK_NAME` and other constants
- [ ] `config/env.ts` — typed env variable access

### Shared components
- [ ] `Button` (primary / ghost / muted variants)
- [ ] `Badge` (active / away / offline / unknown)
- [ ] `Card`
- [ ] `Input` (with label + focus state)

### Shared hooks & lib
- [ ] `useTheme` hook + `ThemeProvider` context
- [ ] `supabaseClient.ts` singleton
- [ ] `haversine.ts` pure geo utility
- [ ] `errors.ts` — `AppError` class + `handleError()`
- [ ] `usePermissions` hook
- [ ] `useGroups` hook

### Geofencing module — data layer
- [ ] `features/geofencing/types.ts` — `Coords`, `ZoneState`
- [ ] `features/geofencing/services/zoneEngine.ts` — `isInsideZone`, `detectEntry` (pure)
- [ ] `features/geofencing/store/geofencingStore.ts` — Zustand slice
- [ ] `features/geofencing/hooks/useZoneDetection.ts`
- [ ] `features/geofencing/hooks/useGeofencing.ts` — background task registration

### Geofencing module — UI
- [ ] `ZoneCircle` — MapView `<Circle>` wrapper
- [ ] `UserMarker` — marker per active user on map
- [ ] `ZoneCard` — zone list item for admin
- [ ] Admin map screen (`app/(admin)/map.tsx`)
- [ ] Admin zone management screen (`app/(admin)/zones.tsx`)
- [ ] Admin user management screen (`app/(admin)/users.tsx`)
- [ ] User passive home screen (`app/(user)/index.tsx`)

### Supabase Edge Functions
- [ ] `supabase/functions/alexa-trigger/index.ts` — fires Alexa notification on zone entry
- [ ] `supabase/functions/push-notify/index.ts` — sends push notification to group members
- [ ] DB webhook/trigger: `location_events` insert → `alexa-trigger` Edge Function

### Alexa integration
- [ ] Create Alexa Skill via Alexa Developer Console
- [ ] Configure Alexa Notifications API credentials
- [ ] Wire `alexa_device_id` to the skill endpoint
- [ ] Test end-to-end: zone entry → Edge Function → Alexa speaks

### Push notifications
- [ ] Configure FCM (Firebase) for Android
- [ ] Configure APNs for iOS via Expo EAS
- [ ] `expo-notifications` setup in the app
- [ ] Test push on physical device

### Admin dashboard
- [ ] Admin home/dashboard screen (`app/(admin)/index.tsx`)
- [ ] Group creation and user assignment flow
- [ ] `user_permissions` grant flow per module per user

### Observability & polish
- [ ] `location_events` history view for admin
- [ ] Error boundary at root layout
- [ ] Loading states and skeleton screens
- [ ] Theme switcher UI (green ↔ violet)
- [ ] Supabase Realtime: live user positions on admin map
