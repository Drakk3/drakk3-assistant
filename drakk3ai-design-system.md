# drakk3ai — Design System

## Creative north star: "The Silent Operator"

This system rejects consumer-grade interfaces. It is a precision tool — inspired by the focused utility of a command-line interface, refined through high-end editorial restraint. It should feel less like an "app" and more like a bespoke technical instrument built by one person, for one person.

**Core tension:** hacker discipline meets premium restraint.

---

## Color palette

### Base surfaces (elevation through bg layers — no shadows ever)

| Token | Hex | Role |
|---|---|---|
| `base` | `#0a0a0a` | Global background. Never used for interactive elements |
| `surface` | `#111111` | Primary canvas for content |
| `elevated` | `#161616` | Secondary modules, nested views, hover rows |
| `border-default` | `#1e1e1e` | Hairline separators (0.5px only) |
| `border-emphasis` | `#2a2a2a` | High-density data tables, input fields |

### Accent — themeable (one variable swap changes everything)

**Theme: green** (default — "Tactical Minimalist")

| Token | Hex |
|---|---|
| `accent` | `#1db954` |
| `accent-hover` | `#17a349` |
| `accent-bg` | `#0d2818` |
| `accent-border` | `#1e3a2e` |

**Theme: violet** ("Obsidian Logic")

| Token | Hex |
|---|---|
| `accent` | `#ba9eff` |
| `accent-hover` | `#8455ef` |
| `accent-bg` | `#1a0d33` |
| `accent-border` | `#2e1a5e` |

> Theme preference is stored in `profiles.theme_preference` in Supabase and cached locally with AsyncStorage. Adding a new theme = adding one entry to the themes config object. No component changes required.

### Text

| Token | Hex | Role |
|---|---|---|
| `text-primary` | `#e2e2e2` | Main content |
| `text-secondary` | `#888888` | Supporting info |
| `text-muted` | `#444444` | Labels, metadata |

### Semantic (fixed — not themeable)

| Token | Hex |
|---|---|
| `danger` | `#e05c5c` |
| `warning` | `#f0a500` |

---

## Zero-shadow hierarchy

Elevation is strictly achieved via background color shifts — never shadows or gradients.

- A `#161616` card sits on a `#111111` surface, which sits on the `#0a0a0a` base
- **No-line rule:** prohibit borders for structural sectioning. Use background shifts to define zones
- **Exception:** use `0.5px border-default` (`#1e1e1e`) only when content density requires a hard visual break
- The accent color against base black creates perceived luminance — this is the only "glow" allowed

---

## Typography

Single font family: **SF Mono** — `SF Mono`, `Fira Code`, `JetBrains Mono` as fallback chain.

| Role | Size | Weight | Tracking | Case |
|---|---|---|---|---|
| Display | 28px | 700 | -0.02em | — |
| Heading | 18px | 600 | -0.01em | Sentence |
| Body | 13px | 400 | 0.01em | — |
| Label | 10px | 500 | 0.14em | UPPERCASE |
| Code / system | 11px | 400 | 0.06em | — |

**Rules:**
- Never center-align. Everything is flush-left — "ragged right" like a terminal
- Use weight variation (400→700) to create hierarchy, never font family changes
- Label every numerical value with a unit: `MS`, `M`, `KM`, `REV`

---

## Design tokens

| Token | Value |
|---|---|
| `radius-sm` | 6px |
| `radius-md` | 10px |
| `radius-lg` | 14px |
| `radius-pill` | 999px |
| `border-width` | 0.5px (only ever 0.5px — anything thicker feels clunky) |
| `border-focus` | 1px accent color |
| Spacing scale | 4 · 8 · 12 · 16 · 24 · 32 · 48px |
| Shadows | none |

---

## Components

### Buttons

**Primary**
- Background: `accent`
- Text: `#0a0a0a` · weight 700
- Radius: 7px · padding: 9px 18px · font-size: 11px · uppercase · tracking 0.06em

**Ghost**
- Background: transparent
- Text: `accent`
- Border: `0.5px solid accent`
- Radius: 7px

