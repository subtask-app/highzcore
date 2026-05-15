# Highzcore — Design

The visual + interaction language Highzcore is built in. This document drives the design system in M2 and every screen we build after it. Reference Apple's marketing site and macOS Sonoma+ as the north star: clarity, craft, scale, restraint.

If a screen on the live site contradicts this document, the screen gets fixed.

---

## 1. Design principles

Five principles. Every screen passes all five before it ships.

### Clarity over cleverness

Apple's product pages have almost no UI ornament. The content *is* the design. We follow the same rule. If a decorative element doesn't help the user, we delete it. We don't add gradients to make a card look "exciting" — we let typography, scale, and a single accent do the work.

### Big when it matters, small when it doesn't

Hero text is **enormous** (96–128px on desktop). Helper text is small (12–14px). Mid-sized type is rare — most of the time you're either making something the focal point or you're getting out of its way.

### Whitespace is a feature

Apple uses more space than feels comfortable. We do too. Between sections: 96–160px. Inside cards: at least 32px. Between paragraphs: 24px+. Generous whitespace signals confidence and craft.

### Motion teaches, never decorates

Animation explains state changes (a card lifts when it becomes interactive, a number ticks when it updates, a section fades in as you scroll into it). We never animate for the sake of being lively.

### Tactile, not flat

Apple's UI is layered, with subtle depth — soft shadows, just-perceptible elevation changes, a real sense of *materials*. Pure flat design feels dated. We use depth carefully: light, ambient shadows; subtle gradients on raised surfaces; never heavy drop shadows or skeuomorphism.

---

## 2. Color system

### Palette philosophy

Apple uses **black, white, gray, and a single product accent per page**. The accent rotates with the product story (peach for iPhone, lavender for the Watch in some campaigns). We adopt the same structure: a strict neutral spine with a small set of accents that we use *one at a time*, contextually.

### Tokens

All values are stored as CSS custom properties. We expose them as Tailwind tokens via `@theme inline` in `globals.css`.

**Neutrals (the spine)**

| Token | Value | Where it's used |
|---|---|---|
| `--c-ink` | `#06070A` | True page background (dark mode), display text on white |
| `--c-graphite-900` | `#0E1014` | Card surface on dark backgrounds |
| `--c-graphite-800` | `#16191F` | Raised card on `ink` |
| `--c-graphite-700` | `#22262E` | Hover state on raised card |
| `--c-graphite-600` | `#363B45` | Borders, dividers on dark |
| `--c-graphite-500` | `#5A616E` | Tertiary text, icons-low-emphasis |
| `--c-graphite-400` | `#838B98` | Secondary text |
| `--c-graphite-300` | `#B0B6C0` | Placeholder, disabled |
| `--c-graphite-200` | `#D4D8DE` | Borders on light |
| `--c-graphite-100` | `#EBEDF0` | Card surface on light |
| `--c-graphite-50` | `#F5F6F8` | Page background, light mode |
| `--c-paper` | `#FFFFFF` | True white, raised card on light mode |

**Brand accents (the Highzcore primary)**

Carrying forward the cyan→blue logo gradient as our primary brand color, refined to a cleaner scale.

| Token | Value | Notes |
|---|---|---|
| `--c-brand-50` | `#E8F8FB` | Lightest tint — subtle backgrounds |
| `--c-brand-100` | `#C2EEF6` | Subdued accent fills |
| `--c-brand-200` | `#94E1EE` | Soft chip backgrounds |
| `--c-brand-300` | `#5FD0E3` | Inline link in dark mode |
| `--c-brand-400` | `#2BB9D2` | Hover state |
| `--c-brand-500` | `#0099BF` | **Primary** — buttons, focus rings, brand surfaces |
| `--c-brand-600` | `#007FA4` | Pressed |
| `--c-brand-700` | `#006487` | Body link on white |
| `--c-brand-800` | `#004B68` | Deep text on light backgrounds |
| `--c-brand-900` | `#003047` | Highest-contrast text |
| `--c-brand-gradient` | `linear-gradient(135deg, #2BB9D2 0%, #1056C4 100%)` | The logo gradient — sparingly, on hero CTAs and brand surfaces |

**Product accents (used one at a time, per product page)**

Each product gets a single accent color. This is its identity — used on its product page, in product-specific stat cards, in the Telegram bot's product-specific badges, and nowhere else.

