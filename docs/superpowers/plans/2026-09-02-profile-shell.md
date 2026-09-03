# xAura Profile Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the profile into a dense xAura archive, add a dedicated automatic achievements page, and make the header/footer feel intentional and product-specific.

**Architecture:** Keep page-level data fetching in `Profile.jsx` and `AchievementsPage.jsx`, keep achievement definitions in `Achievements.jsx`, and use shared compact title-card primitives from `SharedBits.jsx`. Extend the existing dossier language instead of introducing a new visual system.

**Tech Stack:** React, React Router, Framer Motion, Tailwind CSS, Supabase, existing anime data and image helpers.

**Spec:** `docs/superpowers/specs/2026-09-02-profile-shell-design.md`

## Global Constraints

- Preserve xAura's black/graphite base, lime/cyan accents, technical labels, cut corners, dossier framing, and Aura progression.
- Use the existing title data and existing rating calculations; do not add a second rating model.
- Keep achievement rules in one module and derive profile/full-page views from the same definitions.
- Image failures must preserve card dimensions and fall back to a technical placeholder.
- Existing avatar upload, friends, and Supabase flows must remain compatible.
- Run `npm run build` before claiming completion.

---

### Task 1: Establish shared compact title-card primitives

**Files:**
- Modify: `src/components/profile/SharedBits.jsx`
- Modify: `src/pages/Profile.jsx`

**Interfaces:**
- Consumes: existing rating objects with `anime_name`, `anime_image`, `average_score`, six criteria fields, and timestamps.
- Produces: `TitleMiniCard({ rating, index, isOwner, onDelete, onRerate, variant })` and `TitleMiniGrid({ ratings, ...props })` exports, used by profile sections.

- [ ] **Step 1: Add a failing smoke test or static verification target**

Confirm the shared module exports the new names after implementation by checking the build import path; this repo has no configured component test runner, so the build is the executable regression check.

- [ ] **Step 2: Implement compact cards**

Add a horizontal/compact card variant that contains a fixed poster area, title, score, state label (`RATED`, `TOP SIGNAL`, or `ARCHIVE` based on score), and a thin score-color indicator. Reuse `shikimoriImg` and retain the existing hover criterion breakdown/actions. Add a responsive grid helper that renders 1 column on narrow screens, 2–3 columns at medium widths, and 4–5 columns on large screens.

- [ ] **Step 3: Replace the profile archive renderer**

In `Profile.jsx`, replace the current direct `RatingGrid` archive rendering with `TitleMiniGrid` while preserving delete and re-rate callbacks. Add a “top signal” slice (highest rated up to 5) and “recent signal” slice (latest up to 5) using existing ratings only.

- [ ] **Step 4: Run the focused verification**

