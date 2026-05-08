---
version: alpha
name: GitHub
description: A high-contrast, utilitarian, developer-first interface built for reading and writing code. The system anchors on white and near-black surfaces, system-ui fonts with tight letter-spacing, a single green accent (#2da44e) for every primary action, and a dark mode that feels native to the terminal. Density is higher than typical marketing sites — compact cards, tight tables, and inline code everywhere. The signature GitHub mark is the monochrome wordmark with the Invertocat logomark.

colors:
  primary: "#2da44e"
  primary-hover: "#2c974b"
  primary-active: "#298e46"
  primary-disabled: "#94d3a2"
  accent-blue: "#0969da"
  accent-blue-hover: "#0860ca"
  ink: "#1f2328"
  body: "#1f2328"
  body-muted: "#656d76"
  body-subtle: "#8b949e"
  ink-on-dark: "#e6edf3"
  body-on-dark: "#e6edf3"
  body-on-dark-muted: "#8b949e"
  canvas: "#ffffff"
  canvas-subtle: "#f6f8fa"
  canvas-inset: "#eaeef2"
  surface-card: "#ffffff"
  surface-header: "#f6f8fa"
  surface-hover: "#f3f4f6"
  surface-active: "#eaeef2"
  surface-dark: "#0d1117"
  surface-dark-elevated: "#161b22"
  surface-dark-hover: "#1c2128"
  surface-dark-active: "#21262d"
  border: "#d0d7de"
  border-strong: "#afb8c1"
  border-on-dark: "#30363d"
  border-on-dark-strong: "#484f58"
  hairline: "#d0d7de"
  success: "#2da44e"
  success-emphasis: "#1f883d"
  danger: "#cf222e"
  danger-emphasis: "#a40e26"
  warning: "#bf8700"
  warning-emphasis: "#9a6700"
  info: "#0969da"
  code-bg: "#f6f8fa"
  code-bg-on-dark: "#161b22"
  code-border: "#d0d7de"
  diff-add: "#dafbe1"
  diff-remove: "#ffebe9"
  on-primary: "#ffffff"
  on-dark: "#e6edf3"

typography:
  hero-display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.5px
  display-lg:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.5px
  display-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.25px
  title-lg:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0
  title-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0
  title-sm:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0
  body-lg:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: 0
  caption-strong:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: 0
  code:
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.42
    letterSpacing: 0
  code-sm:
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0
  button:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: 0
  nav-link:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  stat-number:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: -0.5px

rounded:
  none: 0px
  sm: 2px
  md: 6px
  lg: 8px
  xl: 12px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 5px 16px
    height: 32px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.canvas-subtle}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 5px 16px
    height: 32px
    border: 1px solid "{colors.border}"
  button-secondary-on-dark:
    backgroundColor: "{colors.surface-dark-elevated}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 5px 16px
    height: 32px
    border: 1px solid "{colors.border-on-dark}"
  button-danger:
    backgroundColor: "{colors.danger-emphasis}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 5px 16px
    height: 32px
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 5px 16px
    height: 32px
    border: 1px solid "{colors.primary}"
  button-icon:
    backgroundColor: transparent
    textColor: "{colors.body-muted}"
    rounded: "{rounded.md}"
    size: 32px
  text-link:
    backgroundColor: transparent
    textColor: "{colors.accent-blue}"
    typography: "{typography.body-md}"
  text-link-on-dark:
    backgroundColor: transparent
    textColor: "{colors.accent-blue}"
    typography: "{typography.body-md}"
  top-nav:
    backgroundColor: "{colors.surface-header}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 56px
    borderBottom: 1px solid "{colors.border}"
  top-nav-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.nav-link}"
    height: 56px
    borderBottom: 1px solid "{colors.border-on-dark}"
  page-header:
    backgroundColor: "{colors.surface-header}"
    textColor: "{colors.ink}"
    padding: 32px
    borderBottom: 1px solid "{colors.border}"
  repo-header:
    backgroundColor: "{colors.canvas-subtle}"
    textColor: "{colors.ink}"
    padding: 24px 32px
    borderBottom: 1px solid "{colors.border}"
  sidebar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body-muted}"
    typography: "{typography.body-sm}"
    width: 256px
    borderRight: 1px solid "{colors.border}"
  sidebar-item:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 6px 8px
  sidebar-item-active:
    backgroundColor: "{colors.surface-active}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
  issue-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 16px
    border: 1px solid "{colors.border}"
  issue-card-dark:
    backgroundColor: "{colors.surface-dark-elevated}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 16px
    border: 1px solid "{colors.border-on-dark}"
  code-block:
    backgroundColor: "{colors.canvas-subtle}"
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    rounded: "{rounded.md}"
    padding: 16px
  code-block-dark:
    backgroundColor: "{colors.surface-dark-elevated}"
    textColor: "{colors.on-dark}"
    typography: "{typography.code}"
    rounded: "{rounded.md}"
    padding: 16px
  diff-view:
    backgroundColor: "{colors.canvas}"
    typography: "{typography.code-sm}"
    rounded: "{rounded.md}"
  state-label:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-strong}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  state-label-muted:
    backgroundColor: "{colors.canvas-inset}"
    textColor: "{colors.body-muted}"
    typography: "{typography.caption-strong}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  badge-pill:
    backgroundColor: "{colors.canvas-inset}"
    textColor: "{colors.body-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 8px
  tab-nav:
    backgroundColor: transparent
    textColor: "{colors.body-muted}"
    typography: "{typography.body-md}"
    padding: 8px 16px
    borderBottom: 2px solid transparent
  tab-nav-active:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    borderBottom: 2px solid "{colors.primary}"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 5px 12px
    height: 32px
    border: 1px solid "{colors.border}"
  text-input-focus:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    border: 2px solid "{colors.accent-blue}"
  text-input-on-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 5px 12px
    height: 32px
    border: 1px solid "{colors.border-on-dark}"
  select-menu:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 4px 0
    border: 1px solid "{colors.border}"
  menu-item:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    padding: 8px 16px
  menu-item-hover:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.ink}"
  table-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    borderBottom: 1px solid "{colors.border}"
  table-row-dark:
    backgroundColor: "{colors.surface-dark-elevated}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    borderBottom: 1px solid "{colors.border-on-dark}"
  table-header:
    backgroundColor: "{colors.surface-header}"
    textColor: "{colors.body-muted}"
    typography: "{typography.caption-strong}"
    borderBottom: 1px solid "{colors.border}"
  avatar-circle:
    backgroundColor: "{colors.canvas-inset}"
    rounded: "{rounded.full}"
    size: 32px
  timeline-badge:
    backgroundColor: "{colors.canvas-inset}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 32px
    border: 2px solid "{colors.canvas}"
  footer:
    backgroundColor: "{colors.canvas-subtle}"
    textColor: "{colors.body-muted}"
    typography: "{typography.body-sm}"
    padding: 40px 16px
    borderTop: 1px solid "{colors.border}"
  footer-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.body-on-dark-muted}"
    typography: "{typography.body-sm}"
    padding: 40px 16px
    borderTop: 1px solid "{colors.border-on-dark}"