| Product | Token | Value |
|---|---|---|
| Audience Insights | `--c-product-insights` | `#FF8A5C` (warm peach) |
| Thumbnail & Title Testing | `--c-product-abtest` | `#A584FF` (lavender) |
| Promote | `--c-product-promote` | `#5BD68C` (fresh green) |
| Collab | `--c-product-collab` | `#FFC857` (warm yellow) |
| Boost (if it ships) | `--c-product-boost` | `#F45B69` (coral red) |

These accents are bright but never garish. They're chosen to feel friendly and human, not corporate.

**Semantic colors**

| Token | Value | Notes |
|---|---|---|
| `--c-success` | `#1FB479` | Confirmations, completed states |
| `--c-warning` | `#F4A623` | Pending, almost-done |
| `--c-danger` | `#E5484D` | Errors, destructive actions |
| `--c-info` | `#0099BF` | Same as `brand-500` — informational |

### Dark mode is the default

The dashboard is dark-mode-first (the Telegram mini-app uses dark backgrounds by default, and most creators work in dark mode). The marketing site is **dual-mode** with light as the default (Apple-style), and we provide a toggle for both creators and workers.

### Contrast requirements

- Body text on background: minimum 7:1 (WCAG AAA where possible, AA absolute floor)
- Display text: 4.5:1 minimum
- Icons + interactive elements: 3:1 minimum against their surface
- Focus rings: always 3px, brand-500, with a 1px white outset for visibility on dark surfaces

---

## 3. Typography

### Font stack

| Role | Font | Why |
|---|---|---|
| Display (headlines, hero) | **Inter Display** | Variable, optical sizing, excellent at large sizes, free, fast |
| Body | **Inter** | Same family for harmony, optimized for UI text |
| Mono (code, numerics in dashboards) | **JetBrains Mono** | Tabular figures for amounts, IDs, addresses |

Inter and Inter Display load from `next/font/google`. JetBrains Mono loads locally.

### Type scale

Based on a `1.25` modular scale anchored at `16px` body. Display sizes are intentionally large in Apple style.

| Token | Size (desktop) | Size (mobile) | Weight | Letter spacing | Use |
|---|---|---|---|---|---|
| `display-2xl` | `128px / 1.0` | `64px / 1.05` | `800` | `-0.04em` | Hero headlines on marketing pages |
| `display-xl` | `96px / 1.05` | `48px / 1.1` | `800` | `-0.035em` | Product page heroes |
| `display-lg` | `72px / 1.05` | `40px / 1.1` | `700` | `-0.03em` | Section openers |
| `display-md` | `56px / 1.1` | `36px / 1.15` | `700` | `-0.025em` | Sub-section heads |
| `display-sm` | `40px / 1.15` | `28px / 1.2` | `700` | `-0.02em` | Card titles, modal heads |
| `title-lg` | `28px / 1.25` | `22px / 1.3` | `600` | `-0.01em` | Page titles in dashboard |
| `title-md` | `22px / 1.3` | `18px / 1.35` | `600` | `-0.005em` | Card headers |
| `title-sm` | `18px / 1.4` | `16px / 1.4` | `600` | `0` | List item titles |
| `body-lg` | `18px / 1.55` | `17px / 1.55` | `400` | `0` | Lede paragraphs, marketing body |
| `body-md` | `16px / 1.55` | `16px / 1.55` | `400` | `0` | Default body |
| `body-sm` | `14px / 1.5` | `14px / 1.5` | `400` | `0` | Secondary text |
| `caption` | `12px / 1.4` | `12px / 1.4` | `500` | `0.01em` | Captions, labels |
| `overline` | `12px / 1.2` | `12px / 1.2` | `600` | `0.18em` (uppercase) | Section eyebrows |
| `mono-md` | `15px / 1.5` | `14px / 1.5` | `500` | `0` | Numbers, currency in dashboards |

### Optical sizing rules

- **Display ≥ 56px**: always use `Inter Display`, weight 700–800, tight letter-spacing (`-0.025em` to `-0.04em`)
- **Title 18–28px**: `Inter`, weight 600, slight negative letter-spacing
- **Body**: weight 400 always, no letter-spacing adjustment
- **Overlines**: uppercase, weight 600, wide letter-spacing (`0.18em`), small size

### Numerics

In dashboards, all numbers use `font-feature-settings: "tnum"` (tabular figures) so they align in columns. Currency amounts always use mono in earnings/withdrawal contexts; never mono in marketing copy.

---

## 4. Spacing system