Run: `npm run build`
Expected: PASS with no missing exports or JSX errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/profile/SharedBits.jsx src/pages/Profile.jsx
git commit -m "feat: add compact profile title cards"
```

---

### Task 2: Expand automatic achievements and add shared views

**Files:**
- Modify: `src/components/profile/Achievements.jsx`

**Interfaces:**
- Consumes: `{ ratings, tierLists, battles, avgScore, bestScore, animeCount, level, friends, dailyCount, streak, modesPlayed }` (missing optional fields default to zero).
- Produces: `ACHIEVEMENT_DEFS`, `getAchievementState(def, stats)`, `achievementsProgress(stats)`, and `Achievements({ stats, className, compact })`.

- [ ] **Step 1: Define the expanded achievement catalog**

Replace the 15-item list with approximately 30 definitions in these categories:

```js
const DEFS = [
  // Критик
  { id: 'first-rating', category: 'critic', rarity: 'common', goal: 1 },
  { id: 'ten-ratings', category: 'critic', rarity: 'common', goal: 10 },
  { id: 'marathon', category: 'critic', rarity: 'rare', goal: 50 },
  { id: 'hundred', category: 'critic', rarity: 'epic', goal: 100 },
  { id: 'two-fifty', category: 'critic', rarity: 'legendary', goal: 250 },
  { id: 'balanced-critic', category: 'critic', rarity: 'rare', goal: 1 },
  // Архитектор
  { id: 'first-tier', category: 'architect', rarity: 'common', goal: 1 },
  { id: 'tier-five', category: 'architect', rarity: 'rare', goal: 5 },
  { id: 'tier-ten', category: 'architect', rarity: 'epic', goal: 10 },
  // Арена
  { id: 'first-battle', category: 'arena', rarity: 'common', goal: 1 },
  { id: 'battle-ten', category: 'arena', rarity: 'rare', goal: 10 },
  { id: 'battle-fifty', category: 'arena', rarity: 'epic', goal: 50 },
  { id: 'high-score', category: 'arena', rarity: 'rare', goal: 20 },
  { id: 'score-hunter', category: 'arena', rarity: 'epic', goal: 35 },
  // Исследователь
  { id: 'explorer-three', category: 'explorer', rarity: 'rare', goal: 3 },
  { id: 'explorer-five', category: 'explorer', rarity: 'epic', goal: 5 },
  { id: 'genre-signal', category: 'explorer', rarity: 'rare', goal: 1 },
  // Социальные
  { id: 'first-friend', category: 'social', rarity: 'common', goal: 1 },
  { id: 'crew-five', category: 'social', rarity: 'rare', goal: 5 },
  // Серии
  { id: 'streak-three', category: 'streak', rarity: 'common', goal: 3 },
  { id: 'streak-seven', category: 'streak', rarity: 'rare', goal: 7 },
  { id: 'streak-thirty', category: 'streak', rarity: 'epic', goal: 30 },
  // Aura
  { id: 'aura-l5', category: 'aura', rarity: 'common', goal: 5 },
  { id: 'aura-l10', category: 'aura', rarity: 'epic', goal: 10 },
  { id: 'aura-l15', category: 'aura', rarity: 'legendary', goal: 15 },
  // Точные вкусовые сигналы
  { id: 'sniper', category: 'critic', rarity: 'epic', goal: 8 },
  { id: 'hater', category: 'critic', rarity: 'rare', goal: 1 },
  { id: 'perfect-ten', category: 'critic', rarity: 'legendary', goal: 1 },
  { id: 'tier-and-battle', category: 'explorer', rarity: 'epic', goal: 1 },
]
```

Implement real `check` and `value` functions for every definition, with optional stats safely defaulting to zero. Add `legendary` rarity styling and category labels. Do not unlock achievements based on unavailable metrics.

- [ ] **Step 2: Implement a shared state helper**

`getAchievementState(def, stats)` must return `{ unlocked, current, goal, percent }`, clamping progress between 0 and 100. `achievementsProgress` must count from the same `DEFS` array.

- [ ] **Step 3: Add compact and expanded render variants**

Keep the current compact two-column artifact list for profile previews. Add an expanded artifact card with category, rarity, description, progress, and an unlocked marker for the dedicated page. Locked cards should use hatch/encrypted styling instead of only opacity.

- [ ] **Step 4: Run the focused verification**

Run: `npm run build`
Expected: PASS and profile preview uses the expanded definition count consistently.

- [ ] **Step 5: Commit**

```bash
git add src/components/profile/Achievements.jsx
git commit -m "feat: expand automatic achievement system"
```

---

### Task 3: Add the dedicated achievements page and route

**Files:**
- Create: `src/pages/AchievementsPage.jsx`
- Modify: `src/App.jsx`
- Modify: `src/pages/Profile.jsx`

**Interfaces:**
- Consumes: profile counts from Supabase, `getAuraLevel`, and shared `ACHIEVEMENT_DEFS`/progress helpers.
- Produces: protected `/achievements` route and profile links to the page.

- [ ] **Step 1: Build page data loading**

Fetch the same existing count sources used by `Profile.jsx`: `ratings`, `tier_lists`, `battle_games`, and `daily_results`. Fetch accepted friendship count where available, and gracefully default to zero if the friendships table is unavailable. Compute Aura with the existing helper.

- [ ] **Step 2: Build page layout**

Add a dense page with: technical section header, large completion summary, unlocked/total count, progress bar, category filters, state filters (`all`, `unlocked`, `in-progress`), rarity legend, and expanded achievement cards. Include a link back to profile and preserve xAura dossier styling.

- [ ] **Step 3: Add route and navigation links**

Register a `ProtectedRoute` for `/achievements`. Add links from `Profile.jsx`'s achievement preview, the user menu in `Navbar.jsx`, and the mobile menu. Ensure active state works for the new route.

- [ ] **Step 4: Verify empty and active states**

Run: `npm run build`
Expected: PASS. Manually verify an empty profile shows locked progress without errors and an active profile has the same unlocked total as the profile preview.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AchievementsPage.jsx src/App.jsx src/pages/Profile.jsx src/components/Navbar.jsx
git commit -m "feat: add achievements page"
```

---

### Task 4: Refine the profile composition around the reference structure

**Files:**
- Modify: `src/pages/Profile.jsx`
- Modify: `src/components/profile/ProfileHeader.jsx`
- Modify: `src/components/profile/SharedBits.jsx`

