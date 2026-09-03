# xAura Profile Shell Design

## Goal
Refresh the profile into a dense, data-rich archive inspired by the supplied reference while keeping xAura's own visual language and interactions.

## Design direction
The structure borrows the reference's hierarchy—one strong identity panel, compact telemetry, and dense title rows—but avoids copying its layout, imagery, or branding. xAura keeps the black/graphite base, lime and cyan accents, technical labels, cut corners, dossier framing, and Aura progression.

## Profile experience
- The top identity panel is a two-zone operator dossier: avatar/Aura Core and account identity on the left; rank character card and action controls on the right.
- Aura Core is a circular/segmented progress treatment around the avatar, with level and XP expressed as useful progress data rather than decoration.
- A compact telemetry strip follows the identity panel: ratings, battles, tier lists, friends, daily streak, and current Aura level.
- The archive is a dense responsive grid of existing title cards. Cards remain recognizable at small sizes through poster, title, score, and state label. Hover reveals the existing six-criterion breakdown and actions.
- Distinct xAura sections are used instead of a copied sidebar: Favorites/Top signal, Recent activity, Taste profile, and latest achievements.
- A short “signal readout” turns existing stats into human-readable observations (strongest criterion, average score, preferred activity), without inventing data.

## Achievements experience
- `Achievements.jsx` becomes the single source of truth for approximately 30 automatic achievements. Definitions include category, rarity, icon, description, goal, and a stats-based check/value function.
- Categories: Critic, Architect, Arena, Explorer, Social, Streak, and Aura.
- Existing stats remain the initial data source. Where a metric is not yet available, the achievement is not falsely unlocked; it is rendered as unavailable/in progress.
- New `/achievements` page includes overall completion, category filters, rarity legend, unlocked/in-progress filters, and large achievement artifact cards. Locked cards use a distinct “encrypted dossier” treatment rather than generic disabled gray.
- The profile keeps a compact preview linking to the full achievements page. Public profiles may show unlocked achievements and progress totals, but no private account controls.

## Header and footer
- Header becomes a calmer command bar: stronger brand lockup, compact search module, clear active route marker, and explicit shortcuts to profile, friends, and achievements. Avoid pill overload and excessive glow.
- Mobile navigation uses the same information hierarchy and gives the profile actions first-class placement.
- Footer is treated as the terminal system panel: concise brand statement, grouped navigation including achievements and friends, project telemetry, data attribution, system status, and a clean copyright row. Decorative elements must support hierarchy, not fill empty space.

## Data and component boundaries
- `Achievements.jsx`: achievement definitions, progress calculations, compact/expanded render variants.
- `AchievementsPage.jsx`: page-level filters, summary, category sections, and navigation.
- `TitleMiniCard.jsx` or shared title-card additions: compact rendering of an existing rated title, with image fallback and score/state metadata.
- `Profile.jsx` and `ProfileHeader.jsx`: compose the profile sections; do not duplicate achievement rules or title-card markup.
- `SharedBits.jsx`: shared visual primitives only; no page-specific data fetching.
- `Navbar.jsx` and `Footer.jsx`: shell navigation and telemetry only.

## Interaction and responsive behavior
- Desktop uses dense multi-column archive and telemetry; tablet collapses the right identity zone below the account info; mobile uses stacked sections and horizontal overflow only for intentionally scrollable title strips.
- Hover effects must have visible keyboard/focus equivalents. Cards and achievement artifacts are keyboard navigable where actionable.
- Image failures fall back to an initial/technical placeholder without breaking card dimensions.
- Existing avatar upload, friends, and Supabase data remain compatible.

## Verification
- Run `npm run build`.
- Verify `/profile`, `/achievements`, `/user/:id`, header menus, and footer links at desktop and narrow viewport widths.
- Verify achievement totals and progress are consistent between profile preview and full page for empty, partial, and active profiles.
- Confirm the redesign uses the existing title data and does not add a second rating model or duplicate achievement calculations.