8-pixel base grid. Every spacing value is a multiple of 4.

| Token | Value | Use |
|---|---|---|
| `space-0` | `0` | — |
| `space-1` | `4px` | Tight inline gaps |
| `space-2` | `8px` | Icon + label |
| `space-3` | `12px` | Compact stacks |
| `space-4` | `16px` | Default stack gap |
| `space-5` | `20px` | — |
| `space-6` | `24px` | Comfortable stack gap, paragraph spacing |
| `space-8` | `32px` | Card padding (default) |
| `space-10` | `40px` | Card padding (spacious) |
| `space-12` | `48px` | Section gaps in dashboards |
| `space-16` | `64px` | Section gaps in marketing (mobile) |
| `space-20` | `80px` | — |
| `space-24` | `96px` | Section gaps in marketing (desktop, default) |
| `space-32` | `128px` | Major section breaks |
| `space-40` | `160px` | Between distinct marketing chapters |

### When to use what

- **Inside cards**: `space-8` padding, `space-4` between elements, `space-6` between groups
- **Between cards in a grid**: `space-6` mobile, `space-8` desktop
- **Marketing page sections**: `space-24` between sections on desktop, `space-16` mobile
- **Hero top/bottom padding**: `space-32` to `space-40` desktop

---

## 5. Layout grid

### Marketing pages

Apple uses a flexible centered column with section-specific max-widths.

- **Hero text max-width**: 1100px (lets headlines wrap on 2 lines at display-2xl)
- **Body text max-width**: 720px (60–80 characters per line)
- **Image/feature max-width**: 1280px
- **Page outer gutters**: 24px mobile, 48px tablet, 80px desktop, max content width 1440px

### Dashboard layouts

Three-column shell:

- **Left rail (desktop)**: 264px fixed — primary navigation
- **Main content**: fluid, max-width 1280px, centered when content is below max
- **Right rail (optional)**: 320px — contextual help, recent activity, can collapse

On mobile/Telegram, the left rail collapses to a bottom bar (4–5 icons) and the right rail moves to a slide-up sheet.

### Breakpoints

| Token | Min-width | Notes |
|---|---|---|
| `sm` | `480px` | Tall phones |
| `md` | `768px` | Tablets, large phones in landscape |
| `lg` | `1024px` | Small laptops |
| `xl` | `1280px` | Default desktop |
| `2xl` | `1536px` | Wide monitors |

---

## 6. Motion system

### Curves

Two curves. That's it. No bouncy springs, no overshoots, no novelty easings.

| Token | Cubic-bezier | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default — enters, hovers, expands |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Transitions, route changes |

For physics-based interactions (drag-and-drop, scroll-anchored elements), we use Framer Motion with `spring({ stiffness: 260, damping: 28 })` — calm spring, no overshoot.

### Duration scale

| Token | ms | Use |
|---|---|---|
| `--dur-instant` | `80` | Hover state changes, focus ring |
| `--dur-quick` | `160` | Button press, small UI feedback |
| `--dur-base` | `240` | Default — card lift, modal fade |
| `--dur-slow` | `360` | Modal/sheet enter, page transitions |
| `--dur-cinematic` | `520` | Hero reveals, scroll-triggered headline |

Anything over 520ms is too slow and feels broken.

### Specific motion patterns

**Card hover (interactive cards)**
- `transform: translateY(-2px) scale(1.005)`
- `box-shadow` increases by one elevation step
- Duration: `dur-base`, ease `ease-out`

**Button press**
- `transform: scale(0.97)`
- Duration: `dur-quick`

**Scroll-driven section reveal (marketing)**
- Section starts at `opacity: 0; transform: translateY(24px)`
- Fades in when 20% in viewport
- Duration: `dur-cinematic`, ease `ease-out`
- Each child element stagger-delayed by 40ms

**Number ticker (animated counters)**
- `requestAnimationFrame` loop over `dur-cinematic`
- Easing `ease-out`
- Numbers always animate from 0 → final on first viewport entry

**Page transition (route change)**
- Outgoing: `opacity 1 → 0` over `dur-quick`
- Incoming: `opacity 0 → 1, translateY(8px → 0)` over `dur-base`

**Modal / sheet**
- Backdrop: `opacity 0 → 1` over `dur-base`
- Modal: `opacity 0 → 1, translateY(16px → 0)` over `dur-slow`
- On mobile, sheets slide up: `translateY(100% → 0)` over `dur-slow`