---

## Overview

GitHub's interface is a **high-contrast, utilitarian, developer-first design system** built for reading, writing, and reviewing code. The base atmosphere is a stark **white canvas** (`{colors.canvas}` — #ffffff) paired with a **subtle gray surface** (`{colors.canvas-subtle}` — #f6f8fa) for headers and backgrounds — clean, never warm, deliberately neutral to keep focus on code. The dark mode inverts to a **near-black canvas** (`{colors.surface-dark}` — #0d1117) with elevated surfaces at `{colors.surface-dark-elevated}` — a terminal-native palette that developers expect.

Brand voltage comes from a **single green accent** (`{colors.primary}` — #2da44e) used on every primary CTA, every success state, and the merged-PR badge. A quiet **accent blue** (`{colors.accent-blue}` — #0969da) carries all inline links. This two-color semantic split — green means "go/action/done", blue means "navigate/more info" — is the system's defining UX pattern.

The system alternates two surface modes:
1. **White canvas** (`{colors.canvas}`) — default content floor, cards, modals
2. **Subtle gray** (`{colors.canvas-subtle}`) — page background, header strips, code block backgrounds

On dark mode, the same hierarchy maps to:
1. **Near-black** (`{colors.surface-dark}`) — page background
2. **Dark elevated** (`{colors.surface-dark-elevated}`) — cards, headers, code blocks

**Key Characteristics:**
- Stark white canvas (`{colors.canvas}`) with minimal gray surface (`{colors.canvas-subtle}`) — no warmth, no tint. The developer's blank page.
- Single green accent (`{colors.primary}` — #2da44e) for primary actions, merged states, and success. One color says "done" across the entire platform.
- Blue links (`{colors.accent-blue}` — #0969da) for navigation and inline references. Green and blue never mix on the same action.
- System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI"`) — zero decorative typography. The code is the content; the UI font is just the frame.
- Monospace code blocks (`ui-monospace, SFMono-Regular`) at 13px / 1.42 — the most important type token in the system. Everything else serves the code.
- Compact density: 32px button height, 16px card padding, tight table rows. Information density is higher than marketing sites — developers scan, they don't browse.
- Border-radius is restrained: `{rounded.md}` (6px) for buttons, inputs, and cards; `{rounded.pill}` for state labels and badges; `{rounded.full}` for avatars.
- Dark mode built-in, not bolted-on. Every surface token has a `-dark` counterpart. GitHub was one of the first major platforms to ship a full dark mode.

## Colors

### Brand & Accent
- **GitHub Green** (`{colors.primary}` — #2da44e): The signature action color. Every primary button, every merged-PR icon, every checkmark. Green means "done" — it's the most semantically loaded color in the system.
- **Green Hover** (`{colors.primary-hover}` — #2c974b): The press/hover darken.
- **Green Active** (`{colors.primary-active}` — #298e46): Deeper press.
- **Green Disabled** (`{colors.primary-disabled}` — #94d3a2): Pale, desaturated — reads as "not available yet."
- **Accent Blue** (`{colors.accent-blue}` — #0969da): All inline text links, tab indicators, and focus rings. Semantically distinct from green — blue means "navigate," not "act."
- **Blue Hover** (`{colors.accent-blue-hover}` — #0860ca): Underlined link press.

### Surface
- **Canvas** (`{colors.canvas}` — #ffffff): Pure white. The background for cards, modals, content panels. Never tinted — GitHub's trust comes from neutrality.
- **Canvas Subtle** (`{colors.canvas-subtle}` — #f6f8fa): The page floor. Used for the body background, header strips, and code block backgrounds. The faintest gray that still reads as "not a card."
- **Canvas Inset** (`{colors.canvas-inset}` — #eaeef2): A slightly darker inset for selected rows, active sidebar items, and badge backgrounds. One step stronger than subtle.
- **Surface Header** (`{colors.surface-header}` — #f6f8fa): Top nav bar, table headers, sticky bars. Same value as canvas-subtle — the system keeps headers visually light.
- **Surface Hover** (`{colors.surface-hover}` — #f3f4f6): Row hover, menu item hover. Slightly warmer than canvas-subtle to read as interactive.
- **Surface Active** (`{colors.surface-active}` — #eaeef2): Selected sidebar item, pressed menu item.
- **Surface Dark** (`{colors.surface-dark}` — #0d1117): The dark-mode canvas. #0d1117 is deliberate — slightly lighter than pure black to reduce eye strain on long code-review sessions.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #161b22): Dark cards, dark headers, dark code blocks. Sits slightly above the dark canvas.
- **Surface Dark Hover** (`{colors.surface-dark-hover}` — #1c2128): Dark-mode hover states.
- **Surface Dark Active** (`{colors.surface-dark-active}` — #21262d): Dark-mode active/pressed states.

### Borders
- **Border** (`{colors.border}` — #d0d7de): The 1px standard border on light surfaces. Present but never loud.
- **Border Strong** (`{colors.border-strong}` — #afb8c1): Focused inputs, selected cards. One step above border.
- **Border On Dark** (`{colors.border-on-dark}` — #30363d): Dark-mode standard border. #30363d at 1px is the most-used dark border value on the platform.
- **Border On Dark Strong** (`{colors.border-on-dark-strong}` — #484f58): Dark-mode focused border.
- **Hairline** (`{colors.hairline}` — #d0d7de): Same as border — used in divider contexts.

### Text
- **Ink** (`{colors.ink}` — #1f2328): Primary text on light surfaces. Not pure black — slightly softened for readability at GitHub's information density.
- **Body** (`{colors.body}` — #1f2328): Same as ink — one text tone for all primary content.
- **Body Muted** (`{colors.body-muted}` — #656d76): Secondary text: timestamps, metadata, "edited" labels, sidebar nav.
- **Body Subtle** (`{colors.body-subtle}` — #8b949e): Tertiary text: placeholders, disabled labels, fine print.
- **On Dark** (`{colors.on-dark}` — #e6edf3): Primary text on dark surfaces. Slightly warm white — not #ffffff, to reduce glare.
- **Body On Dark Muted** (`{colors.body-on-dark-muted}` — #8b949e): Secondary text on dark surfaces.

### Semantic
- **Success** (`{colors.success}` — #2da44e): Same as primary green. Merged PRs, CI passing, status checks.
- **Danger** (`{colors.danger}` — #cf222e): Errors, failed checks, destructive actions. Red is used sparingly — it signals "stop" in a system full of green.
- **Danger Emphasis** (`{colors.danger-emphasis}` — #a40e26): Destructive button fill.
- **Warning** (`{colors.warning}` — #bf8700): Pending CI, warnings, yellow status dots.
- **Info** (`{colors.info}` — #0969da): Same as accent blue. Info banners, status dots.

### Diff Colors
- **Diff Add** (`{colors.diff-add}` — #dafbe1): Green-tinted background for added lines in diffs. Used in PR reviews and commit views — the most emotionally positive color on GitHub.
- **Diff Remove** (`{colors.diff-remove}` — #ffebe9): Red-tinted background for removed lines. Paired with diff-add for the universal code-review visual grammar.

### Code Block Colors
- **Code Background** (`{colors.code-bg}` — #f6f8fa): Inline code and markdown code block backgrounds on light surfaces.
- **Code Background Dark** (`{colors.code-bg-on-dark}` — #161b22): Code backgrounds on dark surfaces.
- **Code Border** (`{colors.code-border}` — #d0d7de): Code block border — same as standard border.

## Typography

### Font Family
The system uses the **native system font stack** for all UI text and **ui-monospace** for all code. There is no branded typeface — the code IS the brand, and the UI font is chosen to be invisible.

- **UI text**: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif`
- **Code**: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`

This is deliberately the most conservative font stack in the industry. GitHub's typography says: "I am not the content. The code is the content."

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.hero-display}` | 32px | 600 | 1.25 | -0.5px | Repository name, page hero titles |
| `{typography.display-lg}` | 28px | 600 | 1.25 | -0.5px | Section headers |
| `{typography.display-md}` | 24px | 600 | 1.25 | -0.25px | Card headers, modal titles |
| `{typography.title-lg}` | 20px | 600 | 1.25 | 0 | Issue/PR titles in the list view |
| `{typography.title-md}` | 16px | 600 | 1.25 | 0 | Card titles, panel headers |
| `{typography.title-sm}` | 14px | 600 | 1.25 | 0 | Section labels, sidebar group headers |
| `{typography.body-lg}` | 16px | 400 | 1.5 | 0 | Issue/PR body, comment text, README body |
| `{typography.body-md}` | 14px | 400 | 1.5 | 0 | Default body text, descriptions, form labels |
| `{typography.body-sm}` | 12px | 400 | 1.5 | 0 | Fine print, footer links, metadata |
| `{typography.caption}` | 12px | 400 | 1.33 | 0 | Timestamps, "X commented", inline metadata |
| `{typography.caption-strong}` | 12px | 600 | 1.33 | 0 | Badge labels, status text |
| `{typography.code}` | 13px | 400 | 1.42 | 0 | **The most important token.** Code blocks, inline code, diff views |
| `{typography.code-sm}` | 12px | 400 | 1.35 | 0 | Smaller code contexts: inline code in tables, diff hunks |
| `{typography.button}` | 14px | 500 | 1.0 | 0 | Button labels — system standard |
| `{typography.nav-link}` | 14px | 400 | 1.5 | 0 | Navigation links, tabs |
| `{typography.stat-number}` | 32px | 600 | 1.0 | -0.5px | Large stat numbers (stars, forks, issues) |

### Principles

- **System fonts only.** No web fonts, no custom typefaces. The UI font renders instantly everywhere because it IS everywhere. This is a performance decision as much as an aesthetic one.
- **Code at 13px.** Every other size in the system derives from code readability. 13px at 1.42 line-height is the sweet spot — small enough for density, large enough for legibility.
- **Weight 600 for headers, 400 for body, 500 for buttons.** GitHub does not use weight 700 anywhere in UI text. The ladder is deliberately narrow: 400 / 500 / 600. Bold (700) is reserved for markdown rendering in user-generated content.
- **No negative letter-spacing below 14px.** The system tightens tracking only at display sizes (24px+). Body text stays at zero — high density doesn't need help looking tighter.
- **Body at 14px, not 16px.** GitHub runs one size smaller than most SaaS platforms. The trade-off is higher information density per viewport — important when you're scanning 30 issues, 50 files changed, or a 200-line diff.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 64px.
- **Card padding:** `{spacing.md}` (16px) — tighter than most SaaS systems (which use 24-32px). GitHub values content density over breathing room.
- **Button padding:** 5px vertical × 16px horizontal — yielding the standard 32px button height.
- **Section spacing:** `{spacing.section}` (64px) for page-level section gaps.

### Grid & Container
- **Max content width:** 1280px for the main content area (repo view, issues list). The sidebar + content split is typically 256px + flex-1.
- **Column patterns:** 
  - 2-column (sidebar 256px + main) — repo view, PR list, settings
  - Single-column centered (max 900px) — markdown rendering, issue body, PR description
  - 12-column grid — the landing page / marketplace
- **Gutters:** 16px between cards in issue/PR lists; 8px between inline items.

### Whitespace Philosophy
GitHub is the opposite of Apple's "product on a pedestal." Whitespace exists to separate, not to celebrate. Cards are 16px apart. Tables have tight rows. The information architecture relies on color (white card on gray background) more than spacing to establish hierarchy. When in doubt, GitHub errs toward density — developers can scan a page of 25 issues faster than they can scan 12 with generous whitespace.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Page background, content area |
| Subtle surface | `{colors.canvas-subtle}` background change | Header bars, code block backgrounds |
| Card | `{colors.canvas}` + 1px `{colors.border}` | Issue cards, PR cards, modals |
| Elevated card | `{colors.canvas}` + 1px `{colors.border}` + subtle shadow | Dropdown menus, tooltips, popovers |

### Shadow Philosophy
GitHub uses **minimal, utilitarian shadows** — and only for elements that need to read as "floating above" the page:
- Dropdown menus and tooltips get `0 8px 24px rgba(140,149,159,0.2)` — a single shadow tier, never layered.
- Cards and panels do NOT use shadows — they use 1px borders instead.
- The dark mode uses no shadows at all — elevated surfaces are distinguished by the lightness change from `{colors.surface-dark}` to `{colors.surface-dark-elevated}`.
- This is the opposite of a "neumorphic" or "glass" aesthetic. GitHub's depth model is: borders for structure, shadows only for floating UI.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Code blocks (rectangular — code never rounds) |
| `{rounded.sm}` | 2px | Inline code backgrounds, keyboard shortcut badges |
| `{rounded.md}` | 6px | **The system default.** Buttons, inputs, cards, dropdowns, modals — everything that's not code or a pill |
| `{rounded.lg}` | 8px | Larger containers, marketing cards |
| `{rounded.xl}` | 12px | Hero cards, featured sections |
| `{rounded.pill}` | 9999px | State labels ("Open", "Merged", "Closed"), badges, topic tags |
| `{rounded.full}` | 9999px / 50% | Avatars only. Circular — the most universal GitHub visual signature |

### Code blocks are deliberately rectangular
`{rounded.none}` or at most `{rounded.md}` only on the outer container. Code inside is always rectangular. Rounding code is the fastest way to break the GitHub feel.

### Avatars
- 20px (inline, next to usernames in lists)
- 32px (standard, in comment threads)
- 40px (profile pages, repo owners)
- Always circular (`{rounded.full}`). The circle avatar is GitHub's single most recognizable visual element — it's the shape that says "this is a person."

## Components

### Top Navigation

**`top-nav`** — Gray header bar pinned to the top. Background `{colors.surface-header}` (#f6f8fa), height 56px, bottom border 1px `{colors.border}`. Left: GitHub wordmark + search input. Center-right: "Pull requests", "Issues", "Marketplace", "Explore" in `{typography.nav-link}`. Far right: notification bell, "+" dropdown, avatar circle with a dropdown arrow. Links are compact, spaced ~12px apart. The header never uses a shadow — the 1px border is enough.

**`top-nav-dark`** — Dark mode variant. Background `{colors.surface-dark}`, border `{colors.border-on-dark}`. Text `{colors.on-dark}`. Same structure, inverted canvas.

### Buttons

**`button-primary`** — The GitHub green action button. Background `{colors.primary}` (#2da44e), text white, type `{typography.button}` (14px / 500), padding 5px × 16px, height 32px, rounded `{rounded.md}` (6px). The green button means "do it" — create, merge, publish, save.

**`button-secondary`** — The default non-primary button. Background `{colors.canvas-subtle}` (#f6f8fa), text `{colors.ink}`, 1px `{colors.border}` border. Same size as primary. Used for "Cancel", "Draft", and companion actions next to a green primary.

**`button-danger`** — Destructive actions. Background `{colors.danger-emphasis}` (#a40e26), text white. Used for "Delete repository", "Remove collaborator", and other irreversible actions. Red is always paired with a confirmation dialog — it's the only color that triggers a safety prompt.

**`button-outline`** — Transparent with green border and green text. Used for "Create new..." actions where the interface is already dense with green buttons. The outline signals "available but secondary."

**`button-icon`** — 32px square transparent icon button. Icon color `{colors.body-muted}`. Used for toolbar actions: copy, search, filter, sort. No border, no background. The icon is the button.

**`text-link`** — Inline text links in `{colors.accent-blue}` (#0969da). The most-used interactive element on the platform. Underlined on hover only — GitHub links are recognizable by color alone.

### Cards & Containers

**`issue-card`** — The fundamental content unit. Background `{colors.canvas}` (white), 1px `{colors.border}`, rounded `{rounded.md}` (6px), padding `{spacing.md}` (16px). Structure: checkbox + state label + title (`{typography.title-lg}` 20px / 600) + one-line description (`{typography.body-sm}`) + bottom metadata row (repo name, issue number, timestamp, comment count). This card definition drives the issues list, PR list, and project board views.

**`repo-header`** — Repository header bar below the top nav. Background `{colors.canvas-subtle}`, padding 24px × 32px, bottom border 1px `{colors.border}`. Contains: repo name in `{typography.hero-display}`, one-line description, stats row (stars / forks / issues), and a row of utility buttons (Watch / Fork / Star).

**`page-header`** — Generic page-level header. Same colors as repo-header but used for settings pages, org dashboards, and list views.

**`sidebar`** — 256px left sidebar with right border 1px `{colors.border}`. Background `{colors.canvas}`. Contains vertically stacked `{component.sidebar-item}` entries. Groups separated by a subtle section label in `{typography.title-sm}`.

**`sidebar-item`** — Transparent, `{colors.ink}` text, hover changes to `{colors.surface-hover}`. Active state (`sidebar-item-active`) gets `{colors.surface-active}` background. Icon + label format, 6px × 8px padding, `{rounded.md}` on hover/active.

### Code Display

**`code-block`** — The defining component. Background `{colors.canvas-subtle}` (#f6f8fa), text `{colors.ink}`, type `{typography.code}` (monospace 13px / 1.42), rounded `{rounded.md}`, padding 16px. Overflow scrolls horizontally — code lines never wrap. The code block often includes a header bar with file name + language label + "Copy" button. Line numbers in `{colors.body-subtle}` at the left margin, right-aligned.

**`code-block-dark`** — Dark variant. Background `{colors.surface-dark-elevated}` (#161b22), text `{colors.on-dark}`.

**`diff-view`** — The second most defining component after the code block. Monospace `{typography.code-sm}` (12px). Added lines get `{colors.diff-add}` background; removed lines get `{colors.diff-remove}` background. Line numbers on both sides (old file / new file), unchanged lines on white. The green-diff/red-diff grammar is the universal code-review visual language, and GitHub's implementation is the reference.

### Labels & Badges

**`state-label`** — Pill-shaped status indicator. Green background for "Open" / "Merged", purple for "Draft", red for "Closed". Type `{typography.caption-strong}` (12px / 600), rounded `{rounded.pill}`, padding 4px × 10px. The state label is the first thing you read on an issue card — it answers "what's the status?" before the title.

**`badge-pill`** — Smaller, more neutral pill. Background `{colors.canvas-inset}`, text `{colors.body-muted}`, type `{typography.caption}` (12px / 400), padding 2px × 8px. Used for topic tags, label chips, and metadata badges.

### Tabs & Navigation

**`tab-nav`** — Horizontal tab row with bottom-border indicator pattern. Inactive: transparent background, `{colors.body-muted}` text, 8px × 16px padding, 2px transparent bottom border. Active: `{colors.ink}` text, 2px `{colors.primary}` (green) bottom border. The green underline is the active signal — it's the only place green appears outside of buttons and status.

### Forms & Inputs

**`text-input`** — Standard 32px input. Background white, 1px `{colors.border}`, `{rounded.md}` (6px), padding 5px × 12px, type `{typography.body-md}`. The placeholder text uses `{colors.body-subtle}`. Compact and utilitarian — GitHub inputs are functional, not decorative.

**`text-input-focus`** — Focus state: border upgrades to 2px `{colors.accent-blue}` (#0969da) with a 3px blue-at-15% outer ring. The blue focus ring is the accessibility guarantee — every input gets it.

**`select-menu`** — Dropdown with border, white background, 4px vertical padding. Menu items at `{typography.body-md}`, 8px × 16px padding, hover background `{colors.surface-hover}`. No shadow on the menu itself (it uses the popover shadow).

### Table / Data

**`table-header`** — Background `{colors.surface-header}`, text `{colors.body-muted}` in `{typography.caption-strong}`, bottom border 1px `{colors.border}`.

**`table-row`** — White background, `{colors.ink}` text in `{typography.body-md}`, 1px `{colors.border}` bottom border. Hover shifts to a very subtle highlight.

### Avatar

**`avatar-circle`** — Perfect circle, `{rounded.full}`, background `{colors.canvas-inset}` for the placeholder state. Sizes: 20px (inline), 32px (standard), 40px (large). The circle avatar is the single most recognizable GitHub design element — it appears next to every comment, every commit, every issue, every PR.

### Footer

**`footer`** — Background `{colors.canvas-subtle}`, 1px `{colors.border}` top border, text `{colors.body-muted}` in `{typography.body-sm}` (12px), padding 40px × 16px. GitHub's footer is deliberately compact — a single row of links (Terms, Privacy, Security, Status, Docs, Contact) and the GitHub wordmark. No multi-column link farms. The information architecture says: "everything you need is in the nav, the footer is just housekeeping."

## Do's and Don'ts

### Do
- Use `{colors.primary}` (GitHub Green #2da44e) for primary actions and success states. Green means "go" — every "Create", "Merge", "Publish", "Save" button is green.
- Use `{colors.accent-blue}` (#0969da) for inline links and navigation. Green and blue serve different semantics — never swap them.
- Run all code in `ui-monospace` at 13px / 1.42. The code IS the content; the monospace token is the most important typographic decision.
- Use 1px `{colors.border}` for card and panel separation. Shadows are only for floating UI (dropdowns, tooltips).
- Keep button height at 32px and card padding at 16px. The compact density is the brand.
- Use pill-shaped labels (`{rounded.pill}`) for status indicators — "Open", "Merged", "Closed" — they're the visual anchor of every list view.
- Apply `{rounded.full}` to every avatar. The circle is GitHub's signature shape.
- Build dark mode alongside light mode. Every surface, text, and border token has a `-dark` counterpart.
- Use diff colors (`{colors.diff-add}` green, `{colors.diff-remove}` red) only for code changes. Those two colors have a single, sacred meaning.
- Render user-generated content (issues, PR descriptions, README) in markdown with full typography — it's the user's voice, not the chrome.
- Use system fonts exclusively — no webfonts. The UI renders instantly on every platform.

### Don't
- Don't add a second accent color beyond green and blue. GitHub's color semantics are globally understood — adding a third breaks the grammar.
- Don't use shadows on cards or panels. 1px borders separate structure; shadows are for floating overlays only.
- Don't round code blocks. Code is rectangular. `{rounded.md}` is acceptable on the outer container, but the code surface inside should never round.
- Don't increase button height beyond 32px for standard actions. Compact is functional; oversized buttons slow down scanning.
- Don't use warm or tinted backgrounds. The canvas is stark white or neutral gray. Warmth reads as "marketing," not "tool."
- Don't use display typefaces or brand fonts. The code is the content; the UI font is an invisible frame.
- Don't add decorative gradients. GitHub uses exactly zero CSS gradients in its interface.
- Don't mix green and blue on the same element. If it's green, it's an action. If it's blue, it's navigation. The split is absolute.
- Don't put the green primary button next to another green primary button. GitHub uses a single CTA per view — the green button is always the most important action on the page.
- Don't use red for anything except danger and deletions. Red is the safety signal — it must mean "stop."

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Small phone | < 544px | Single-column; sidebar hidden behind hamburger; code blocks scroll horizontally; button full-width |
| Phone | 544–767px | Single column; collapsed nav; issue cards stack without metadata column |
| Tablet | 768–1011px | 2-column layout with collapsed sidebar; repo nav tabs may wrap |
| Desktop | 1012–1279px | Full 2-column layout; sidebar visible at 256px; all metadata visible |
| Wide | ≥ 1280px | Full layout with maximum content width of 1280px; sidebar at 296px |

### Touch Targets
- All interactive elements meet a minimum of 32×32px touch target.
- Primary buttons at 32px height with generous horizontal padding meet the requirement.
- Sidebar items at 30px height with 8px padding — tight but usable.
- Icon buttons at 32px square.

### Collapsing Strategy
- **Top nav**: Search bar shrinks; nav links collapse into a hamburger menu at < 1012px.
- **Sidebar**: Hidden at < 1012px, accessible via hamburger or swipe.
- **Issue/PR cards**: Metadata (labels, assignee, comments count) tightens; some metadata moves below the title at mobile.
- **Code blocks**: Never wrap — always scroll horizontally. This is non-negotiable.
- **Tables**: Horizontal scroll at mobile; sticky left column (file name) on wide tables.

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key (`{component.issue-card}`, `{component.code-block}`).
2. Variants of an existing component (`-hover`, `-active`, `-disabled`, `-dark`) live as separate entries in `components:`.
3. Use `{token.refs}` everywhere — never inline hex.
4. Never document hover states as separate components. Each component has at most: default, hover, active, disabled, dark.
5. All body text stays in the system font stack at 14px / 400 / 1.5. All code stays in ui-monospace at 13px / 1.42. The boundary is unbreakable.
6. Green + blue + neutral gray/white + red (danger only) is the complete palette. Don't introduce new hues.
7. When in doubt about emphasis: use weight (400 → 600), not size, not color.
8. Every light-surface token must have a dark-mode counterpart. Ship dark mode with the component, not after.

## Known Gaps

- Syntax highlighting color tokens for code blocks (the 30+ language-specific token colors) are not documented here. GitHub uses a full 50-color scheme per language/dialect; this system covers only the code block container, not the internal token coloring.
- The landing page and marketing surfaces use a slightly different color palette and type scale — this document covers the core product (repo, issues, PRs, code) only.
- Animated micro-interactions (the "merged" animation, the loading skeleton pulse, the status check spinner) are not formalized here.
- The "command palette" (Cmd+K) overlay and the "hovercard" preview (hovering over issue references) are separate components not documented here.
- The mobile app (GitHub Mobile) shares many tokens but diverges on spacing and navigation patterns.
- Copilot chat and AI features introduce conversation-bubble patterns and streaming text animations that are not covered.
- The file-tree / code-browser sidebar component is complex enough to warrant its own specification.
- Notification inbox, the "Explore" discover feed, and the "Stars" / "Sponsors" surfaces each have minor component variants not documented here.