**Interfaces:**
- Consumes: existing profile, ratings, friends, and avatar data.
- Produces: dense profile composition with identity panel, telemetry strip, title sections, signal readout, taste profile, activity, friends, and achievement preview.

- [ ] **Step 1: Restructure the profile header**

Keep avatar upload/delete controls, but make the top panel read as one identity unit: Aura Core around the avatar, identity/XP in the center, character rank card on the right, and compact action metadata. Add a CSS-only segmented ring/tick treatment so the unique interaction is not just a reference copy.

- [ ] **Step 2: Add dense telemetry strip**

Place ratings, battles, tier lists, friends, daily streak, and Aura level into a responsive row below the header. Use existing `StatCard` styling and real values only.

- [ ] **Step 3: Add title sections**

Add “Top signal” and “Recent signal” sections using `TitleMiniGrid`, then retain the full archive under tabs. Keep the friends tab and add a visible link to `/friends`.

- [ ] **Step 4: Add signal readout**

Use `avgScores`, `avgRating`, and existing counts to produce short deterministic copy such as strongest criterion and archive size. If no ratings exist, render an explicit empty-state sentence.

- [ ] **Step 5: Link the achievement preview**

Wrap the compact achievement panel heading or footer in a link to `/achievements`, and avoid duplicating definition logic.

- [ ] **Step 6: Verify responsive composition**

Run: `npm run build`
Expected: PASS. Check the profile at desktop and a narrow viewport: no horizontal overflow except intentionally scrollable title strips, no clipped controls, and avatar actions remain reachable.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Profile.jsx src/components/profile/ProfileHeader.jsx src/components/profile/SharedBits.jsx
git commit -m "feat: reshape profile into dense xAura archive"
```

---

### Task 5: Upgrade header and footer into the xAura command shell

**Files:**
- Modify: `src/components/Navbar.jsx`
- Modify: `src/components/Footer.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: current route, current user/avatar, Aura telemetry, anime/user counts.
- Produces: coherent desktop/mobile shell with profile, friends, achievements, and existing feature links.

- [ ] **Step 1: Refine desktop header hierarchy**

Keep search, catalog, entertainment menu, auth, and avatar behavior. Add direct achievements access and a compact friends/profile action without turning every item into a pill. Use a thin active technical marker and reduce unnecessary glow/background surfaces.

- [ ] **Step 2: Refine mobile header hierarchy**

Place the logged-in profile block first, then search, catalog, entertainment links, friends, achievements, and auth actions. Make the menu spacing and focus states consistent with the desktop shell.

- [ ] **Step 3: Refine footer content and spacing**

Add friends and achievements to navigation, remove stale module-count wording, strengthen the xAura terminal-panel treatment, and keep telemetry values sourced from current data. Ensure the footer remains compact on mobile.

- [ ] **Step 4: Add only supporting CSS**

Add classes for Aura Core ticks, compact title-card hover/focus treatment, and footer terminal separators in `index.css`. Keep colors and typography aligned with existing tokens; do not add a new CSS framework or visual dependency.

- [ ] **Step 5: Verify shell routes**

Run: `npm run build`
Expected: PASS. Manually check active links on `/profile`, `/achievements`, `/friends`, and a game page, plus mobile menu open/close behavior.

- [ ] **Step 6: Commit**

```bash
git add src/components/Navbar.jsx src/components/Footer.jsx src/index.css
git commit -m "feat: polish xAura command shell"
```

---

### Task 6: Final regression verification

**Files:**
- Test: build and manual route checks; no test-file changes unless an existing test fails and the requested behavior requires an expectation update.

- [ ] **Step 1: Run the production build**

Run: `npm run build`
Expected: PASS with no warnings that indicate broken imports or unreachable routes.

- [ ] **Step 2: Check route-level behavior**

Verify `/profile`, `/achievements`, `/user/:id`, `/friends`, `/catalog`, and one game route. Confirm header/footer render on every route and no private controls appear on public profiles.

- [ ] **Step 3: Check data variants**

Verify an empty account, account with ratings, account with no friends-table access, and account with an avatar. Confirm achievements and title cards degrade without breaking layout.

- [ ] **Step 4: Check responsive behavior**

Verify desktop and narrow viewport widths for profile, achievements, header, and footer. Confirm title card poster dimensions remain stable when an image fails.

- [ ] **Step 5: Commit final verification if needed**

```bash
git status --short
git diff --check
git log -3 --oneline
```

Expected: no whitespace errors and only intended changes remain.