**Muted**
- Background: `#161616`
- Text: `#555`
- Border: `0.5px solid #222`
- Radius: 7px

### Status badges

| State | Background | Text | Border |
|---|---|---|---|
| Active | `accent-bg` | `accent` | `accent-border` |
| Away | `#1a1200` | `#f0a500` | `#3a2e00` |
| Offline | `#1a0808` | `#e05c5c` | `#3a1212` |
| Unknown | `#111` | `#444` | `#1e1e1e` |

Style: `font-size: 9px · font-weight: 700 · letter-spacing: 0.08em · uppercase · border-radius: 4px · padding: 3px 9px`

### Input fields

- Background: `#0f0f0f`
- Border default: `0.5px solid #2a2a2a`
- Border focus: `0.5px solid accent` (no outer glow)
- Text: `#cccccc` · Placeholder: `#444`
- Radius: 7px · Padding: 10px 14px · font-size: 11px
- Label above (8px gap): `10px · uppercase · tracking 0.12em · color #444`

### Cards

- Background: `#111111`
- Border: `0.5px solid #1e1e1e`
- Radius: 12px · Padding: 16px
- Inner divider: `1px solid accent-border` (accent tint, not neutral gray)
- Section label: `9px · uppercase · tracking 0.12em · color #444`
- No horizontal rule dividers in lists — use `12px vertical padding` between items
- Row hover: background shifts to `#161616`

### Progress bars

- Height: 2px · Radius: 2px
- Track: `#1e1e1e` · Fill: `accent`

### Status indicators

- Dot size: 7px · border-radius: 50% · color: `accent`
- Active pulse: subtle CSS animation only — `opacity 1 → 0.4 → 1`
- Leading elements in lists: always 16px wide to maintain strict vertical grid

---

## Layout principles

- **Intentional asymmetry** — avoid centered layouts. Elements pin to grid edges
- Navigation in ultra-slim vertical strips when possible
- Data pushed to edges to maximize scan efficiency
- Wide empty voids of `base` color balanced against dense data clusters
- Generous margins: 32px · 48px · 64px to let technical data breathe

---

## Motion & transitions

- Duration: **150ms** — feels instantaneous, not animated
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Elements **snap** into existence — no fades, no slides, no entrance animations
- Haptic feedback on critical events (zone enter / exit)
- Active state indicators: subtle pulse only (`opacity` keyframe, nothing else)
- No bouncy or elastic animations — ever

---

## Do's and Don'ts

### Do
- Use 0.5px hairline borders — anything thicker is clunky
- Embrace weight variation within the mono family for hierarchy
- Tighten grids to 4px or 8px increments
- Label every numerical value with its unit
- Use background shifts for elevation, never shadows

### Don't
- No gradients — even 1% is a violation
- No large corner radii — max 14px, most elements at 6–10px
- No bubbly icon sets — use thin-stroke (1px or less) geometric icons or Unicode
- No center alignment — ever
- No entrance animations — elements appear, they don't arrive
- No shadows of any kind

---

## Theme implementation (React Native)

```ts
// config/themes.ts
export const themes = {
  green: {
    accent:       '#1db954',
    accentHover:  '#17a349',
    accentBg:     '#0d2818',
    accentBorder: '#1e3a2e',
  },
  violet: {
    accent:       '#ba9eff',
    accentHover:  '#8455ef',
    accentBg:     '#1a0d33',
    accentBorder: '#2e1a5e',
  },
} as const;

export type ThemeName = keyof typeof themes;

// Base tokens (shared across all themes)
export const base = {
  bg:           '#0a0a0a',
  surface:      '#111111',
  elevated:     '#161616',
  borderDefault:'#1e1e1e',
  borderEmphasis:'#2a2a2a',
  textPrimary:  '#e2e2e2',
  textSecondary:'#888888',
  textMuted:    '#444444',
  danger:       '#e05c5c',
  warning:      '#f0a500',
};
```

Theme preference stored in: `profiles.theme_preference` (Supabase)
Local cache: `AsyncStorage` key `@drakk3ai:theme`