### Reduced motion

If `prefers-reduced-motion: reduce`:
- Replace all transforms with simple opacity transitions
- Cut durations to `dur-quick` or instant
- Disable scroll-driven reveals (show content immediately)

---

## 7. Depth & shadow system

Apple's depth is *quiet*. We use 4 elevation levels max.

| Token | Value | Use |
|---|---|---|
| `--shadow-0` | `none` | Flat surfaces |
| `--shadow-1` | `0 1px 2px rgba(6, 7, 10, 0.08), 0 1px 1px rgba(6, 7, 10, 0.04)` | Resting card |
| `--shadow-2` | `0 4px 12px rgba(6, 7, 10, 0.12), 0 2px 4px rgba(6, 7, 10, 0.06)` | Hover, modal |
| `--shadow-3` | `0 16px 40px rgba(6, 7, 10, 0.18), 0 4px 12px rgba(6, 7, 10, 0.08)` | Top-level modal, popover, dropdown |
| `--shadow-glow-brand` | `0 0 0 1px rgba(0, 153, 191, 0.12), 0 8px 32px rgba(0, 153, 191, 0.18)` | Brand-accent focus state on hero CTA only |

**Dark-mode shadows:** shadows are barely visible on dark backgrounds. Instead, we use a **1px inner stroke** (`box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04)`) on raised dark surfaces to imply elevation.

### Borders

We use borders sparingly. When we do:
- `1px solid` always
- Color: `--c-graphite-200` on light, `--c-graphite-600` on dark
- Border-radius: see component principles below

### Border-radius scale

| Token | Value | Use |
|---|---|---|
| `--r-xs` | `4px` | Tiny chips, badges |
| `--r-sm` | `8px` | Form inputs, small buttons |
| `--r-md` | `12px` | Standard buttons, list items |
| `--r-lg` | `16px` | Cards, modals |
| `--r-xl` | `24px` | Hero cards, large modal surfaces |
| `--r-2xl` | `32px` | Marketing feature cards |
| `--r-full` | `9999px` | Pills, avatar containers |

---

## 8. Iconography

- **Source**: `lucide-react` (already in the project — keep it)
- **Default stroke width**: `1.5`
- **Default size**: `20px` inline, `24px` standalone, `32px` in stat cards, `48px` in hero feature cards
- **Color**: inherits text color by default; never multi-color icons except for the product accent badges
- **Never** use emoji as functional UI (we use them in marketing copy and bot messages, not as button icons)

### Product badges

Each product has a single canonical icon. These appear on product pages, in the dashboard product picker, and in Telegram notifications.

| Product | Icon (lucide) |
|---|---|
| Audience Insights | `MessageSquareHeart` |
| Thumbnail & Title Testing | `LayoutGrid` |
| Promote | `Megaphone` |
| Collab | `Users` |
| Boost | `Rocket` |

Inside a product badge: icon centered in a rounded square (`r-lg`), filled with the product accent color at 12% opacity, icon at 100% accent color. Always 1px ring at 8% accent color.

---

## 9. Imagery direction

Apple uses three image types contextually. We do the same.

### 1. Hero photography

Big, bright, real. Used on the homepage hero and product page heroes.

- **Subject**: a creator at their setup, a creator filming, an audience member watching content on their phone — never staged stock photos with white backdrops and forced smiles
- **Style**: cinematic, soft natural light, shallow depth of field where appropriate
- **People**: must reflect our actual markets — Nigerian, Indian, Indonesian, Malaysian creators predominantly. **No Western-tech-stock imagery.**
- **Treatment**: full-bleed in hero sections, no overlays or text-on-image effects beyond a subtle bottom gradient if text legibility requires it
- **Source**: we commission custom photography post-launch. Pre-launch we use carefully chosen Unsplash/Pexels with consistent grading.

### 2. Product imagery (UI shots)

The actual app, shown beautifully. This is *most* of our imagery.

- **Always**: real screenshots, never mockups with fake data
- **Style**: device frame (subtle, Apple-style — no chunky bezels). Background: gradient mesh subtly matching the product accent
- **Treatment**: floated with `--shadow-3`, slight perspective tilt for variety (`rotateY(-6deg)` on alternate sections)

### 3. Abstract / geometric illustration

For concepts that don't have a UI shot (privacy, scale, "how it works" diagrams).

