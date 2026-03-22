# Claude Agent — Project Rules & Reference Guide

This file is read automatically by Claude at the start of every session.
**NEVER skip or ignore these rules.**

---

## RULE #1 — ALWAYS DEPLOY AFTER EVERY CODE CHANGE

Any time code is edited, a deploy MUST follow immediately in the same response or the very next step.
No exceptions. Do not stop at "the code is ready." The code is not done until it is live.

**Deploy command (always run from project root):**
```bash
cd /Users/jeffpaine/Documents/Antigravity/ThePaineWedding && vercel deploy --prod
```

Wait for: `Aliased: https://www.thepainewedding.com` — that confirms the new build is live.

---

## RULE #2 — VERIFY BEFORE DEPLOYING

Before running `vercel deploy --prod`, confirm:
1. The file was actually edited (re-read the changed section after editing)
2. Any new component/function is actually *imported and used* in JSX — not just defined
3. Any new state variable is actually *read* in the render — not just declared
4. TypeScript will not error (watch for `possibly null`, missing props, wrong types)
5. Run `npm run build` locally first if the change is non-trivial

---

## RULE #3 — BROWSER CACHE

After a deploy, the user may need to hard-refresh:
- **Mac:** `Cmd+Shift+R`
- **Windows:** `Ctrl+Shift+R`

If the user says "it looks the same," mention hard-refresh FIRST before assuming the deploy failed.
`Aliased: https://www.thepainewedding.com` in CLI output = deploy succeeded.

---

## RULE #4 — WORKING DIRECTORY

All Vercel/git commands must run from the project root:
```
/Users/jeffpaine/Documents/Antigravity/ThePaineWedding
```

The shell sometimes resets to the worktree path:
```
/Users/jeffpaine/Documents/Antigravity/ThePaineWedding/.claude/worktrees/sweet-robinson
```
Always use the absolute project root — never rely on shell cwd.

---

## RULE #5 — SUPABASE SCHEMA CHANGES

Schema changes require TWO steps:
1. Write the `.sql` file in `supabase/migrations/`
2. **Tell the user to run it** in Supabase dashboard → SQL Editor

Migrations are NEVER applied automatically. If a feature depends on new DB columns and the migration hasn't run, it will silently fail.

Always confirm: "Have you run the migration yet?" before debugging DB-related features.

**Alternative for quick data changes:** Use the Supabase REST API directly with the service role key from `.env.local`. This bypasses Docker/CLI issues.

---

## RULE #6 — DEPLOY CHECKLIST

```
[ ] Code change made — re-read edited section to confirm it's correct
[ ] New component/function imported and used in JSX
[ ] No TypeScript errors introduced
[ ] cd /Users/jeffpaine/Documents/Antigravity/ThePaineWedding && vercel deploy --prod
[ ] Wait for: "Aliased: https://www.thepainewedding.com"
[ ] Tell the user: "Live — hard-refresh (Cmd+Shift+R) if you don't see changes"
[ ] If DB migration needed, remind user to run SQL in Supabase
```

---

## Project Overview

- **Framework:** Next.js 16 App Router (Turbopack)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (Postgres)
- **Hosting:** Vercel
- **Domain:** thepainewedding.com → www.thepainewedding.com
- **Production URL:** https://www.thepainewedding.com

---

## Route Structure

