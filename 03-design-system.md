# drakk3-assistant — Design System

> **Version:** 2.0  
> **Status:** Canonical visual source of truth

---

## 1. Canonical status

This file is the **only** visual source of truth for the MVP.

`drakk3ai-design-system.md` is deprecated and must not be used for new decisions.

---

## 2. Creative north star

**The Silent Operator**

The product should feel like a precision tool, not a consumer app.

Core principles:
- elevation through surface layers, never shadows
- left-aligned layouts only
- no gradients, no glow, no blur
- sharp, fast transitions
- restrained accent usage over a dark mono-driven interface

---

## 3. Canonical tokens

### Base colors

| Token | Value | Usage |
|---|---|---|
| `bg` | `#0A0A0A` | app background |
| `surface` | `#111111` | default surfaces |
| `elevated` | `#161616` | nested panels / active rows |
| `borderDefault` | `#1E1E1E` | hairline separators |
| `borderEmphasis` | `#2A2A2A` | inputs / stronger dividers |
| `textPrimary` | `#E2E2E2` | primary content |
| `textSecondary` | `#888888` | secondary content |
| `textMuted` | `#444444` | metadata / labels |
| `danger` | `#E05C5C` | destructive / error |
| `warning` | `#F0A500` | warning / caution |

### Theme accents

#### `green` (default)
- `accent`: `#1DB954`
- `accentHover`: `#17A349`
- `accentBg`: `#0D2818`
- `accentBorder`: `#1E3A2E`

#### `violet`
- `accent`: `#BA9EFF`
- `accentHover`: `#8455EF`
- `accentBg`: `#1A0D33`
- `accentBorder`: `#2E1A5E`

---

## 4. Typography

Font stack:
- `SF Mono`
- `Fira Code`
- `JetBrains Mono`

| Token | Size | Weight | Tracking |
|---|---:|---:|---:|
| `display` | 28 | 700 | -0.56 |
| `heading` | 18 | 600 | -0.18 |
| `body` | 13 | 400 | 0.13 |
| `label` | 10 | 500 | 1.4 |
| `mono` | 11 | 400 | 0.66 |

Rules:
- labels are uppercase
- content is left-aligned
- hierarchy comes from weight, spacing, and surface contrast

---

## 5. Shape, spacing, borders, motion

### Radius
- `radiusSm = 6`
- `radiusMd = 10`
- `radiusLg = 14`
- `radiusPill = 999`

### Borders
- default border width: `0.5`
- focus border width: `1`
- no other border widths in MVP

### Spacing scale
- `4, 8, 12, 16, 24, 32, 48`

### Motion
- duration: `150ms`
- easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- no entrance animations
- no bounce / elastic motion

---

## 6. Component rules

### Buttons

#### Primary
- background: `accent`
- text: `bg`
- border: none
- radius: `7`

#### Ghost
- background: transparent
- text: `accent`
- border: `0.5` using `accent`

#### Muted
- background: `elevated`
- text: `textSecondary`
- border: `0.5` using `borderEmphasis`

### Inputs
- background: between `surface` and `bg`; implementation token should be centralized in config
- default border: `borderEmphasis`
- focus border: `accent`
- placeholder: `textMuted`

### Cards
- background: `surface`
- border: `0.5` using `borderDefault`
- radius: `12`
- padding: `16`

### Badges
- active badge uses accent tokens
- warning/offline states use semantic tokens only

---

## 7. Hard rules for implementation

These rules are aligned with `AGENTS.md` and are non-negotiable in MVP implementation:

- no hardcoded shadows
- no gradient usage
- no `textAlign: 'center'`
- no border radius above `14` except `radiusPill`
- no hardcoded component colors when a token exists
- prefer tokenized config over ad-hoc values in components

---

## 8. Theme persistence

Theme preference is stored in:
- database: `profiles.theme_preference`
- local cache: AsyncStorage

The persisted value is one of:
- `green`
- `violet`

---

## 9. What changed from the old design docs

- this document is now canonical
- duplicate design-system guidance was removed
- implementation examples were intentionally removed to avoid rule conflicts
- token values and visual restrictions are now the actual source of truth