- **Style**: minimal line-based illustrations with subtle gradient fills, the product accent as the highlight color
- **Never**: cartoonish characters, isometric people-illustrations, "Corporate Memphis" style
- **Inspiration**: Stripe's older marketing illustrations, Notion's section dividers

### 4. (Sparingly) 3D renders

For genuinely-hero moments only. Limited to 2–3 places site-wide.

- A 3D rendering of the Highzcore logo at the top of the homepage hero
- A 3D rendering of the analytics report shown in the Insights product page hero
- A 3D rendering of stacked devices showing the mini-app on the For Workers page

Built in Blender or Spline, exported as transparent PNG/WebP. Never embedded as live 3D scenes (performance + accessibility).

---

## 10. Component principles

### Buttons

Three variants. That's it.

| Variant | Style | Use |
|---|---|---|
| **Primary** | Filled brand-500 / brand-gradient on hero / pressed state brand-600 | The single most-important action on the screen |
| **Secondary** | Outlined, transparent fill, ink text on light / graphite-100 text on dark | Alternative actions |
| **Ghost** | No fill, no border, ink text, hover state graphite-100 background | Tertiary actions, "Cancel" |

Sizes: `sm` (36px h), `md` (44px h, default), `lg` (56px h, hero only).

Padding: horizontal `space-6` for md, `space-8` for lg.

Border-radius: `r-md` for sm/md, `r-lg` for lg.

Press state: `scale(0.97)`. Focus ring: 3px `brand-500` with 1px paper offset.

**Never:**
- Multiple primary buttons in one view
- Tiny buttons (< 36px tap target — fails accessibility)
- Buttons with icons that aren't decorative — the label always carries the meaning

### Cards

Cards are our most-used surface. Three variants.

| Variant | Surface | Border | Shadow | Use |
|---|---|---|---|---|
| **Plain** | `paper` (light) / `graphite-900` (dark) | none | `shadow-0` | Page sections |
| **Resting** | `paper` / `graphite-900` | `1px graphite-200` / inset graphite-600 | `shadow-1` | Default card |
| **Interactive** | same as resting | same | `shadow-1`, hover `shadow-2` + `translateY(-2px)` | Clickable cards |

Padding: `space-8` default, `space-10` for hero cards. Border-radius: `r-lg` default, `r-xl` for hero cards.

### Forms

Apple's forms are tall, calm, and obvious.

- **Input height**: 48px (mobile-tap-friendly, also matches `lg` button height for symmetry on auth pages)
- **Input padding**: `space-4` horizontal, `space-3` vertical
- **Label**: above the input, `body-sm`, weight 500, `graphite-700` on light / `graphite-300` on dark
- **Helper text**: below input, `caption`, `graphite-500`
- **Error state**: helper text replaced with error text in `danger`, input border becomes `danger`
- **Focus**: 3px brand-500 ring, no inset
- **Background**: `paper` on light, `graphite-800` on dark
- **Border-radius**: `r-md`

### Modals & sheets

Modal on desktop (centered, scrim, `shadow-3`). Sheet on mobile (slide-up, full-width, scrim).

- Backdrop: rgba(6, 7, 10, 0.6) with 12px backdrop-blur
- Modal max-width: 480px standard, 640px for product configurators
- Border-radius: `r-xl` (16px corners) on desktop, top corners only `r-xl` on mobile sheets
- Close affordance: top-right X button on desktop, drag-handle indicator on mobile sheets
- Body padding: `space-8`

### Charts

We chart things. Keep them clean.

- Library: **Recharts** (already supported in our stack; lightweight, flexible)
- Color: never rainbow. Single brand color or single product accent per chart. Multi-series uses tints of the same hue.
- Gridlines: `graphite-200` on light, `graphite-700` on dark, 1px, sparingly
- Axes: minimal — only show what aids comprehension
- Tooltips: card-style, `shadow-2`, `r-md`
- Empty state: never show an empty chart. Replace with an `<EmptyState>` illustration.

### Tabular data

- Row height: 56px default
- Zebra striping: never (too noisy)
- Hover: row background lifts to `graphite-50` / `graphite-800`
- Sortable column headers: caret icon on hover, brand-500 when active
- Mobile fallback: tables collapse into card lists below `md`

### Empty states

Critical. Every place that can be empty has a designed empty state.

- Centered in container, max-width 400px
- Illustration: 80–120px, simple line-style
- Title: `title-md`, weight 600
- Body: `body-sm`, `graphite-500`, 2 sentences max
- Primary CTA: action that fills the state