```
src/app/
├── layout.tsx                  # Root shell — html/body/fonts/SEO metadata only
├── icon.svg                    # Browser tab favicon (A&J logo)
├── apple-icon.tsx              # iPhone home screen icon (navy bg, cream A&J)
├── opengraph-image.tsx         # Auto-generated OG social preview image
├── globals.css                 # Global styles + Tailwind config
│
├── (main)/                     # Route group — all public pages
│   ├── layout.tsx              # Navbar + Footer + AdminEditBar
│   ├── page.tsx                # Homepage
│   ├── our-story/page.tsx
│   ├── bridal-party/page.tsx
│   ├── wedding-details/page.tsx
│   ├── schedule/page.tsx
│   ├── travel/page.tsx
│   ├── attire/page.tsx
│   ├── registry/page.tsx
│   ├── rsvp/page.tsx
│   ├── faq/page.tsx
│   ├── explore/page.tsx
│   ├── games/
│   │   ├── page.tsx            # Games hub
│   │   ├── painedle/page.tsx
│   │   ├── trivia/page.tsx
│   │   └── crossword/page.tsx
│   └── admin/
│       ├── page.tsx            # Guest admin dashboard (GUESTS tab)
│       ├── content/page.tsx    # Content / hero image / page visibility
│       ├── games/page.tsx      # Trivia question CRUD
│       └── security/page.tsx
│
└── api/
    ├── admin/
    │   ├── auth/route.ts
    │   ├── guests/route.ts
    │   ├── session/route.ts
    │   ├── site-settings/route.ts
    │   ├── page-visibility/route.ts
    │   ├── upload-image/route.ts
    │   ├── trivia-questions/route.ts
    │   └── trivia-questions/[id]/route.ts
    ├── games/
    │   ├── submit-score/route.ts
    │   ├── trivia-questions/route.ts
    │   └── validate-word/route.ts
    └── rsvp/
        └── viewed/route.ts
```

---

## Key Source Files

### Data Layer
| File | Purpose |
|------|---------|
| `src/lib/site-settings.ts` | `getWeddingData()` — fetches from Supabase, falls back to static defaults |
| `src/lib/wedding-data.ts` | Static defaults + `IMAGES` object (all local paths, no Unsplash) |
| `src/lib/games/leaderboard.ts` | `getStoredGamePlayer()`, `saveStoredGamePlayer()`, `captureBrowserProfile()` |
| `src/lib/games/painedle.ts` | Daily word logic, evaluation, keyboard rows |
| `src/lib/games/crossword.ts` | Daily crossword puzzle selection |

### Layout & UI
| File | Purpose |
|------|---------|
| `src/components/layout/Navbar.tsx` | Top nav — uses `/public/A&J.svg` for logo |
| `src/components/layout/Footer.tsx` | Footer with nav links row |
| `src/components/admin/AdminEditBar.tsx` | Bottom admin bar (Edit Mode / Dashboard / Settings) |
| `src/components/ui/Section.tsx` | Page section wrapper with background variants |
| `src/components/ui/Button.tsx` | Shared button component |
| `src/components/ui/AttireTabs.tsx` | Ladies/Gentlemen tab switcher on attire page |
| `src/components/ui/AttireImage.tsx` | Attire image with overlay support |
| `src/components/ui/PersonPortrait.tsx` | Bridal party portrait card |
| `src/components/ui/StoryItem.tsx` | Story timeline entry |

### Games
| File | Purpose |
|------|---------|
| `src/components/games/GameAccountPanel.tsx` | Player account setup/display (first/last/email) — slim collapsed view |
| `src/components/games/PainedleGame.tsx` | Full Wordle-style game board + keyboard |
| `src/components/games/MiniCrosswordGame.tsx` | Mini crossword — auto-scrolls on mount |
| `src/components/games/CoupleTriviaGame.tsx` | 30+ question trivia — requires game account to start |
| `src/components/games/TriviaGate.tsx` | Blocks trivia until account is set up |
| `src/components/games/CrosswordGate.tsx` | Controls crossword access |
| `src/components/games/CollapsibleLeaderboard.tsx` | Expandable leaderboard section |
| `src/components/games/ScoreSubmissionForm.tsx` | Post-game score submission |
| `src/components/games/GamesHubClient.tsx` | Games hub landing page cards |

### Admin
| File | Purpose |
|------|---------|
| `src/components/admin/ContentAdminPanel.tsx` | Hero image + page visibility management |
| `src/components/admin/GamesAdminPanel.tsx` | Trivia question CRUD editor |