### Skeletons

While loading:
- Background: `graphite-100` on light, `graphite-800` on dark
- Shimmer: animated gradient sweeping left → right, `dur-cinematic` per cycle
- Match the shape of the content that will replace it (don't show a generic grey rectangle for a 3-line text block)

---

## 11. Accessibility

Non-negotiable. Every page must pass:

- **Color contrast**: WCAG AA minimum, AAA for body text
- **Tap targets**: 44×44px minimum on mobile (Apple HIG matches this)
- **Keyboard navigation**: every interactive element reachable + operable by keyboard, visible focus ring always
- **Screen reader labels**: every icon-only button has `aria-label`; every meaningful image has `alt`
- **Reduced motion**: respected via media query
- **Form errors**: associated with inputs via `aria-describedby`, announced to screen readers
- **Headings**: never skip levels; one `h1` per page
- **Color is never the only signal**: red text always has an icon, green check always has the word "complete"

We test with axe DevTools + manual screen reader passes before any page ships.

---

## 12. Telegram mini-app constraints

The mini-app runs inside Telegram's WebView. Specific design rules apply.

- **Safe areas**: use `env(safe-area-inset-*)` for top + bottom padding (notch, home indicator)
- **Telegram theme variables**: read `themeParams` from `window.Telegram.WebApp` and let users use Telegram's light/dark; our design tokens map to it
- **MainButton**: when there's exactly one primary action on a screen, use Telegram's native MainButton instead of rendering our own button. Visual consistency wins.
- **BackButton**: same — use Telegram's native back when appropriate
- **HapticFeedback**: on primary actions (publish, submit, confirm), trigger `notification('success')` haptic
- **No external fonts**: rely on system fonts inside the mini-app (Telegram strips/throttles external font loading on some clients). Use `-apple-system, SF Pro Text` on iOS, `system-ui` everywhere else. Inter falls back gracefully.
- **Input font-size 16px**: prevent iOS Safari zoom (already in `globals.css`)
- **Tap-highlight**: stripped (already in `globals.css`)
- **Scroll containers**: use `overscroll-behavior: contain` to prevent the Telegram drawer from grabbing scroll

---

## 13. Logo usage

The Highzcore logo (cyan→blue gradient mark + wordmark) is already designed and lives at [src/components/brand/Logo.tsx](src/components/brand/Logo.tsx). Keep using it. Rules:

- Minimum clear space around the lockup: equal to the height of the icon
- Minimum size: icon 24px, full lockup 96px wide
- On marketing hero sections: full lockup, size `lg`
- On dashboard headers: full lockup, size `md`
- On favicons + tight nav: `iconOnly`, size `sm`
- On dark backgrounds: white wordmark, gradient icon stays the same
- On light backgrounds (marketing): ink-color wordmark, gradient icon stays the same
- Never alter the gradient direction or colors
- Never re-stroke the play triangle

---

## 14. The "Apple-style" reveal pattern

This is the recurring marketing-page motif. Most product pages use it twice.

A section that starts with a single oversized line of display copy on an otherwise empty stage. As you scroll in, supporting content fades up beneath it. Two or three sentences max. Then a single image or piece of UI floats into view.

Structure:

```
[ giant headline                                 ]
[                                                ]
[                                                ]
[ supporting sentence ─────────────────────────  ]
[                                                ]
[ ┌─────── UI screenshot or product image ───┐  ]
[ │                                          │  ]
[ └──────────────────────────────────────────┘  ]
```

Padding: `space-32` top + bottom. Center-aligned. Max width 1100px for headline, 720px for body. Background: a soft gradient mesh in the product accent at ~6% opacity over the page neutral. The UI image floats with `shadow-3` and a slight rotate on alternate sections.

---

## 15. File outputs from M2

When we build M2 (design system) these tokens land in:

- `src/styles/tokens.css` — all CSS custom properties
- `tailwind.config.ts` — Tailwind theme using the tokens (custom plugin if needed)
- `src/lib/motion.ts` — Framer Motion presets matching our duration + easing scale
- `src/components/ui/` — every primitive listed in section 10

Storybook-style demo at `/design-system` (dev-only) shows every token and primitive in light + dark mode.

---

## 16. When this document changes

Same rule as `BRAND.md`. The design language is meant to be stable. If you change a token here, every component using it inherits the change automatically — that's the point of the token system.

When new patterns emerge (a new component, a new motion behavior), document them here first, then implement.