---

## Database (Supabase)

### Tables
- **`households`** — household name, RSVP status, meal preferences
- **`guests`** — individual guests, linked to household; `is_plus_one`, `plus_one_for_id`, `plus_one_claimed`, `viewed_rsvp`
- **`game_scores`** — leaderboard entries per game/puzzle key
- **`trivia_questions`** — editable trivia bank (managed via Admin → Games tab)
- **`site_settings`** — JSON blob for editable site content (wedding data, images, page visibility)

### Plus-One Architecture
- Plus-one guests are actual rows in `guests` with `is_plus_one = true`
- `plus_one_for_id` points to the primary guest's UUID
- `plus_one_claimed = false` = "Not Added" state; `true` = claimed/named
- In admin: plus-one rows have amber left border + amber background tint

### All DB migrations are applied. No pending migrations as of 2026-03-16.

---

## Games System

### Painedle (Wordle clone)
- Daily word from `src/lib/games/painedle.ts` → `getDailyWord(dateKey)`
- 5-letter words only, validated against server-side word list
- State saved to localStorage per date key
- Keyboard: near-zero gaps, square keys, responsive sizing via `calc((100vw-2rem)/10)`

### Couple Trivia
- 30+ questions loaded from Supabase `trivia_questions` table
- **Requires game account before starting** (checked via `getStoredGamePlayer()`)
- Scoring: rewards completing more questions — `Math.round((score / questions.length) * answeredCount * 10)`
- Always 2-column answer grid on mobile

### Mini Crossword
- Daily puzzle from `src/lib/games/crossword.ts`
- Auto-scrolls to game on mount with `scroll-mt-24` to clear sticky navbar

### Game Account (GameAccountPanel)
- Stores first name, last name, email in localStorage
- Collapsed view: single slim bar "Player Account · [Name] · Settings · Log Out"
- Email is optional but prompted

---

## Assets & Images

### Public Directory — Key Files
```
public/
├── A&J.svg              # Used in Navbar logo
├── images/
│   ├── hero/            # JeffAshlyn-7977_2.jpg (main hero)
│   ├── story/           # 9 story timeline photos
│   ├── attire/          # 12 women's + 9 men's outfit reference images
│   ├── bridal-party/    # 7 bridesmaids + 7 groomsmen portraits
│   └── rsvp/            # 96 engagement/couple photos (gallery)
```

**No Unsplash or external image URLs remain in the codebase.**
`next.config.ts` has no remote image domains configured.

### Favicon / Icons (all in `src/app/`)
- `icon.svg` — A&J boxed logo, served as browser favicon
- `apple-icon.tsx` — Navy background, cream A&J italic, generated at 180×180
- `opengraph-image.tsx` — Branded social preview card, generated at 1200×630

---

## Design System

### Colors
| Name | Value | Usage |
|------|-------|-------|
| Primary (Navy) | `#163865` | Headings, borders, primary text |
| Secondary | `#7c1f28` | Accent / burgundy |
| Accent | `#c89a73` | Tan/gold highlights |
| Text Secondary | `#657791` | Muted text |
| Base | `#f5f1eb` | Warm off-white background |

### Fonts
- **Bodoni Moda** (`--font-playfair`) — headings, `font-heading` class
- **Montserrat** (`--font-inter`) — body text

### Naming Convention
- "Jeff" when referenced alone
- "Jeffrey" only when paired with Ashlyn (e.g., "Ashlyn & Jeffrey")
- "Ashlyn & Jeffrey" in page titles and formal references

---

## SEO & Social

- **Metadata base:** `https://www.thepainewedding.com`
- **OG image:** Auto-generated via `src/app/opengraph-image.tsx` (Next.js ImageResponse)
- **Apple icon:** Auto-generated via `src/app/apple-icon.tsx`
- **JSON-LD:** `schema.org/Event` structured data in root layout
- **Robots:** index + follow for all pages

---

## Admin Access

- Admin login at `/admin` — password stored in Supabase
- Admin bar visible when logged in: Edit Mode / Dashboard / Settings
- **Edit Mode** — click-to-edit overlays on content throughout the site
- **Dashboard** — full guest list with search, grouped by household, amber plus-one rows
- **Content tab** — Hero Image upload, page visibility toggles
- **Games tab** — Trivia question CRUD (add/edit/delete/reorder questions)

---

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD_HASH=
```

---

## Pending / Nice-to-Have (not yet built)

- **RSVP → auto-populate game account** — after RSVP submit, call `saveStoredGamePlayer()` with confirmed name so guests auto-have a game profile
- **Email popup on games pages** — persists until email entered; returns every visit until saved
- **Admin mobile sticky column headers** — headers should stick when scrolling the guest list
- **Admin mobile A-Z side scroller** — fast alphabet navigation for large guest list

## Session Notes — 2026-03-20

### Painedle Mobile Enter Fix
- Fixed a mobile/on-screen keyboard bug where the Painedle `ENTER` button did not submit guesses.
- Root cause: the virtual keyboard emitted `ENTER` while the handler only recognized `Enter` from physical keyboards.
- Updated `src/components/games/PainedleGame.tsx` so the submit path accepts both `Enter` and `ENTER`.
- This keeps physical keyboard behavior unchanged while restoring correct mobile gameplay.
- Validation: `npm run build` passed on 2026-03-20 after the input handler change.

### Attire Cleanup — 2026-03-20
- Removed the casual women’s denim-based outfit references from the ladies attire image set so the gallery stays aligned with the requested dress code tone.
- Rewrote the ladies and gentlemen attire descriptions in `src/lib/wedding-data.ts` to feel more polished, direct, and less playful.
- Validation: `npm run build` passed after the attire content update.

### Games Admin Cleanup — 2026-03-20
- Updated `src/components/admin/GamesAdminPanel.tsx` so the games backend reflects the current live Painedle and crossword setup instead of older preview content.
- Removed the redundant lower preview cards and kept the admin overview focused on the actual control paths: today's Painedle answer, schedule, word bank, crossword board, trivia bank, submissions, and players.
- Corrected outdated crossword admin copy that still implied a rotating multi-board release; the admin now describes it as the current single week-before crossword board.
- Added clearer Painedle overview metrics, including fixed five-letter length and duplicate-count visibility for the live word bank.
- Validation: `npm run build` passed after the admin cleanup.

### Crossword Admin Editor — 2026-03-20
- Added `/api/admin/crossword-puzzles` with authenticated GET/PUT support for reviewing and saving crossword puzzle overrides through `site_settings` under `games.crossword.overrides`.
- Updated `src/components/admin/GamesAdminPanel.tsx` so the crossword admin now includes a real editor: puzzle/date selector, answer list, clue list, restore-default action, and save flow.
- Updated the public crossword route and `MiniCrosswordGame` to consume server-provided crossword overrides, so admin edits now affect the live puzzle rather than only the admin preview.
- Validation: `npm run build` passed after wiring the crossword editor and runtime overrides.

### Crossword Midnight + Admin Visibility Fix — 2026-03-21
- Fixed the public crossword page so it no longer gets stuck on yesterday's board due to static generation; `/games/crossword` now renders dynamically and uses a Chicago-local date key for daily puzzle rollover.
- Updated `src/lib/games/crossword.ts` to use stable date-key parsing for puzzle rotation and catalog dates, which keeps the board switch tied to the intended local day boundary.
- Expanded the admin crossword editor so the selected puzzle now shows the full editable entry list in one place instead of splitting content in a way that hid part of the clue/answer set.
- Validation: `npm run build` passed after the rollover and admin visibility fixes.
