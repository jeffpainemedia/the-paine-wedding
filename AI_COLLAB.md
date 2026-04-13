# The Paine Wedding — AI Collaboration Document

> **This is the single source of truth for any AI working on this project.**
> Update this file at the end of every session. Any AI (Claude, Codex, Gemini, etc.)
> picking this up should have everything they need to contribute immediately.

---

## 🔑 Project Identity

- **Site:** Ashlyn & Jeffrey Paine's wedding website
- **Wedding date:** September 26, 2026
- **Venue:** Davis & Grey Farms, 2975 CR 1110, Celeste, TX 75423
- **GitHub:** https://github.com/cheetahjp/the-paine-wedding (public repo)
- **Production URL:** https://www.thepainewedding.com (Vercel — auto-deploys from `main`)
- **Vercel project:** `prj_DABsrDtW4OBQCaaOKHrojfO1dVJr` / org `team_mivyuF1xTTkf7ieeeuXoxaJF`
- **Supabase project ref:** `khqmbphkdmexkknzvtgb`
- **Owner:** Jeff Paine — `jeffreyraypaine@gmail.com`

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 with `@theme` custom variables in `globals.css` |
| Database | Supabase (PostgreSQL) — free Hobby tier |
| Deployment | Vercel (auto-deploys from `main` branch on GitHub) |
| Fonts | Bodoni Moda + Montserrat via `next/font/google` in `layout.tsx` |
| Images | `next/image` — `images.unsplash.com` and `plus.unsplash.com` whitelisted in `next.config.ts` |

> **Font note:** Both `main` and all worktrees use `next/font/google`. The old `<link>` tag approach is gone.
> Font utilities (`.font-heading`, `.font-body`) are in `@layer utilities` in `globals.css` — intentional for Tailwind v4 compatibility with `next/font` CSS variables.

---

## 📁 Key File Locations

```
src/
├── app/
│   ├── layout.tsx                  # Root layout, next/font/google setup, nav
│   ├── page.tsx                    # Homepage / hero
│   ├── our-story/page.tsx          # Story timeline (uses StoryImage client component)
│   ├── wedding-details/page.tsx    # Ceremony/reception details, map, schedule
│   ├── schedule/page.tsx           # Day-of schedule
│   ├── bridal-party/page.tsx       # Wedding party (placeholder names — needs real data)
│   ├── games/page.tsx              # QR-style games hub
│   ├── games/crossword/page.tsx    # Mini crossword route (unlocks one week before wedding)
│   ├── games/trivia/page.tsx       # Couple trivia game route
│   ├── games/painedle/page.tsx     # Daily Painedle word game route
│   ├── travel/page.tsx             # Hotels, travel tips
│   ├── registry/page.tsx           # Registry links (Amazon + Target)
│   ├── faq/page.tsx                # FAQ cards
│   ├── attire/page.tsx             # Dress code / attire guide
│   ├── rsvp/page.tsx               # Full RSVP flow (4-step wizard)
│   ├── api/
│   │   ├── admin/auth/route.ts     # Server-side password validation
│   │   ├── games/submit-score/route.ts     # Server-side score submission
│   │   ├── games/validate-word/route.ts    # Server-side word validation for Painedle
│   │   └── games/trivia-questions/route.ts # Public GET — non-archived questions
│   └── admin/
│       ├── page.tsx                # Admin dashboard — RSVP only (metrics, guest table, bulk import)
│       ├── games/page.tsx          # Games admin control room
│       └── security/page.tsx       # Admin login tracking
├── components/
│   ├── ui/
│   │   ├── Section.tsx             # Standard page section wrapper
│   │   ├── StoryImage.tsx          # "use client" wrapper for Image with onError fallback
│   │   └── MobileNav.tsx           # Hamburger drawer navigation
│   ├── games/
│   │   ├── CoupleTriviaGame.tsx    # Client-side 3-screen trivia experience
│   │   ├── MiniCrosswordGame.tsx   # Client-side mini crossword (194 daily puzzles, timer, scoring)
│   │   ├── CrosswordGate.tsx       # Unlock gating wrapper for crossword
│   │   ├── PainedleGame.tsx        # Client-side daily Wordle-style game
│   │   ├── GameAccountPanel.tsx    # Persistent browser profile (username/email)
│   │   ├── ScoreSubmissionForm.tsx # Score submission form after game completion
│   │   ├── LeaderboardPanel.tsx    # Top-score leaderboard display
│   │   └── GamesHubClient.tsx      # Public games hub — three game cards
│   ├── admin/
│   │   ├── GamesAdminPanel.tsx     # Games control panel with modal drill-down views
│   │   └── ContentAdminPanel.tsx   # Content management (site_settings editor)
│   └── layout/
│       ├── Navbar.tsx              # Desktop + mobile nav shell
│       └── Footer.tsx              # Footer component
└── lib/
    ├── wedding-data.ts             # ⭐ STATIC source of truth for all wedding content
    ├── site-settings.ts            # ⭐ SERVER-ONLY — fetches `site_settings` table from Supabase
    │                               #    and merges overrides onto wedding-data.ts
    │                               #    Exports: getWeddingData(), getSettingsMap()
    ├── supabase.ts                 # Client-side Supabase client (anon key)
    └── games/
        ├── crossword.ts            # 194 daily crossword puzzles (RAW_PUZZLES array + buildPuzzle helper)
        │                           # ⚠️ Generated by scripts/generate-crosswords.mjs — do NOT hand-edit
        ├── trivia-questions.ts     # 10 trivia questions (static — future: load from Supabase)
        ├── word-list.ts            # 310-word Painedle answer bank (5-letter only)
        │                           # Runtime guards: throws on duplicates, throws if < 200 words, throws if non-5-letter
        ├── painedle.ts             # Daily sequential rotation + scoring helpers
        │                           # Anchor: 2026-03-08 = "sparkle"; each day advances one slot
        ├── schedule.ts             # Trivia + crossword unlock date/countdown helpers
        ├── leaderboard.ts          # Score submission + leaderboard fetch helpers
        └── admin-types.ts          # Shared admin type definitions
scripts/
└── generate-crosswords.mjs        # One-time generator for 194 crossword puzzles
                                    # Outputs TypeScript to replace RAW_PUZZLES in crossword.ts
supabase/
├── migrations/
│   ├── 0000_schema.sql
│   ├── 20260307000000_add_rsvp_fields.sql
│   ├── 20260308010000_add_game_leaderboards.sql
│   ├── 20260315000000_add_dietary_restrictions.sql  # ⚠️ NOT YET APPLIED
│   ├── 20260315010000_default_page_visibility.sql   # ⚠️ NOT YET APPLIED
│   ├── 20260315020000_trivia_questions.sql          # ⚠️ NOT YET APPLIED
│   └── 20260315030000_rsvp_history.sql             # ⚠️ NOT YET APPLIED
└── seed_guest_list.sql             # Round 1: 178 guests / 85 households (applied to Supabase)
public/
├── A&J_Box.svg                     # Box monogram logo (used as favicon)
├── A&J.svg                         # Inline monogram (used in mobile navbar)
└── images/
    ├── hero/                       # JeffAshlyn-7977 2.jpg
    ├── story/                      # First round.jpg, A&M Game(Reunion).jpg, Lake.jpg, NYC.jpg,
    │                               # Hammock.jpg, Photographers.jpg, San Antonio.jpg,
    │                               # Fredricksburg.jpg, Proposal.jpg
    ├── bridal-party/
    │   ├── Bridesmaids/            # Paige.jpg, Shelvy.jpg, Izzy.jpg, Alondra.jpg, Megan.jpg, Brynn.jpg, Emma.jpg
    │   └── Groomsmen/              # John.jpg, Hudson.jpg, Roman.jpg, Justin.jpg, Duncan.jpg, Collin.jpg, Blake.jpg
    ├── attire/                     # Womens Outfit 1–12, Mens Outfit 1–9 (.jpg/.png)
    ├── venue/
    └── rsvp/                       # Photos used in RSVP masonry backdrop
```

---

## 🗄 Database Schema (Supabase)

### `households`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | auto-generated |
| `name` | TEXT UNIQUE | e.g. "The Smith Family" |
| `created_at` | TIMESTAMP | |

### `guests`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | auto-generated |
| `household_id` | UUID FK | → `households(id)` |
| `first_name` | TEXT | |
| `last_name` | TEXT | |
| `suffix` | TEXT | optional |
| `nicknames` | TEXT | optional, used for fuzzy RSVP search |
| `plus_one_allowed` | BOOLEAN | default false |
| `attending` | BOOLEAN/NULL | NULL = pending, true = yes, false = no |
| `meal_choice` | TEXT | optional (hidden — no per-guest selection needed) |
| `food_allergies` | TEXT | used for dietary restrictions in RSVP |
| `dietary_restrictions` | TEXT | per-guest dietary info — **migration NOT yet applied** |
| `song_request` | TEXT | |
| `advice` | TEXT | |
| `created_at` | TIMESTAMP | |

### `admin_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `password_used` | TEXT | which password was used to log in |
| `created_at` | TIMESTAMP | |

### `game_players`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `email` | TEXT UNIQUE | normalized lowercase |
| `username` | TEXT | display name |
| `created_at` / `updated_at` | TIMESTAMP | |

### `game_scores`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `player_id` | UUID FK | → `game_players(id)` |
| `game` | TEXT | `trivia`, `painedle`, or `crossword` |
| `puzzle_key` | TEXT | date key or `wedding-day-trivia` |
| `score` | INTEGER | |
| `max_score` | INTEGER/NULL | |
| `attempts` | INTEGER/NULL | |
| `solved` | BOOLEAN/NULL | |
| `metadata` | JSONB | device, locale, timezone, platform, IP |
| `created_at` / `updated_at` | TIMESTAMP | |

### `rsvp_history` *(migration NOT yet applied)*
Append-only audit log. One row per guest per RSVP submission.
Fields: `id`, `guest_id`, `household_id`, `recorded_at`, `attending`, `food_allergies`, `song_request`, `advice`.

### `trivia_questions` *(migration NOT yet applied)*
Fields: `id`, `prompt`, `answer_a/b/c/d`, `correct_index`, `fun_fact`, `sort_order`, `archived`, `created_at`, `updated_at`.

> **⚠️ RLS is currently DISABLED.** Guest data is publicly readable with the anon key.

---

## 🌐 Environment Variables

`.env.local` (never committed, already configured in Vercel):
```env
NEXT_PUBLIC_SUPABASE_URL=https://khqmbphkdmexkknzvtgb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-side only — used by site-settings.ts
ADMIN_PASSWORD_MASTER=<master password>
ADMIN_PASSWORD_1=<password1>
ADMIN_PASSWORD_2=<password2>
ADMIN_PASSWORD_3=<password3>
ADMIN_PASSWORD_4=<password4>
ADMIN_PASSWORD_5=<password5>
```

> `SUPABASE_SERVICE_ROLE_KEY` is required for `site-settings.ts`. Without it, all content falls back to `wedding-data.ts` defaults (safe degradation, not a crash).

---

## 🧠 wedding-data.ts — The Content Config

**`src/lib/wedding-data.ts` is the most important file for content work.**

Pages import from `getWeddingData()` in `site-settings.ts`, which merges Supabase `site_settings` overrides onto `WEDDING`/`IMAGES` from `wedding-data.ts`.

Key top-level keys:
- `WEDDING.couple` — `names: 'Ashlyn & Jeffrey'` (**canonical display order**)
- `WEDDING.date` — Sept 26 2026, RSVP deadline Aug 1 2026
- `WEDDING.venue` — Davis & Grey Farms, Celeste TX; ceremony 5:00 PM, send-off 10:00 PM
- `WEDDING.story[]` — Our Story timeline (9 real items with photos)
- `WEDDING.bridalParty` — 7 bridesmaids (Paige Bimmerle MOH) + 7 groomsmen (John Paine Best Man)
- `WEDDING.hotels[]` — 6 real hotels (3 Greenville, 2 McKinney, 1 Farmersville Airbnb)
- `WEDDING.mealOptions[]` — intentionally empty (Urban Crust pizza — no per-guest selection)
- `WEDDING.registry[]` — Amazon: `https://www.amazon.com/wedding/share/ThePaineWedding`; Target: `https://www.target.com/gift-registry/gift/ThePaineWedding`

---

## 🎨 Design System

**Vibe:** Minimal, elegant, romantic, editorial — "fine art wedding"

**Colors (defined in `globals.css`):**
```
--color-primary:        #1A3F6F   (Lighter navy)
--color-secondary:      #7A1F24   (Burgundy)
--color-accent:         #C69A72   (Tan / warm gold)
--color-base:           #FFFFFF   (White)
--color-surface:        #F7F5F0   (Warm cream — NOT cold neutral gray)
--color-text-primary:   #0F1720   (Near-black)
--color-text-secondary: #3F5B7A   (Slate blue)
--color-text-light:     #FFFFFF
```

**Typography:**
- `font-heading` → `--font-playfair` → Bodoni Moda (700/800/900)
- `font-body` → `--font-inter` → Montserrat
- `.font-amp` → Bodoni Moda italic 700 — used for the `&` in "Ashlyn & Jeffrey"

**Shared CSS utilities (globals.css):**
- `.surface-panel` / `.surface-inset` — rounded, stroked, diffused, cream gradient cards
- `.page-fade-up` — bottom-up reveal animation
- `rsvp-scroll-up` / `rsvp-scroll-down` keyframes — RSVP masonry backdrop drift

---

## 🎮 Games System

### Painedle
- Daily word game (Wordle-style), 5-letter words only
- Anchor: `2026-03-08` = `sparkle`; each day advances one slot
- 310-word answer bank in `src/lib/games/word-list.ts`
- Persistent browser profile via `GameAccountPanel`

### Couple Trivia
- 10 questions, unlocks on wedding day
- Static in `trivia-questions.ts`; future CRUD via `trivia_questions` Supabase table (migration pending)

### Mini Crossword
- 194 daily puzzles covering March 17 – September 26, 2026
- Unlocks one week before the wedding
- Each puzzle is a 5×5 grid using 4 templates (A/B/C/D) with black squares
- Words are 3–5 letters, wedding/couple-themed when possible, common English words otherwise
- **Timer with start overlay and pause button**
- **Auto-check toggle** — optional real-time letter feedback
- Score submission to leaderboard on solve

#### Crossword generator (`scripts/generate-crosswords.mjs`)
- Runs with `node scripts/generate-crosswords.mjs > /tmp/puzzles-out.txt`
- Outputs TypeScript to paste into `crossword.ts` replacing `RAW_PUZZLES`
- Word pool: WORD_CLUES (470 themed) + FILL_CLUES (~1100 curated) + EXTRA_FILL (~280 additional) + system dict (~5000+ filtered)
- System dict filter: lowercase-only (no proper nouns), ≥1 vowel, no 3+ consonant runs, not in BLOCKED_WORDS
- 3-tier solver: tier1=wedding words, tier2=all curated words, tier3=system dict — front-loaded per slot
- 14-puzzle word reuse cooldown
- **⚠️ Clue quality issue (Session 22):** Some system dict words fall through to generic clues ("English word", "Four-letter word"). Fix in progress — see Session 22 notes.

---

## 🌿 Branch / Worktree State

| Branch | Location | Status |
|---|---|---|
| `main` | `/Users/jeffpaine/Documents/Antigravity/ThePaineWedding/` | Production — deployed to Vercel |
| `claude/dazzling-wozniak` | `.claude/worktrees/dazzling-wozniak/` | Active dev worktree |

---

## ✅ WHAT HAS BEEN BUILT (Completed)

### Infrastructure
- [x] Next.js 16 App Router project scaffolded and deployed to Vercel
- [x] Supabase connected with full schema
- [x] 178 guests / 85 households seeded (Round 1 — live)
- [x] `src/lib/wedding-data.ts` — central content config
- [x] `src/lib/site-settings.ts` — server-side Supabase override layer
- [x] `game_players` + `game_scores` tables migrated and applied

### Pages (all live)
- [x] Homepage / hero — with Registry CTA section and Quick Details grid with personality copy
- [x] Our Story — alternating timeline with real photos and descriptions
- [x] Wedding Details — venue, map embed, schedule, Urban Crust Food & Drinks card
- [x] Schedule — day-of timeline with per-item scroll reveal
- [x] Bridal Party — real photos, placeholder copy
- [x] Travel — real hotel data, Google Maps embed, airport cards, DFW guide, McKinney guide
- [x] Registry — brand-colored Amazon + Target cards
- [x] FAQ — fully built, cards layout
- [x] Attire — tabbed Ladies/Gentlemen masonry moodboard
- [x] Games hub — three stacked cards (Painedle live, Crossword ~1wk before, Trivia day-of)
- [x] Painedle — live, 5-letter daily word game
- [x] Mini Crossword — 194 daily puzzles, timer with start overlay + pause, auto-check toggle, leaderboard submit
- [x] Couple Trivia — locked until wedding day
- [x] RSVP — 4-step wizard with progress bar and masonry photo backdrop
- [x] Admin Dashboard — RSVP metrics, sortable guest table, bulk importer, History tab (pending migration)
- [x] Games Admin — crossword preview, trivia bank, score logs, player directory
- [x] Security Admin — login tracking

### RSVP Flow
- [x] 4-step wizard: Find Invitation → Who's Coming → A Few More Things → All Set!
- [x] Levenshtein fuzzy search on both first AND last name
- [x] Per-guest dietary_restrictions (using `food_allergies` column — live)
- [x] Song request + advice
- [x] Append-only `rsvp_history` audit log (migration pending)
- [x] Returning visitor memory via localStorage — pre-fills step 4 on revisit
- [x] Make changes flow — re-fetches from DB and allows re-submit

### Admin
- [x] Server-side password auth
- [x] Sortable guest columns (grouped by household when sorting by household)
- [x] Extras tab: dietary_restrictions / food_allergies, song_request, advice — **shown inline within household grouping**
- [x] History tab (pending `rsvp_history` migration)
- [x] Bulk importer from Google Sheets paste
- [x] In-page visual edit mode (Master role only) via `AdminEditBar.tsx`

### Design
- [x] Elegant ampersand via `.font-amp` in Navbar + homepage hero
- [x] Hero focal point `center 25%`
- [x] A&J box monogram as favicon, A&J SVG in mobile navbar
- [x] `surface-panel` / `surface-inset` shared card styles
- [x] Active nav state styling (desktop + mobile)
- [x] Per-item scroll reveal on schedule timeline
- [x] RSVP masonry photo backdrop with slow drift

---

## ⏳ WHAT NEEDS REAL CONTENT

- [ ] Ceremony/cocktail/reception exact times (venue confirmed 5 PM ceremony start)
- [ ] Full day-of schedule with exact times
- [ ] Dress code copy (ladies + gentlemen)
- [ ] Parking and shuttle details
- [ ] Google Maps iframe embed `src` for Davis & Grey Farms
- [ ] Real bridal party names, roles, descriptions
- [ ] Favicon — Ashlyn is making a logo → replace `public/favicon.ico`
- [ ] OG image → `public/images/engagement/og-image.jpg`
- [ ] Honeymoon fund URL (if applicable)

---

## 🔜 FEATURES TO BUILD (Prioritized)

### High priority
- [x] **Crossword clue quality** — generator fully rewritten with dictionary expansion + curated clues (Session 28); 194 unique grids, max word freq 15, ~83% curated clues
- [ ] **Apply pending Supabase migrations** (run in SQL editor in order):
  1. `20260315000000_add_dietary_restrictions.sql`
  2. `20260315010000_default_page_visibility.sql`
  3. `20260315020000_trivia_questions.sql`
  4. `20260315030000_rsvp_history.sql`
- [ ] **Round 2 guest seed** — 192 guests / 103 households generated but not applied (blocked on schema gaps)
- [ ] **RSVP edit/update flow** — guests can't currently find and change their RSVP
- [ ] **FAQ accordion** — collapse/expand instead of all stacked
- [ ] **CSV export** in admin dashboard
- [ ] **RSVP deadline countdown** on RSVP page

### Medium priority
- [ ] **Countdown timer** on homepage
- [ ] **Custom 404 page**
- [ ] **OG / social meta tags** (needs real OG image)
- [ ] **Supabase RLS** — enable Row Level Security on `guests`
- [ ] **Attire color swatches**
- [ ] **Accessibility audit**

---

## 🐛 KNOWN QUIRKS

- **Fonts:** `next/font/google`, CSS vars in `@layer utilities` (not `@theme`) — intentional Tailwind v4 workaround
- **Supabase anon key:** Readable in client bundle — RLS should be enabled
- **`food_allergies` vs `dietary_restrictions`:** RSVP saves to `food_allergies` (live column). `dietary_restrictions` migration hasn't been applied. Using `food_allergies` everywhere to avoid breakage.
- **Painedle anchor:** `2026-03-08` = `sparkle`. Changing word bank order changes all future daily words.
- **Trivia questions are static:** Full CRUD requires `trivia_questions` migration to be applied.
- **Crossword generator:** `scripts/generate-crosswords.mjs` produces 194 puzzles. Output goes into `crossword.ts` as `RAW_PUZZLES`. Never hand-edit `crossword.ts` — re-run the generator instead.
- **Crossword clue quality:** Some system dict words still get generic clues ("English word", "Four-letter word"). Fix in progress via EXTRA_FILL expansions + BLOCKED_WORDS. See Session 22.
- **Admin cookies:** Shared-domain `thepainewedding.com` scoped. After any auth change deploy, admin must log in fresh.
- **site-settings.ts:** Server-only. Without `SUPABASE_SERVICE_ROLE_KEY`, gracefully falls back to `wedding-data.ts`.

---

## 📋 SESSION LOG

### Sessions 1–3 (Feb–Mar 2026)
- Scaffolded full Next.js project, built all pages, RSVP flow, Admin, Supabase schema, deployed to Vercel

### Session 4 (Mar 7)
- Merged all worktree work into `main`; created `wedding-data.ts`; seeded 178 guests; deployed

### Session 5 (Mar 8)
- Fixed `/our-story` crash (StoryImage client component); created `AI_COLLAB.md`

### Session 6 (Mar 8)
- Added `/games` hub, Couple Trivia, Painedle with localStorage persistence

### Session 7 (Mar 8)
- Supabase `game_players` + `game_scores` tables; leaderboard submission; trivia lock + countdown

### Session 8 (Mar 8)
- Added Games to main nav; redesigned games pages; upgraded admin Games into real control panel with modals

### Session 9 (Mar 8)
- Expanded Painedle to 4/5/6/7-letter words; real-word validation API; persistent browser game profiles; split admin IA

### Session 10 (Mar 8)
- Fixed Painedle keyboard bug hijacking Backspace/letters in form fields

### Session 11 (Mar 8)
- Compact account summary bar for GameAccountPanel

### Session 12 (Mar 8)
- True sequential daily rotation for Painedle; expanded word bank to 310 words; runtime guardrails

### Session 13 (Mar 9)
- Planning session for Mini Crossword game

### Session 14 (Mar 10)
- Added Mini Crossword: `crossword.ts`, `/games/crossword`, `MiniCrosswordGame.tsx`, `CrosswordGate.tsx`; initial 8-word static puzzle; crossword admin in `GamesAdminPanel`

### Session 15 (Mar 10)
- Comprehensive AI_COLLAB.md update; confirmed Round 2 guest seed status; corrected color documentation

### Session 16 (Mar 12)
- Complete rebuild of `AdminEditBar.tsx`: inline text editing over live page regions, contextual image panels, crop tool as centered modal

### Session 16b (Mar 10 — Full Admin Edit Mode)
- `site-settings.ts` expanded with per-item overrides for story, FAQ, schedule, bridal party, registry, travel
- All page content tagged with `data-admin-key` attributes
- New client wrapper components: `StoryItem`, `AttireImage`, `PersonPortrait`

### Session 17 (Mar 15)
- RSVP fuzzy search upgrade (Levenshtein, both names, client-side)
- Per-guest dietary restrictions field
- Email notifications via Resend added (then removed in Session 18)
- Admin sortable guest table
- Wedding Details: Urban Crust food card
- Travel: full rewrite with real hotels, DFW guide
- Nav: mobile X button z-index fix
- Design: `.font-amp`, hero focal point fix
- DB migration: `dietary_restrictions` column (NOT YET APPLIED)

### Session 18 (Mar 15)
- Fixed admin logout bug (cookie deduplication via `headers.append`)
- RSVP 4-step wizard with `RSVPProgressBar`
- Removed Resend email notifications
- Fixed RSVP success screen

### Session 19 (Mar 15)
- `rsvp_history` migration (audit log)
- RSVP toggle deselect, dietary ✕ Remove, back from step 4, navy checkmark
- Returning visitor localStorage memory; Make changes flow
- Admin History tab

### Session 20 (Mar 15)
- Homepage: "Our Story" hero button, Registry CTA section, Quick Details personality copy
- Attire: white background, tighter padding
- Registry: brand-colored Amazon + Target cards
- Section component: added `"white"` background option
- GamesHubClient: removed jarring text drift animation

### Session 21 (Mar 15)
- Painedle locked to 5-letter words only; runtime guard throws on non-5-letter words
- `trivia_questions` Supabase table migration created (NOT YET APPLIED)
- `rsvp_history` migration recreated as `20260315030000_rsvp_history.sql` (NOT YET APPLIED)
- GameAccountPanel: removed verbose explanatory paragraph

### Session 22 (Mar 17)
- **Crossword clue quality fix (in progress)**
- Problem: Mini Crossword was showing clues like "dictionary word" / "English word" — obscure system dict words slipping into puzzles with no real clues
- Root cause 1: Many common English words (EAT, PAW, FEAR, HERO, LAMB, MELEE, EYRIE, etc.) were missing from FILL_CLUES
- Root cause 2: System dict contains thousands of obscure/foreign/archaic words (UTEES, USNEA, RAUPO, etc.) with no pattern-based clues
- Root cause 3: Curated pool needed A-Z validation (`/^[A-Z]+$/` check added to prevent hyphens/apostrophes crashing the letter-position index)
- Fixes applied to `scripts/generate-crosswords.mjs`:
  - Added `EXTRA_FILL` Batch 2: ~130 common words (EYRIE, MELEE, ANION, OPAL, SAGO, FEAR, HERO, LAMB, etc.) with real clues
  - Expanded `BLOCKED_WORDS`: ~400 obscure/foreign words blocked from pool
  - Added `/^[A-Z]+$/` validation when loading curated words into WORDS_BY_LEN
- Status: 194/194 puzzles still generating; generic clue rate dropped from original but still ~27% (522/1940 clue slots)
- **Next step:** Use ChatGPT to generate a larger batch of EXTRA_FILL entries + BLOCKED_WORDS additions, then paste into generator script, re-run, and update `crossword.ts`
- Also in this session:
  - Admin: guest table updated to show household grouping with song/advice/allergies inline; removed affiliation/side/likelihood columns
  - Crossword: added start overlay + pause button to timer
  - Crossword: fixed score submission, congrats screen, email copy, input behavior
  - Crossword: fixed letter visibility, added auto-check toggle
  - Registry: removed "Wishlist" eyebrow text from page header

### Session 23 (Mar 17)
- **Crossword generator hardening pass (still in progress)**
- Files touched:
  - `scripts/generate-crosswords.mjs`
  - `scripts/verify-crosswords.mjs`
  - `src/lib/games/crossword.ts`
- What changed:
  - Added a much larger `EXTRA_FILL` batch with many common 3/4/5-letter words and the requested clue coverage pass
  - Expanded the manual `BLOCKED_WORDS` list significantly
  - Added `AUTO_BLOCKED_WORDS` derived from leaked uncued words in generated puzzle output
  - Changed solver behavior so uncued system-dictionary words are only considered when a slot has zero explicitly-clued options
  - Added `scripts/verify-crosswords.mjs` to validate:
    - puzzle count
    - entry counts
    - intersection consistency
    - generic clue leakage
    - uncued word leakage
    - blocked-word hits
  - Regenerated `src/lib/games/crossword.ts`
- Verification status at end of session:
  - `npm run build` passes
  - generator still produces `194/194` puzzles
  - verifier reports:
    - `puzzleCount: 194`
    - `intersectionMismatchPuzzles: 0`
    - `blockedWordHits: 0`
    - `genericClues: 282`
    - `uncuedWords: 483`
- Interpretation:
  - The crossword bank is structurally valid now
  - The remaining problem is clue quality / rescue-fill leakage, not broken puzzle geometry
  - The pipeline is much better than before, but **not yet fully clean**
- Next AI should:
  1. run `node scripts/verify-crosswords.mjs`
  2. extract remaining uncued words from the current generated bank
  3. split them into:
     - acceptable/common words to add to `EXTRA_FILL`
     - obscure/foreign/archaic words to add to the blocklist
  4. regenerate `src/lib/games/crossword.ts`
  5. repeat until verifier reaches:
     - `genericClues: 0`
     - `uncuedWords: 0`

### Session 24 (Mar 17)
- **Crossword launch-clean pass completed**
- Final crossword files:
  - `scripts/generate-crosswords.mjs`
  - `scripts/verify-crosswords.mjs`
  - `src/lib/games/crossword.ts`
- Final generator behavior:
  - system dictionary fill is now intentionally disabled for shipped puzzle generation
  - generator runs from the curated clue pool only
  - clue quality is enforced by `scripts/verify-crosswords.mjs`
  - cooldown was relaxed to `0` to ensure the curated-only bank can still generate all 194 puzzles
  - generation is slower now, but clean and reliable
- Final verification result:
  - `puzzleCount: 194`
  - `genericClues: 0`
  - `uncuedWords: 0`
  - `blockedWordHits: 0`
  - `intersectionMismatchPuzzles: 0`
  - `wrongEntryCountPuzzles: 0`
- Build result:
  - `npm run build` passes after the final crossword update
- Operational note:
  - Regeneration now takes noticeably longer because the bank is curated-only, but the resulting crossword set is launch-ready
- If a future AI touches crossword generation:
  1. update curated clues in `generate-crosswords.mjs`
  2. regenerate `src/lib/games/crossword.ts`
  3. run `node scripts/verify-crosswords.mjs`
  4. do not ship if verifier is non-zero on generic or uncued words

### Session 25 (Mar 17)
- **Final readiness verification completed**
- Reason for this pass:
  - user asked to finish every remaining crossword requirement and leave the project in a documented ready-to-ship state
  - this pass re-ran the live checks after Session 24 instead of relying on earlier output
- Commands re-run:
  - `node scripts/verify-crosswords.mjs`
  - `npm run build`
- Current verification result:
  - `puzzleCount: 194`
  - `explicitClueWords: 2822`
  - `blockedWordCount: 1470`
  - `genericClues: 0`
  - `uncuedWords: 0`
  - `blockedWordHits: 0`
  - `intersectionMismatchPuzzles: 0`
  - `wrongEntryCountPuzzles: 0`
- Current build result:
  - `npm run build` passes cleanly
- Ship status:
  - crossword content quality is clean
  - crossword structure is clean
  - generated crossword bank is present in `src/lib/games/crossword.ts`
  - no additional crossword cleanup work is required for launch
- Future maintenance plan:
  1. treat `scripts/generate-crosswords.mjs` as the source of truth
  2. only regenerate `src/lib/games/crossword.ts` from the script
  3. always run `node scripts/verify-crosswords.mjs` after any clue-bank edit
  4. only ship crossword changes when verifier stays at zero for generic clues, uncued words, blocked hits, and mismatches

### Session 26 (Mar 17)
- **Production deployment completed for crossword cleanup**
- Why this was needed:
  - user reported the live site still showed old generic crossword clues after the local cleanup work was finished
- Deployment action:
  - ran `vercel --prod --yes`
  - production deployment created:
    - `https://the-paine-wedding-p0ktnr8p6-jeffreyraypaine-7939s-projects.vercel.app`
  - Vercel aliased production to:
    - `https://www.thepainewedding.com`
- Post-deploy live check:
  - fetched `https://thepainewedding.com/games/crossword`
  - confirmed the live page response no longer exposed the old generic clue strings that were present before the deployment
- Interpretation:
  - if a browser still shows the old crossword clues after this point, treat it first as stale client/browser cache and hard-refresh before debugging code

### Session 28 (Mar 22)
- **Crossword admin panel redesign + word/clue export utility**
- User feedback: the crossword preview modal was "old style and so much bigger than it needs to be"
- Files changed:
  - `src/components/admin/GamesAdminPanel.tsx`
  - `scripts/export-crossword-words.mjs` (new — one-time utility)
- Admin panel change:
  - removed the three large `OverviewMetric` cards at the top; replaced with a compact inline status bar (pill + key + clue count)
  - replaced the full-width board preview + side-by-side oversized clue cards with a 2-col layout matching the front-end design language
  - board: same dark-blue gradient, same cell style (`rounded-[0.4rem] border-white/20 bg-white/80`), fills left column
  - clue cards: `rounded-xl bg-[#f9f6f1] px-3 py-2.5`, answer label in `text-accent` (gold), clue text below — matches game UI
  - overall footprint is roughly half the vertical space of the old design
- Word/clue export script:
  - `node scripts/export-crossword-words.mjs` → prints JSON array of `{word, clue}` pairs sorted alphabetically
  - useful for passing to ChatGPT to review/improve clue quality
  - extracts from `src/lib/games/crossword.ts` RAW_PUZZLES using regex
- SOP reminder captured: always deploy after code changes, always update AI_COLLAB.md
- Verification:
  - `npx tsc --noEmit` passes
  - tested in browser — compact layout renders correctly at desktop width
  - deployed to production with `vercel --prod --yes`
  - production alias updated to `https://www.thepainewedding.com`

### Session 29 (Mar 22)
- **Crossword redesigned to proper NYT-style 5×5 grid — deployed**
- User feedback: the old 5×7 tic-tac-toe hash grid was fundamentally wrong; showed user screenshots of NYT Mini Crossword as the target layout
- Files changed (main branch committed and deployed):
  - `src/lib/games/crossword.ts` — new `RawWordEntry[]` flexible format, 194 puzzles in 5×5 with Templates A/B/C/D
  - `src/components/games/MiniCrosswordGame.tsx` — 3-panel layout (grid | across | down), no border-column filter
  - `src/components/admin/GamesAdminPanel.tsx` — admin board preview with crossword catalog (194 puzzles), save/restore, proper 5×5 preview
  - `src/app/(main)/games/crossword/page.tsx` — passes `puzzle` prop correctly, "Ten clues" copy
  - `src/app/api/admin/crossword-puzzles/route.ts` — admin save-overrides API (new)
- Layout: header (title + timer + Pause/Autocheck/Reveal/Clear) → active clue bar → flex row (grid left | across+down right as 2-sub-cols)
- Grid: proper 5×5, black corner squares, words 3–5 letters, 10 clues per puzzle
- Admin catalog: sidebar lists all 194 puzzles by date; click to select; board preview shows solved board in dark blue with answers; Restore/Save buttons
- "Six clues" updated to "Ten clues" in overlay and page header copy
- Worktree synced: all files copied from main into `claude/dazzling-wozniak`
- TypeScript: `npx tsc --noEmit` passes clean
- Deployed: `vercel --prod --yes` → aliased to `https://www.thepainewedding.com`

### Session 27 (Mar 18)
- **Crossword interaction + leaderboard reliability pass completed**
- User-reported issues:
  - typing on iPhone felt sticky because replacing an existing letter often required tapping backspace first
  - cursor movement did not skip past already-filled crossing letters during entry
  - crossword completion flow said `Could not submit score right now.`
- Files changed:
  - `src/components/games/MiniCrosswordGame.tsx`
  - `src/components/games/ScoreSubmissionForm.tsx`
  - `supabase/migrations/20260318010000_allow_crossword_scores.sql`
- Gameplay fixes shipped:
  - typing a new letter now replaces the current letter directly
  - programmatic focus now selects the whole cell value so overwrite-on-type works better on mobile
  - entry advance now skips over already-filled cells in the active answer instead of getting hung up on them
  - manual edits still work by tapping a filled square and typing a replacement
- Leaderboard fix shipped:
  - found a schema mismatch: application code allowed `crossword`, but the `game_scores` database check constraint still allowed only `trivia` and `painedle`
  - added and pushed a Supabase migration to update the `game_scores` constraint to allow `crossword`
  - error handling in `ScoreSubmissionForm` now shows the real server message instead of always collapsing to a generic failure string
- Verification:
  - `npm run build` passes
  - `supabase db push` completed successfully for `20260318010000_allow_crossword_scores.sql`
  - deployed to production with `vercel --prod --yes`
  - production alias updated to `https://www.thepainewedding.com`

### Session 28 (Mar 25)
- **Supabase wedding-project security hardening completed**
- What triggered this:
  - Supabase Security Advisor flagged `RLS Disabled in Public` on:
    - `public.households`
    - `public.guests`
    - `public.admin_logs`
    - `public.game_scores`
    - `public.game_players`
    - `public.rsvp_history`
- Root cause:
  - the wedding app originally used several browser-side Supabase queries directly against public tables
  - because those tables had no RLS, the Security Advisor correctly flagged them as publicly accessible
- Fix strategy:
  - moved risky wedding-table access behind server routes that use the service role key
  - enabled RLS on the flagged wedding tables
  - added `service_role` policies for those tables so app functionality still works through server routes
- Files added/updated:
  - `src/lib/server/supabase-admin.ts`
  - `src/app/api/games/leaderboard/route.ts`
  - `src/app/api/rsvp/search/route.ts`
  - `src/app/api/rsvp/household/route.ts`
  - `src/app/api/rsvp/submit/route.ts`
  - `src/app/api/admin/game-scores/route.ts`
  - `src/app/api/admin/security-logs/route.ts`
  - `src/app/api/admin/rsvp-history/route.ts`
  - `src/app/api/admin/guests/route.ts`
  - `src/app/api/admin/auth/route.ts`
  - `src/lib/games/leaderboard.ts`
  - `src/app/(main)/rsvp/page.tsx`
  - `src/app/(main)/admin/page.tsx`
  - `src/app/(main)/admin/games/page.tsx`
  - `src/app/(main)/admin/security/page.tsx`
  - `supabase/migrations/20260325090000_enable_rls_on_wedding_tables.sql`
- Verification and rollout:
  - `npm run build` passes
  - `supabase db push` applied `20260325090000_enable_rls_on_wedding_tables.sql`
  - deployed to production with `vercel --prod --yes`
  - production alias updated to `https://www.thepainewedding.com`
- Operational note:
  - Supabase Security Advisor may need a manual refresh / rerun before the warnings disappear from the dashboard UI

### Session 29 (Mar 25)
- **Supabase advisor cleanup pass completed**
- Follow-up issue:
  - Security Advisor no longer showed errors, but still showed:
    - warnings for mutable function search paths on:
      - `public.update_updated_at_column`
      - `public.update_site_settings_timestamp`
    - info note for `public.site_settings` having RLS enabled with no explicit policy
- Fix applied:
  - added `20260325093000_harden_functions_and_site_settings_policy.sql`
  - replaced both trigger functions with versions that set `search_path = public`
  - added explicit `service_role` full-access policy for `public.site_settings`
- Verification:
  - `supabase db push` applied successfully
- Operational note:
  - no app deploy was needed for this pass because the changes were database-only

### Session 30 (Mar 28)
- **Admin guest-management feature pass completed**
- User need:
  - backend/admin system needed first-class support for:
    - editing guest names
    - adding guests
    - removing guests
    - assigning added guests to households
- What changed:
  - wired the existing `GuestEditDrawer` into the admin guest dashboard
  - guest name cells now open the drawer in edit mode
  - drawer-based save path supports name edits and existing guest updates
  - drawer-based delete path removes guests through `/api/admin/guests`
  - added an `Add Guest` form directly in the admin guests view
  - add form accepts household name plus guest fields and creates the household if needed
  - add form uses household autocomplete from current household names
- Files updated:
  - `src/app/(main)/admin/page.tsx`
  - `src/components/admin/GuestEditDrawer.tsx`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production alias updated to `https://www.thepainewedding.com`

### Session 31 (Mar 28)
- **Admin RSVP badge state fix completed**
- Bug:
  - manually changing a guest from `Viewed` back to `Pending` could get visually stuck because `attending` was cleared but `viewed_rsvp` stayed `true`
- Fix:
  - updated admin RSVP save logic so selecting `Pending` explicitly clears `viewed_rsvp`
  - updated the bulk household RSVP path to keep `viewed_rsvp` aligned with the selected status
- Files updated:
  - `src/app/(main)/admin/page.tsx`
  - `src/app/api/admin/guests/route.ts`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production alias updated to `https://www.thepainewedding.com`

### Session 32 (Mar 28)
- **Admin plus-one role editing fix completed**
- Bug:
  - the admin drawer exposed `plus_one_allowed`, but the visible `+1` chip on the guest list is driven by `is_plus_one`
  - result: a guest could still look like a plus-one even after editing the other plus-one fields
- Fix:
  - added a `Guest role` control in `GuestEditDrawer`
  - saving a guest as a primary guest now clears `plus_one_for_id` and resets `plus_one_claimed`
  - drawer save now persists the real plus-one role fields, not just the allowance/reference fields
- Files updated:
  - `src/components/admin/GuestEditDrawer.tsx`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production alias updated to `https://www.thepainewedding.com`

### Session 33 (Mar 28)
- **Admin household-name editing completed**
- User need:
  - admin needed the ability to rename households directly, not just edit the guests inside them
- Fix:
  - added an editable `Current household` name field to `GuestEditDrawer`
  - drawer save now sends both `household_id` and `household_name` when updating a guest
  - admin guest API now updates the matching household record before persisting guest-field edits
  - admin page state now propagates a renamed household name across all locally loaded guests in that same household so the table updates immediately
- Files updated:
  - `src/components/admin/GuestEditDrawer.tsx`
  - `src/app/api/admin/guests/route.ts`
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-3ntsp7v13-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 34 (Mar 28)
- **Admin plus-one household sync fix completed**
- Bug:
  - changing `Plus-one allowed` in the guest drawer only updated the primary guest flag
  - the visible plus-one row in the main admin table is a separate guest record, so turning the flag off did not remove that row
  - turning the flag on did not recreate a missing linked plus-one row
- Fix:
  - admin guest PATCH logic now loads the current guest and synchronizes linked plus-one guest rows when `plus_one_allowed` changes
  - turning `plus_one_allowed` off now deletes any linked plus-one guest records for that primary guest
  - turning `plus_one_allowed` on now creates a placeholder plus-one guest record in the same household if one does not already exist
  - if an unclaimed plus-one record already exists, its placeholder name is refreshed from the admin reference name when available
  - admin page save flow now refetches guest data after drawer save so the table immediately reflects added/removed plus-one rows
- Files updated:
  - `src/app/api/admin/guests/route.ts`
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-bvoadc2wm-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 35 (Mar 28)
- **Admin household reassignment and unnamed plus-one UX completed**
- User need:
  - admin needed to move individual guests into different households directly from the guest drawer
  - unnamed plus-ones needed to behave like true placeholders instead of looking like fixed named guests
- Fix:
  - added a `Move guest to household` field to `GuestEditDrawer`
  - move field accepts an existing household name or a new household name and reassigns the guest on save
  - moving a primary guest now also moves any linked plus-one guest rows into the same target household
  - added a `Do not know plus-one name yet` checkbox in the drawer for primary guests with plus-one access
  - when that checkbox is used, the admin reference name is cleared and the linked plus-one row is converted to a generic placeholder instead of a fake personal name
  - admin table now renders generic unclaimed placeholder plus-ones as `Plus One`
  - admin save flow continues to refetch guest data after save so move/add/remove changes are immediately reflected in the table
- Files updated:
  - `src/components/admin/GuestEditDrawer.tsx`
  - `src/app/api/admin/guests/route.ts`
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-ixg6le3ws-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 36 (Mar 28)
- **Admin guest list sticky controls and scroll-preservation completed**
- User need:
  - admin guest list should stop jumping back to the top after edits
  - edit controls and list headings needed to remain reachable while scrolling long guest lists
- Fix:
  - updated `fetchData` in the admin RSVP page to support silent refreshes with preserved `window.scrollY`
  - drawer save and add-guest refresh paths now use the preserved-scroll refresh mode instead of a full loading-state reset
  - made the guest-list top action bar sticky so tabs and actions like `Edit` / `Done` remain visible while scrolling
  - made the guest/history table headers sticky so guest list category headings remain visible lower in the page
- Files updated:
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-bfbmf9tjl-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-n9gl0cxmp-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 37 (Mar 28)
- **Unknown plus-one checkbox visibility fix completed**
- Bug:
  - the `Do not know plus-one name yet` checkbox only showed for primary guests with `plus_one_allowed = true`
  - when admin clicked the actual linked plus-one guest row, the checkbox was missing even though that was the natural place to mark it unnamed
- Fix:
  - guest drawer now recognizes unnamed placeholder plus-one rows
  - added a plus-one-row-specific checkbox label: `Do not know this plus-one's name yet`
  - when checked on a plus-one guest row, the drawer now saves that guest back to the generic placeholder identity used by the admin table and RSVP flow
- Files updated:
  - `src/components/admin/GuestEditDrawer.tsx`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-7wn1y587q-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 38 (Mar 28)
- **Admin sticky-header regression fix completed**
- Bug:
  - the first sticky implementation pinned both the action strip and table headers
  - that caused visual overlap and broken layout in the admin guest list
- Fix:
  - removed the sticky table-header approach entirely
  - rebuilt the sticky behavior as a single sticky admin control strip that contains:
    - the `Guests / History` tabs
    - the guest actions (`Add Guest`, `Group by Household`, `Edit` / `Done`)
    - the guest search field
    - the edit-mode helper text when edit mode is active
  - kept the preserved-scroll refresh behavior so edits stop snapping the page back to the top
- Files updated:
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-6xutucdij-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 39 (Mar 28)
- **Household plus-one attachment layout completed**
- User need:
  - plus-one guests in grouped household view needed to look clearly attached to the person they belong with
- Fix:
  - added household guest ordering logic that renders primary guests first and then places linked plus-one guests immediately after their `plus_one_for_id` primary guest
  - added a companion label for plus-one rows in grouped household view, e.g. `With Macie Redell`
  - slightly increased plus-one row indentation so the relationship reads visually as subordinate/attached instead of just another unrelated household member
- Files updated:
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-6a2hiea92-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 40 (Mar 28)
- **Sticky admin control strip structural fix completed**
- Bug:
  - sticky control strip still was not sticking correctly
  - root cause: the sticky element lived inside the table card container that had `overflow-hidden`, which prevented normal sticky behavior
- Fix:
  - moved the sticky strip outside the overflow-clipped content region while keeping the lower card content rounded/clipped separately
  - left the preserved-scroll refresh behavior intact
- Files updated:
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-q6fxva75e-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 41 (Mar 28)
- **RSVP guest-facing wording cleanup completed**
- User need:
  - solo invites should not be titled like `The ___ Family`
  - RSVP search confirmation should not expose internal `household` terminology to guests
- Fix:
  - added guest-facing RSVP display-title logic:
    - single primary guest -> use the guest's full name
    - multiple primary guests -> use the cleaned shared invite/family label
  - updated step 2 subtitle copy:
    - singles: `Let us know if you'll be joining us.`
    - groups: `Let us know who from your party will be joining us.`
  - removed the `Household:` line from the confirmation card
  - for multi-guest invites, confirmation card now simply says guests included with them will appear on the next page
  - returning-user confirmation state now uses the same guest-facing display title instead of the raw household label
- Files updated:
  - `src/app/(main)/rsvp/page.tsx`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-hbq0cngik-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 42 (Mar 28)
- **Plus-one to primary conversion consistency fix completed**
- Bug:
  - converting a linked plus-one guest into a primary guest could leave inherited plus-one fields behind
  - result: the converted guest could still appear to have their own plus one, and the former primary guest relationship was not fully detached
- Fix:
  - guest drawer now resets inherited plus-one fields immediately when role changes from `plus_one` to `primary`
  - admin guest PATCH logic now treats `plus_one -> primary` as a special conversion path:
    - forces `plus_one_allowed = false`
    - clears `plus_one_name`
    - clears `plus_one_for_id`
    - resets `plus_one_claimed`
  - if the converted guest was the only linked plus-one for a former primary guest, the former primary guest is also detached from stale plus-one state by clearing:
    - `plus_one_allowed`
    - `plus_one_name`
- Files updated:
  - `src/components/admin/GuestEditDrawer.tsx`
  - `src/app/api/admin/guests/route.ts`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-56o6go6gq-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 43 (Mar 28)
- **Sticky admin band now includes column labels**
- User need:
  - once the sticky admin strip was working, the column labels still stayed behind in the non-sticky table header
- Fix:
  - added guest-table column labels into the sticky control band for desktop layouts
  - added matching history-table column labels into the sticky band for desktop layouts
  - kept the original table headers as mobile-only fallbacks so the table still has structure on smaller screens
- Files updated:
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-3reh0pooh-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 44 (Mar 28)
- **Admin guest search is now a toggleable control with inline clear**
- User need:
  - the guest search field should not always be open
  - search should open from a compact icon/button next to the other sticky admin controls
  - once text is entered, there should be a quick `X` to clear the query
- Fix:
  - replaced the always-visible guest search row with a toggleable `Search` control in the sticky admin action bar
  - added auto-focus so the search input is ready immediately when opened
  - added an inline clear button on the right side of the input whenever a search term exists
  - made the search row stay visible while a query is active so filters cannot be hidden accidentally
  - hiding the search from the action button clears the active filter at the same time
- Files updated:
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes

### Session 45 (Mar 28)
- **Admin add-guest row now wraps cleanly instead of clipping the save button**
- User need:
  - the add guest controls were getting cut off in the admin table card at common desktop widths
- Fix:
  - changed the add-guest form grid to use a responsive layout:
    - 2 columns on medium widths
    - 5 columns on large widths
    - full single-row layout only at extra-large widths
  - moved the save button to span the full row on medium/large widths so it always stays visible
- Files updated:
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-bgwc94r6f-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 46 (Mar 28)
- **RSVP history now tracks views, groups duplicate household submissions, and supports unread/search behavior**
- User need:
  - history should record simple RSVP views, not only status changes
  - repeated household submission rows should collapse into one top row with a `+N` expansion for the rest of the household members
  - history needed its own search workflow, unread highlighting, and better alignment with the sticky column labels
- Fix:
  - extended `rsvp_history` with:
    - `event_type`
    - `actor_guest_id`
    - `event_group_id`
  - backfilled old history rows into grouped submission batches so older duplicate submissions can also collapse in the admin UI
  - RSVP search now returns `matchedGuestId`
  - RSVP view tracking now inserts `viewed` history events with the initiating guest when known
  - RSVP submit now stamps submission history rows with the initiating guest and a shared batch/group id
  - admin history route now returns enough relationship data to show grouped events with household labels
  - admin history UI now:
    - groups duplicate same-session household submissions into one row
    - shows the initiating guest on top with a `+N` expansion for the rest
    - supports history search with the same toggle/clear pattern as the guest table
    - shows blue unread highlighting for newly seen history groups until the tab is opened
    - lets a row click clear its unread state immediately
    - uses aligned sticky history columns with an `Activity` column that supports both `Viewed RSVP` and submission states
- Files updated:
  - `supabase/migrations/20260329000100_rsvp_history_events.sql`
  - `src/app/api/rsvp/search/route.ts`
  - `src/app/api/rsvp/viewed/route.ts`
  - `src/app/api/rsvp/submit/route.ts`
  - `src/app/api/admin/rsvp-history/route.ts`
  - `src/app/(main)/rsvp/page.tsx`
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes
  - `supabase db push` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-g382oyzpv-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 47 (Mar 28)
- **Confirmed old RSVP history still exists; added export tools for guests and raw history**
- Investigation:
  - verified directly against the live Supabase table that old RSVP history rows were not deleted
  - current production `rsvp_history` still contains 12 raw rows
  - grouped history UI was compressing multiple per-household submission rows into fewer visible event rows, which made it look like older history disappeared
- Fix:
  - added `Export CSV` for the guest table
  - added `Export CSV` for the history tab
  - history export downloads raw history rows, not just the grouped display rows
  - added a history summary line that explicitly says how many grouped events are being shown from how many raw history rows
- Files updated:
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - confirmed live `rsvp_history` raw row count directly in Supabase: `12`
  - `npm run build` passes
  - deployed to production with `vercel --prod --yes`
  - production deployment: `https://the-paine-wedding-mv6awozdr-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to `https://www.thepainewedding.com`

### Session 48 (Mar 28)
- **History columns are now actually sortable like the guest table**
- User need:
  - the history header labels were clickable, but the rows themselves were still rendering from the unsorted grouped history list
  - the history tab needed the same end-to-end sort behavior as the guest table, including mobile header support
- Fix:
  - wired the history table body to render `sortedHistoryGroups` instead of the unsorted filtered list
  - kept the desktop sticky history labels sortable
  - added matching clickable sort controls to the mobile history table headers
  - preserved the existing default behavior of sorting history by `When` descending on first load
- Files updated:
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes

### Session 49 (Mar 28)
- **Restored admin history loading after the dual-guest foreign key schema change**
- Root cause:
  - the admin history API was still selecting `guests(...)` from `rsvp_history`
  - after adding `actor_guest_id`, `rsvp_history` now has two foreign keys to `guests`
  - Supabase/PostgREST started rejecting the ambiguous embed, so the history route returned no data even though the raw rows still existed
- Fix:
  - changed the admin history route to explicitly embed the submission guest relation with:
    - `guests:guests!rsvp_history_guest_id_fkey(...)`
  - kept the household embed intact so the grouped history UI still has the household label it expects
- Files updated:
  - `src/app/api/admin/rsvp-history/route.ts`
- Verification:
  - verified directly against the live Supabase project that `rsvp_history` still contains rows
  - verified the corrected query returns live history rows again
  - `npm run build` passes

### Session 50 (Mar 28)
- **History tab badge now reflects live unread items instead of total raw history rows**
- User need:
  - clearing/reading a history item should decrement the top `History` badge immediately
  - the previous badge was misleading because it always showed the raw history row count
- Fix:
  - changed the history tab badge to use `historyUnreadIds.length`
  - badge now behaves like a live unread counter and disappears once everything has been seen
- Files updated:
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes

### Session 51 (Mar 28)
- **Removed temporary explanatory banners from the history UI**
- User feedback:
  - transient implementation/helper copy was being rendered permanently in the interface
  - this made the UI feel redundant, fake, and less professional
- Fix:
  - removed the history helper banner about unread behavior
  - removed the grouped/raw history summary banner
  - kept the functionality, but moved the explanation burden out of the product UI
- Guardrail:
  - do not add temporary diagnostic, implementation-explaining, or reassurance copy into the frontend/admin UI unless it is an intentional permanent product requirement
  - operational notes belong in chat, handoff docs, or internal documentation, not as persistent interface chrome
- Files updated:
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build` passes

### Session 52 (Mar 29)
- **Prelaunch hardening pass: page visibility, RSVP access integrity, rate limiting, and admin write-surface tightening**
- Planning:
  - created a code-grounded launch-readiness assessment in:
    - `PRELAUNCH_RISK_ASSESSMENT_AND_IMPLEMENTATION_PLAN.md`
  - used that doc as the implementation order for the security/integrity work instead of taking isolated bug fixes one at a time
- Visibility / public route enforcement:
  - expanded admin-controlled page visibility so it is no longer just a couple of manually-gated pages
  - added dynamic public nav/footer filtering using the `site_settings` visibility flags
  - added a server wrapper for `/rsvp` so it can actually 404 when hidden
  - added a `/games` layout gate so the entire games section inherits the same visibility enforcement
  - added `requirePageVisible(...)` to the remaining managed public pages
- Request hardening:
  - added root `middleware.ts` to block cross-site mutation requests for:
    - `/api/admin/*`
    - `/api/rsvp/search`
    - `/api/rsvp/submit`
    - `/api/rsvp/viewed`
    - `/api/games/submit-score`
  - this is the shared CSRF-style/origin protection layer for the high-risk mutation surfaces
- Database-backed rate limiting:
  - added `public.api_rate_limits`
  - added `public.consume_rate_limit(...)`
  - wired rate limiting into:
    - admin login
    - RSVP search
    - RSVP household resume fetch
    - RSVP viewed logging
    - RSVP submit
    - game score submit
- RSVP integrity hardening:
  - replaced raw household-ID resume/edit access with signed RSVP access tokens
  - RSVP search now returns a signed access token tied to the matched primary guest + household
  - `/api/rsvp/household`, `/api/rsvp/viewed`, and `/api/rsvp/submit` now verify that token instead of trusting raw IDs from the browser
  - improved RSVP name normalization to better handle punctuation/spacing/diacritics
  - added duplicate-name ambiguity protection so exact or near-exact collisions do not silently resolve to the “top guess”
  - added optimistic concurrency protection for RSVP writes:
    - `guests.updated_at`
    - per-guest version snapshots from the client
    - submit rejects with a refresh-required conflict if the invitation changed mid-session
  - tightened plus-one submit rules so a plus one cannot attend if the inviting guest is not attending
- Admin/content hardening:
  - `site-settings` route now only accepts a bounded allowlist of known setting keys/patterns
  - large/abusive setting payloads are rejected
  - image uploads now validate:
    - file type
    - file size
    - storage path sanitization
- Games hardening:
  - added rate limiting to score submission
  - added basic display-name moderation / format validation for leaderboard usernames
- Guest data integrity:
  - guest creation now trims/validates key fields and blocks exact duplicate guests inside the same household
  - deleting a primary guest now also removes any linked plus-one rows instead of leaving orphaned plus ones behind
- Files updated:
  - `PRELAUNCH_RISK_ASSESSMENT_AND_IMPLEMENTATION_PLAN.md`
  - `middleware.ts`
  - `supabase/migrations/20260329010000_request_hardening.sql`
  - `src/lib/page-visibility.ts`
  - `src/components/layout/Navbar.tsx`
  - `src/components/layout/Footer.tsx`
  - `src/app/(main)/layout.tsx`
  - `src/app/(main)/games/layout.tsx`
  - `src/app/(main)/our-story/page.tsx`
  - `src/app/(main)/bridal-party/page.tsx`
  - `src/app/(main)/travel/page.tsx`
  - `src/app/(main)/attire/page.tsx`
  - `src/app/(main)/faq/page.tsx`
  - `src/app/(main)/games/page.tsx`
  - `src/app/(main)/registry/page.tsx`
  - `src/app/(main)/rsvp/page.tsx`
  - `src/app/(main)/rsvp/RSVPPageClient.tsx`
  - `src/lib/server/request-security.ts`
  - `src/lib/rsvp/access-token.ts`
  - `src/lib/rsvp/name-matching.ts`
  - `src/app/api/admin/auth/route.ts`
  - `src/app/api/admin/guests/route.ts`
  - `src/app/api/admin/page-visibility/route.ts`
  - `src/app/api/admin/site-settings/route.ts`
  - `src/app/api/admin/upload-image/route.ts`
  - `src/app/api/games/submit-score/route.ts`
  - `src/app/api/rsvp/search/route.ts`
  - `src/app/api/rsvp/household/route.ts`
  - `src/app/api/rsvp/viewed/route.ts`
  - `src/app/api/rsvp/submit/route.ts`
- Verification:
  - `npm run build` passes locally after the hardening changes
  - `supabase db push` applied:
    - `20260329010000_request_hardening.sql`
  - deployed to production with `vercel --prod --yes`
  - production deployment:
    - `https://the-paine-wedding-k441kfkw1-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to:
    - `https://www.thepainewedding.com`
- Remaining follow-up ideas (not blockers for this batch, but still worthwhile later):
  - add deeper validation/no-store consistency across the remaining admin routes
  - add stronger DB-level plus-one invariants/check constraints once production data is audited for compatibility
  - consider a stricter anti-enumeration strategy for RSVP search if guest-list privacy needs to be tightened further

### Session 53 (Mar 29)
- **Image performance pass with focus on slower connections and the RSVP scrolling photo section**
- Goal:
  - reduce the effective payload for the most image-heavy decorative surface on the site without changing the wedding look/feel more than necessary
- Findings:
  - the homepage hero was already on a good path with `next/image`
  - the real performance hotspot was the RSVP backdrop because it animates a large grid of portrait images at once
- What changed:
  - enabled more efficient image output formats in `next.config.ts`:
    - `image/avif`
    - `image/webp`
  - slightly lowered image quality on several major photography components where the current treatment still holds up visually:
    - hero
    - story images
    - bridal party portraits
    - attire images
  - added a repeatable optimization script:
    - `scripts/optimize-rsvp-gallery.sh`
    - `npm run images:rsvp-backdrop`
  - generated a dedicated lightweight RSVP backdrop asset set in:
    - `public/images/rsvp-optimized`
  - updated the RSVP backdrop in `src/app/(main)/rsvp/RSVPPageClient.tsx` to:
    - use the optimized RSVP image folder
    - use every other RSVP gallery image for the decorative backdrop so fewer photos are mounted/animated at once
    - use lower backdrop quality because the gallery is atmospheric and sits behind a dark overlay
- Measured impact:
  - original RSVP source gallery:
    - `public/images/rsvp` = `27M`
  - optimized decorative RSVP backdrop gallery:
    - `public/images/rsvp-optimized` = `9.1M`
  - sample file:
    - `JeffAshlyn-7611.jpg`
      - original ≈ `384K`
      - optimized ≈ `119K`
- Files updated:
  - `next.config.ts`
  - `package.json`
  - `scripts/optimize-rsvp-gallery.sh`
  - `src/app/(main)/rsvp/RSVPPageClient.tsx`
  - `src/components/ui/HeroImage.tsx`
  - `src/components/ui/StoryImage.tsx`
  - `src/components/ui/StoryItem.tsx`
  - `src/components/ui/PersonPortrait.tsx`
  - `src/components/ui/AttireImage.tsx`
  - `public/images/rsvp-optimized/*`
- Verification:
  - `npm run images:rsvp-backdrop`
  - `npm run build`
  - deployed to production with `vercel --prod --yes`
  - production deployment:
    - `https://the-paine-wedding-m4y5w7030-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to:
    - `https://www.thepainewedding.com`

### Session 54 (Mar 29)
- **Copy polish pass for Explore and Games page headings**
- User-facing copy changes:
  - changed the Explore page State Fair label from:
    - `Happening This Weekend`
  - to:
    - `Happening Wedding Weekend`
  - changed the Games page hero heading from:
    - `Games`
  - to:
    - `Paine Games`
  - kept the top-nav label as `Games`
- Files updated:
  - `src/app/(main)/explore/page.tsx`
  - `src/app/(main)/games/page.tsx`
- Verification:
  - `npm run build`
  - deployed to production with `vercel --prod --yes`
  - production deployment:
    - `https://the-paine-wedding-icutwa3s1-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to:
    - `https://www.thepainewedding.com`

### Session 55 (Mar 29)
- **Technical SEO and crawlability pass**
- Why:
  - Google ranking was being held back by a couple of real technical SEO gaps:
    - no real `robots.txt`
    - no real `sitemap.xml`
    - generic metadata leaking onto important subpages like `/games/painedle`
    - homepage title duplication / weak defaults
- What changed:
  - added reusable metadata helpers in:
    - `src/lib/seo.ts`
  - added real crawl files:
    - `src/app/robots.ts`
    - `src/app/sitemap.ts`
  - added a web manifest:
    - `src/app/manifest.ts`
  - cleaned up root metadata in `src/app/layout.tsx`:
    - better default title behavior
    - canonical support
    - manifest/icons wiring
    - stronger Open Graph / Twitter image wiring
    - structured data now uses a `WebSite` + `Event` graph
  - removed the old main-layout metadata override that was causing generic / duplicated title behavior:
    - `src/app/(main)/layout.tsx`
  - added page-level metadata for the key public routes:
    - home
    - our story
    - bridal party
    - travel
    - explore
    - attire
    - registry
    - faq
    - schedule
    - wedding details
    - rsvp
    - games hub
    - crossword
  - added segment metadata for client-rendered game routes:
    - `src/app/(main)/games/painedle/layout.tsx`
    - `src/app/(main)/games/trivia/layout.tsx`
  - added admin noindex protection:
    - `src/app/(main)/admin/layout.tsx`
  - added FAQ JSON-LD schema:
    - `FAQPage`
  - replaced the tiny-tab icon SVG with a much simpler branded monogram so the favicon is more legible at small sizes:
    - `src/app/icon.svg`
- Live checks after deploy:
  - `https://www.thepainewedding.com/robots.txt` now returns a real robots file
  - `https://www.thepainewedding.com/sitemap.xml` now returns a real sitemap with the public pages
  - homepage title now resolves cleanly as:
    - `Ashlyn & Jeffrey | The Paine Wedding`
  - Painedle now has page-specific metadata:
    - title: `Painedle | The Paine Wedding`
    - canonical: `/games/painedle`
    - dedicated description / keywords
- Files updated:
  - `src/lib/seo.ts`
  - `src/app/layout.tsx`
  - `src/app/robots.ts`
  - `src/app/sitemap.ts`
  - `src/app/manifest.ts`
  - `src/app/icon.svg`
  - `src/app/(main)/layout.tsx`
  - `src/app/(main)/page.tsx`
  - `src/app/(main)/our-story/page.tsx`
  - `src/app/(main)/bridal-party/page.tsx`
  - `src/app/(main)/travel/page.tsx`
  - `src/app/(main)/explore/page.tsx`
  - `src/app/(main)/attire/page.tsx`
  - `src/app/(main)/registry/page.tsx`
  - `src/app/(main)/faq/page.tsx`
  - `src/app/(main)/schedule/page.tsx`
  - `src/app/(main)/wedding-details/page.tsx`
  - `src/app/(main)/rsvp/page.tsx`
  - `src/app/(main)/games/page.tsx`
  - `src/app/(main)/games/crossword/page.tsx`
  - `src/app/(main)/games/painedle/layout.tsx`
  - `src/app/(main)/games/trivia/layout.tsx`
  - `src/app/(main)/admin/layout.tsx`
- Verification:
  - `npm run build`
  - deployed to production with `vercel --prod --yes`
  - production deployment:
    - `https://the-paine-wedding-kkgnagdyh-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to:
    - `https://www.thepainewedding.com`

### Session 56 (Mar 29)
- **Final hardening pass for the remaining collab handoff items**
- Why:
  - Session 52 intentionally left three worthwhile follow-ups for later:
    - deeper validation / no-store consistency across the remaining admin routes
    - stronger DB-level plus-one invariants once production data was ready
    - stricter RSVP anti-enumeration behavior
- What changed:
  - RSVP search no longer returns the full invitation payload up front:
    - `src/app/api/rsvp/search/route.ts`
    - search now returns only a minimal preview:
      - `matchedName`
      - `matchedGuestId`
      - `accessToken`
      - `primaryGuestCount`
      - optional household label for duplicate disambiguation
    - removed the old guest-name suggestions from failed searches
    - duplicate/near-duplicate matches still surface as explicit choices, but without shipping the full household guest payload in the search response
  - RSVP client now loads the invitation only after confirmation/selection:
    - `src/app/(main)/rsvp/RSVPPageClient.tsx`
    - the confirmation card is now based on `primaryGuestCount`
    - household data is fetched through the signed RSVP access token when the guest confirms
  - Remaining admin API routes were tightened for consistency:
    - switched the remaining read-heavy admin APIs to `noStoreJson(...)`
    - improved validation on trivia question creation
    - improved validation on crossword override saves
    - added missing error handling on page-visibility writes
  - Guest mutation hardening:
    - `src/app/api/admin/guests/route.ts`
    - guest API responses now return `Cache-Control: no-store`
    - added app-level validation so:
      - a plus-one guest must stay linked to a sponsoring guest
      - a primary guest cannot be assigned a `plus_one_for_id`
      - a guest cannot point at themselves as their own plus one
      - plus-one rows are normalized before update so they cannot quietly keep primary-only fields
  - Admin inline text editor XSS risk reduced:
    - `src/components/admin/AdminEditBar.tsx`
    - removed the raw `dangerouslySetInnerHTML` initialization path from the editor surface
    - rich-text content now passes through a small allowlist sanitizer before preview/save
  - Added DB-backed guest/plus-one invariants:
    - `supabase/migrations/20260329020000_guest_plus_one_invariants.sql`
    - migration:
      - removes duplicate plus-one rows per sponsoring guest
      - removes orphaned placeholder `Plus One` rows with no sponsor
      - promotes any named/claimed orphan plus-one rows back to normal guests instead of dropping data
      - normalizes contradictory primary/plus-one field combinations
      - adds a unique partial index enforcing one plus-one row per sponsoring guest
      - adds DB constraints for:
        - plus-one role consistency
        - no self-linking via `plus_one_for_id`
- Files updated:
  - `src/app/api/rsvp/search/route.ts`
  - `src/app/(main)/rsvp/RSVPPageClient.tsx`
  - `src/app/api/admin/game-scores/route.ts`
  - `src/app/api/admin/rsvp-history/route.ts`
  - `src/app/api/admin/security-logs/route.ts`
  - `src/app/api/admin/page-visibility/route.ts`
  - `src/app/api/admin/trivia-questions/route.ts`
  - `src/app/api/admin/crossword-puzzles/route.ts`
  - `src/app/api/admin/guests/route.ts`
  - `src/components/admin/AdminEditBar.tsx`
  - `supabase/migrations/20260329020000_guest_plus_one_invariants.sql`
- Verification:
  - `npm run build`
  - `supabase db push` applied:
    - `20260329020000_guest_plus_one_invariants.sql`
  - deployed to production with `vercel --prod --yes`
  - production deployment:
    - `https://the-paine-wedding-771knvj8d-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to:
    - `https://www.thepainewedding.com`

### Session 57 (Mar 29)
- **RSVP mobile copy cleanup**
- User feedback:
  - the RSVP search step still felt too wordy and redundant on mobile
  - the explanatory sentence under `RSVP` was unnecessary
  - the input placeholders repeated the visible field labels
- What changed:
  - removed the step-1 RSVP subtitle copy entirely
  - changed the search input placeholders from:
    - `Enter your first name`
    - `Enter your last name`
  - to:
    - `First name`
    - `Last name`
- Files updated:
  - `src/app/(main)/rsvp/RSVPPageClient.tsx`
- Verification:
  - `npm run build`
  - deployed to production with `vercel --prod --yes`
  - production deployment:
    - `https://the-paine-wedding-7lthjgg80-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to:
    - `https://www.thepainewedding.com`

### Session 58 (Mar 29)
- **RSVP input placeholder cleanup**
- User feedback:
  - once the labels already say `First Name` and `Last Name`, placeholders repeating the same words are unnecessary
- What changed:
  - removed the RSVP search-step placeholders entirely
  - kept the visible field labels for accessibility and clarity
- Files updated:
  - `src/app/(main)/rsvp/RSVPPageClient.tsx`
- Verification:
  - `npm run build`
  - deployed to production with `vercel --prod --yes`
  - production deployment:
    - `https://the-paine-wedding-jel4eu1p6-jeffreyraypaine-7939s-projects.vercel.app`
  - production alias updated to:
    - `https://www.thepainewedding.com`

### Session 59 (Mar 29)
- **Crossword mobile header and leaderboard polish**
- User feedback:
  - the mobile crossword header was too cramped
  - the timer was overlapping the title
  - action buttons were clipping on narrow screens
  - leaderboard copy should not mention reveals because public players are not using them
  - the in-card `Mini Crossword` heading was unnecessary and was taking space from the timer
- What changed:
  - removed reveal-count wording from crossword leaderboard row subtitles
  - changed the crossword leaderboard subtitle copy from reveal-focused wording to simple speed-focused wording
  - removed the in-card `Mini Crossword` heading from the live game header
  - reworked the crossword game header into a mobile-first two-row layout:
    - top row:
      - `Daily Puzzle` label
      - timer aligned right
    - second row:
      - action buttons wrap cleanly instead of clipping
  - tightened mobile button sizing and added `whitespace-nowrap` so labels stay intact while still fitting narrow widths
- Files updated:
  - `src/components/games/LeaderboardPanel.tsx`
  - `src/app/(main)/games/crossword/page.tsx`
  - `src/components/games/MiniCrosswordGame.tsx`
- Verification:
  - `npm run build`

### Session 60 (Mar 29)
- **Crossword mobile clue-jump fix**
- User feedback:
  - tapping crossword cells on iPhone was progressively jumping the page upward
  - first tap landed correctly, then subsequent taps kept scrolling higher
- Root cause:
  - the active clue auto-scroll effect was calling `scrollIntoView` on every clue change
  - on mobile Safari, that clue list scroll request was moving the whole page because the clue columns sit below the puzzle grid
- What changed:
  - disabled clue auto-scroll on mobile widths
  - kept the clue sync behavior on larger screens where it helps keyboard/mouse play
- Files updated:
  - `src/components/games/MiniCrosswordGame.tsx`
- Verification:
  - `npm run build`

### Session 61 (Mar 29)
- **Cross-page footer gap and bottom-spacing cleanup**
- User feedback:
  - multiple public pages were ending with awkward empty space before the footer
  - `attire` had a noticeable white bar / dead zone
  - `explore` and `games` still felt too roomy at the bottom
  - `bridal-party` showed a weird white gap
  - `our-story` also had a bit too much bottom space
- Root cause:
  - the shared footer had a hard `mt-20`, forcing an empty strip above it on every page
  - several last sections also had overly generous bottom padding
- What changed:
  - removed the shared top margin from the footer so pages can end naturally
  - tightened the bottom padding on the last content sections for:
    - `attire`
    - `registry`
    - `explore`
    - `games`
    - `bridal-party`
    - `our-story`
  - reduced a few oversized vertical gaps inside `bridal-party` / `our-story` so the pages feel more intentional overall
- Files updated:
  - `src/components/layout/Footer.tsx`
  - `src/app/(main)/attire/page.tsx`
  - `src/app/(main)/registry/page.tsx`
  - `src/app/(main)/explore/page.tsx`
  - `src/app/(main)/games/page.tsx`
  - `src/app/(main)/bridal-party/page.tsx`
  - `src/app/(main)/our-story/page.tsx`
- Verification:
  - `npm run build`

### Session 62 (Mar 29)
- **Crossword row-selection behavior fix**
- User feedback:
  - when selecting a row clue and then clicking another row cell higher in the grid, the crossword was incorrectly flipping into column mode
  - expected behavior should match the NYT-style pattern:
    - first click on a crossing square keeps the current direction when possible
    - only a true second click on the same already-focused square should toggle directions
- Root cause:
  - the click handler was treating a brand-new click like a repeat click because focus fired first and immediately marked the square as focused
- What changed:
  - added pointer-down tracking so only an actual repeat click on the same focused crossing square toggles directions
  - clicking a different crossing square now stays in row mode when the active direction is across
  - also removed the last public reveal-count phrasing from the crossword share text and solved-state copy
- Files updated:
  - `src/components/games/MiniCrosswordGame.tsx`
- Verification:
  - `npm run build`

### Session 63 (Mar 29)
- **Crossword solved overlay and cross-device player lock**
- User feedback:
  - the crossword congratulations state should behave like the initial blurred start overlay, on top of the puzzle window
  - if the same saved player profile already solved the daily crossword on one device, they should not be able to replay it on another device just because local browser storage is empty there
- What changed:
  - moved the congratulations state into a real in-window overlay over the crossword play area
  - kept the share / leaderboard submission area below as a separate post-game panel
  - added a new player-score lookup route:
    - `src/app/api/games/player-score/route.ts`
  - on crossword load, if the saved game profile already has a solved score for today’s puzzle:
    - the puzzle auto-locks
    - the solved overlay appears
    - the board is filled with the final solution
    - the score submission state is treated as already complete
- Files updated:
  - `src/components/games/MiniCrosswordGame.tsx`
  - `src/lib/games/leaderboard.ts`
  - `src/app/api/games/player-score/route.ts`
- Verification:
  - `npm run build`

### Session 64 (Mar 29)
- **Shared main-layout height cleanup**
- User feedback:
  - `travel` and `registry` still had too much empty space above the footer even after the page-level spacing trims
- Root cause:
  - the shared main layout still had `min-h-screen`
  - because the footer lives outside that main container, short pages were effectively being forced to render one full viewport of main content plus the footer below it
- What changed:
  - removed `min-h-screen` from the shared `(main)` layout container
  - kept `flex-grow` so pages still stretch naturally without forcing fake dead space on short routes
- Files updated:
  - `src/app/(main)/layout.tsx`
- Verification:
  - `npm run build`

### Session 65 (Mar 29)
- **Games profile sign-in flow**
- User feedback:
  - logging out of the games profile should not strand a player on a new browser/device
  - there needs to be a clear sign-up vs log-in path so returning players can restore their identity
  - this should pair with the cross-device crossword lock behavior
- What changed:
  - added a new game player profile lookup route:
    - `src/app/api/games/player-profile/route.ts`
  - updated the game profile utilities to fetch a saved player by email
  - rebuilt the games account panel into a two-path flow when no local profile is present:
    - `Sign Up`
    - `Log In`
  - `Log In` restores the saved player profile from the server by email and rehydrates local browser state
  - once restored, the cross-device crossword solved check can correctly treat that player as the same person on the new browser
- Files updated:
  - `src/app/api/games/player-profile/route.ts`
  - `src/lib/games/leaderboard.ts`
  - `src/components/games/GameAccountPanel.tsx`
- Verification:
  - `npm run build`

### Session 66 (Mar 29)
- **Crossword solved-state hold-to-view flow**
- User feedback:
  - the crossword congratulations state should keep the board and score area locked until the player deliberately reveals it
  - the completed state should not leave clickable controls exposed behind a half-open overlay
- What changed:
  - added a hold-to-reveal interaction on the solved overlay:
    - `Hold to view board`
  - while the solved state is still locked:
    - the puzzle window remains fully covered by the congratulations overlay
    - the post-game share / leaderboard submission panel stays hidden
    - top crossword controls like `Autocheck` and `Clear` are disabled so nothing can be interacted with behind the lock state
  - once the hold finishes:
    - the overlay dismisses
    - the filled board becomes visible again
    - the post-game actions become available
  - removed the duplicate lower congratulations treatment so the solve celebration is handled in one place instead of repeating it below
- Files updated:
  - `src/components/games/MiniCrosswordGame.tsx`
- Verification:
  - `npm run build`

### Session 67 (Mar 29)
- **Crossword solved-header cleanup**
- User feedback:
  - the solved-state header still felt too heavy
  - the timer was taking up too much room after completion
  - the old gameplay controls disappearing felt awkward in the locked solved state
- What changed:
  - tightened the solved-state header so the timer uses a more compact size once the puzzle is complete
  - hid the gameplay controls while the solved overlay is still locking the board, so the header reads as an intentional finished state instead of a broken gameplay state
  - kept the lower post-game area action-focused instead of repeating another congratulations treatment
- Files updated:
  - `src/components/games/MiniCrosswordGame.tsx`
- Verification:
  - `npm run build`

### Session 68 (Mar 29)
- **RSVP history viewed-event dedupe**
- User feedback:
  - the history tab was showing the same guest as having viewed RSVP multiple times in a row
  - repeated opens / refreshes should not spam the log with duplicate `Viewed RSVP` rows for the same invitation
- What changed:
  - updated the RSVP viewed endpoint so it only inserts a new `viewed` history row when the invitation is actually transitioning from unseen to seen
  - if a household has already been marked as viewed, additional viewed requests no longer create more history rows
  - updated the admin history grouping logic so same-day duplicate viewed events for the same guest / household collapse into one visible history item
- Files updated:
  - `src/app/api/rsvp/viewed/route.ts`
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build`

### Session 69 (Mar 29)
- **Crossword mobile clue visibility tuning**
- User feedback:
  - on iPhone, tapping cells in the last two crossword rows was still letting the page settle too low
  - the active clue / hint needed to remain visible even for the bottom-row cells
- What changed:
  - added a mobile-only viewport correction tied to crossword cell focus
  - the adjustment now protects the clue bar itself, not just the active cell, so the currently selected clue stays inside a safe visible band near the top of the screen
  - this is applied after mobile focus settles, which prevents the clue from being pushed out of view by iPhone keyboard scrolling on the bottom rows
- Files updated:
  - `src/components/games/MiniCrosswordGame.tsx`
- Verification:
  - `npm run build`

### Session 70 (Mar 29)
- **Games account panel polish**
- User feedback:
  - the newer game account UI felt too big / too loud compared with the rest of the site
  - the information can stay, but it should feel more restrained and consistent with the quieter direction of the recent games changes
- What changed:
  - tightened the game account panel card padding and heading scale so it no longer dominates the top of the games pages
  - simplified the account labeling from `Player Account` to `Player`
  - changed the unsigned states to shorter, more natural headings: `Sign up` and `Log in`
  - reduced the visual weight of the `Sign Up` / `Log In` segmented control
  - removed redundant placeholders from the account fields now that the visible labels already provide the needed context
  - shortened the save action label to `Save`
- Files updated:
  - `src/components/games/GameAccountPanel.tsx`
- Verification:
  - `npm run build`

### Session 71 (Mar 29)
- **Trivia bank reduced to final curated set**
- User direction:
  - replace the old 50-question trivia bank with the final curated launch shortlist
  - reduce repetitive / AI-sounding phrasing, especially the overuse of `Jeff and Ashlyn` and rigid labels like `during their 2024 reconnection`
- What changed:
  - replaced the existing trivia bank with the final 20 selected questions
  - rewrote the prompts into a more natural voice while keeping the intended answer keys
  - kept the question source-of-truth in the database so the public trivia game and the admin trivia bank stay in sync
- Files updated:
  - `supabase/migrations/20260329030000_trim_trivia_questions.sql`
- Verification:
  - `supabase db push`
  - `npm run build`

### Session 72 (Mar 30)
- **Mobile admin polish + feedback system**
- User direction:
  - clean up the next mobile round across admin, RSVP, home, bridal party, and games admin
  - make the admin RSVP controls behave better on phones: tabs should not stay sticky, action buttons should fit in one row, and history needed a real mobile treatment instead of clipped table cells
  - add a real feedback pipeline with a public form, footer link, admin inbox, and bot resistance
  - preserve the standing rule: no temporary diagnostic/helper copy leaking into the UI
- What changed:
  - admin mobile RSVP dashboard:
    - guest/history tabs are now static instead of sticky
    - only the controls/search/header rows stay sticky
    - mobile action buttons were condensed into icon buttons that fit in a single row
    - mobile stat cards now use shorter labels: `Total`, `Yes`, `No`, `Pending`
    - history got a dedicated mobile card layout to eliminate clipped/overlapping table text
  - games admin:
    - overview metrics now collapse into smaller cards with a 2-column mobile grid
    - large control cards were simplified and compacted
    - removed the redundant top-level `Reveal today's word` overview action in favor of schedule / bank access
  - public/mobile polish:
    - home hero makes RSVP the more prominent button and demotes `Our Story`
    - bridal party wording now uses `Jeff` in the bridal-party-specific copy/relationship labels
    - RSVP search fields now use placeholder-first behavior with reserved label space; labels fade in only for the field being typed into
    - mobile footer was tightened
    - floating admin edit bar was reduced on mobile and the extra hint copy was removed
  - feedback system:
    - added `feedback_messages` table with RLS + service-role-only access
    - added public `/feedback` page and `/api/feedback` submission route
    - added honeypot + timing check + rate limiting for bot resistance
    - added admin `/admin/feedback` inbox with unread/open/closed counts, message detail view, and admin notes
    - added footer feedback link
    - added lightweight app/global error screens with a direct feedback path
  - SEO/crawl consistency:
    - added `/feedback` to the sitemap
- Files updated:
  - `src/app/(main)/admin/page.tsx`
  - `src/components/admin/AdminFrame.tsx`
  - `src/components/admin/AdminEditBar.tsx`
  - `src/components/admin/GamesAdminPanel.tsx`
  - `src/app/(main)/rsvp/RSVPPageClient.tsx`
  - `src/app/(main)/page.tsx`
  - `src/app/(main)/bridal-party/page.tsx`
  - `src/components/layout/Footer.tsx`
  - `src/lib/page-visibility.ts`
  - `src/lib/wedding-data.ts`
  - `src/app/sitemap.ts`
  - `src/app/api/feedback/route.ts`
  - `src/app/api/admin/feedback/route.ts`
  - `src/components/feedback/FeedbackForm.tsx`
  - `src/app/(main)/feedback/page.tsx`
  - `src/app/(main)/admin/feedback/page.tsx`
  - `src/app/error.tsx`
  - `src/app/global-error.tsx`
  - `supabase/migrations/20260330010000_add_feedback_messages.sql`
- Verification:
  - `npm run build`

### Session 73 (Mar 30)
- **Fix RSVP submit crash for unknown-name plus-ones**
- User report:
  - public RSVP was throwing `null value in column "plus_one_claimed" of relation "guests" violates not-null constraint`
  - reproduced specifically when a guest claimed an unnamed placeholder plus-one during the RSVP flow
- Root cause:
  - `/api/rsvp/submit` was batching primary-guest rows and plus-one rows into a single `upsert`
  - plus-one rows included `plus_one_claimed`, but primary-guest rows did not
  - Supabase/PostgREST treated the batch as a mixed-shape insert/update set, which caused the primary rows to effectively send `plus_one_claimed = null` once a plus-one row was present in the same batch
- What changed:
  - made the RSVP guest update payload shape-safe across the whole batch by explicitly setting `plus_one_claimed: false` on primary-guest updates
  - made the `upsert` conflict target explicit with `onConflict: "id"` for clearer intent and safer behavior
- Files updated:
  - `src/app/api/rsvp/submit/route.ts`
- Verification:
  - `npm run build`

### Session 74 (Mar 30)
- **Fix RSVP submit check-constraint failure for claimed placeholder plus-ones**
- User report:
  - after the null-column fix, live RSVP submit was still failing with `guests_plus_one_role_consistency`
  - this was happening in the same real-world flow where a guest claimed an unnamed placeholder plus-one
- Root cause:
  - the RSVP submit batch was still too sparse for the stricter DB invariants
  - even with `plus_one_claimed` fixed, the plus-one row in the `upsert` was not carrying the full role-consistent shape (`is_plus_one`, `plus_one_for_id`, `plus_one_allowed`, `plus_one_name`)
  - mixed-shape `upsert` payloads are unsafe here because omitted columns can still interact badly with insert/update validation
- What changed:
  - primary-guest RSVP rows now explicitly include:
    - `is_plus_one: false`
    - `plus_one_for_id: null`
    - `plus_one_claimed: false`
    - preserved `plus_one_allowed` / `plus_one_name`
  - plus-one RSVP rows now explicitly include:
    - `is_plus_one: true`
    - `plus_one_for_id` sponsor id
    - `plus_one_claimed` based on whether the placeholder was named
    - `plus_one_allowed: false`
    - `plus_one_name: null`
  - this makes the whole RSVP submit batch internally consistent with the DB constraint before the write happens
- Files updated:
  - `src/app/api/rsvp/submit/route.ts`
- Verification:
  - `npm run build`
  - local regression check confirmed the RSVP batch shape satisfies `guests_plus_one_role_consistency`

### Session 75 (Mar 30)
- **Remove RSVP guest writes from `upsert` entirely**
- User report:
  - the real Alondra/Caden flow was still failing live, which meant the previous batch-shape hardening was not enough under the current Supabase/PostgREST write behavior
- Root cause:
  - even with the row payload made more explicit, this RSVP path is still fundamentally an update-only workflow
  - using `upsert` for existing invitation rows leaves room for insert-style validation edge cases against the plus-one invariants
- What changed:
  - replaced the RSVP guest batch `upsert` with direct per-guest `update(...).eq("id", id)` calls
  - kept the stronger explicit role fields from Session 74, so each row is both update-safe and invariant-safe
  - this removes insert-path ambiguity from the live RSVP submit flow
- Files updated:
  - `src/app/api/rsvp/submit/route.ts`
- Verification:
  - `npm run build`

### Session 76 (Mar 30)
- **Add admin history edit/delete controls**
- User request:
  - remove mistaken test runs from RSVP history
  - make history manageable in admin edit mode, including the ability to change stored history details if needed
- What changed:
  - added `PATCH /api/admin/rsvp-history` for admin-only history edits
  - added `DELETE /api/admin/rsvp-history` for admin-only history removal
  - history edits apply across the grouped raw rows behind the visible grouped event
  - history delete removes the grouped event’s backing raw rows
  - history tab now shows `Edit` / `Delete` actions in edit mode on both desktop and mobile
  - added a centered history editor modal with controls for:
    - recorded time
    - event type
    - activity/status
    - dietary
    - song
    - advice
- Files updated:
  - `src/app/api/admin/rsvp-history/route.ts`
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build`

### Session 77 (Mar 30)
- **Track RSVP edits separately from first-time submissions**
- User request:
  - history should show when guests are making changes to an RSVP, not just when they first submit it
- What changed:
  - added a new `updated` RSVP history event type
  - RSVP submit now marks an interaction as `updated` when that invitation has already been submitted before
  - first-time RSVP submissions still log as `submitted`
  - admin history now displays `Updated RSVP` distinctly in export, mobile cards, desktop table, and the history editor
  - admin history edit modal now supports `Updated RSVP` as a manual correction option too
- Files updated:
  - `src/app/api/rsvp/submit/route.ts`
  - `src/app/api/admin/rsvp-history/route.ts`
  - `src/app/(main)/admin/page.tsx`
  - `supabase/migrations/20260330020000_allow_updated_rsvp_history.sql`
- Verification:
  - `supabase db push`
  - `npm run build`

### Session 78 (Mar 30)
- **Fix claimed plus-one edit rehydration and show plus-one change summaries in history**
- User request:
  - returning RSVP edit flow made an already-filled plus-one look blank again
  - history should show specific RSVP changes like adding a plus one, not just a generic submitted/updated status
- Root cause:
  - the RSVP client rebuilt claimed placeholder plus-ones with `nameEdited: false`, so the edit UI treated them like untouched placeholders even when a real name had already been saved
  - RSVP history rows only tracked coarse event types, which hid the actual change that happened during an edit
- What changed:
  - claimed plus-ones now rehydrate with `nameEdited: true` in the RSVP client so saved plus-one names come back correctly in the edit flow
  - added `change_summary` to `rsvp_history`
  - RSVP submit now records human-readable change summaries when relevant, including:
    - `Added Plus One`
    - `Removed Plus One`
    - `Updated Plus One`
    - `Updated Plus One RSVP`
    - `Updated Plus One Dietary Info`
    - `Changed RSVP`
    - `Updated Song Request` / `Removed Song Request`
    - `Updated Advice` / `Removed Advice`
    - `Updated Dietary Info`
  - admin history now displays, searches, exports, and edits the new change summary field
  - `Viewed RSVP` edits in admin clear the change summary and RSVP-detail fields to stay internally consistent
- Files updated:
  - `src/app/(main)/rsvp/RSVPPageClient.tsx`
  - `src/app/api/rsvp/submit/route.ts`
  - `src/app/api/admin/rsvp-history/route.ts`
  - `src/app/(main)/admin/page.tsx`
  - `supabase/migrations/20260330030000_add_rsvp_history_change_summary.sql`
- Verification:
  - `supabase db push`
  - `npm run build`

### Session 79 (Mar 31)
- **Realign guest-table columns and make grouped household summaries consistent**
- User report:
  - admin guest table looked like song requests were missing or sitting under the wrong column
- Root cause:
  - the sticky desktop guest headers were using a custom grid layout, but the actual guest table was still allowing browser auto-sized columns
  - grouped household summary rows also omitted allergies entirely, which made the summary row feel inconsistent even when data existed
- What changed:
  - locked the desktop guest table to fixed column widths that match the sticky header widths
  - added a desktop `colgroup` so header labels and row cells stay aligned
  - grouped household summary rows now surface household-level allergies too, alongside song request and advice
  - added `break-words` handling to the text-heavy cells so long entries wrap more cleanly without making the table feel shifted
- Files updated:
  - `src/app/(main)/admin/page.tsx`
- Verification:
  - `npm run build`

### Session 80 (Mar 31)
- **Add RSVP email notifications and weekly view digest**
- User request:
  - phone-friendly notifications for RSVP activity, with immediate updates for real RSVP changes and a weekly digest for simple `Viewed RSVP` activity
- What changed:
  - added a Resend-backed RSVP notification helper
  - RSVP submit now sends an immediate email for `Submitted` and `Updated RSVP` events after the history rows are written
  - immediate emails include:
    - guest who triggered it
    - household name
    - RSVP summary
    - change summary (including plus-one changes when present)
    - song request / advice when present
  - added a protected cron route at `/api/cron/rsvp-history-digest`
  - added a weekly Vercel cron schedule for Monday mornings
  - weekly digest only covers `Viewed RSVP` rows that have not already been emailed
  - added `notification_sent_at` to `rsvp_history` so the system can avoid repeat notifications
- Files updated:
  - `src/lib/server/rsvp-notifications.ts`
  - `src/app/api/rsvp/submit/route.ts`
  - `src/app/api/cron/rsvp-history-digest/route.ts`
  - `vercel.json`
  - `supabase/migrations/20260331010000_add_rsvp_history_notification_sent_at.sql`
- Verification:
  - `supabase db push`
  - `npm run build`
- Follow-up config required:
  - set `RESEND_API_KEY`
  - set `RESEND_FROM_EMAIL`
  - set `RSVP_ALERT_EMAILS` (comma-separated) or `RSVP_ALERT_EMAIL`
  - set `CRON_SECRET`

### Session 81 (Apr 11)
- **Crossword puzzle regeneration — all 194 puzzles now unique**
- Problem: old generator produced only 95 unique word grids out of 194 puzzles; words like ATONE (20×), EATEN (19×) massively overused
- Root cause: curated word bank of ~1957 words was too small to create enough diverse valid grid completions (only 59 valid grids across 3 templates)
- Solution: expanded word bank by intersecting system dictionary (`/usr/share/dict/words`) with Google 20K frequency list, adding ~1500 common recognizable English words
- Generator rewritten (`scripts/generate-crosswords.mjs`):
  - Phase 1: pre-generates pool of 200 unique grids per template (C, B, A) using MRV backtracking with random seed words
  - Phase 2: assembles 194 puzzles from pools, with 8-puzzle word cooldown
  - Dictionary expansion filtered against offensive/name/obscure word blocklists
  - Auto-clue function for dictionary words (pattern-based + fallback "N letters")
  - Hundreds of curated clues added for commonly-appearing dictionary words
- Results:
  - 194 puzzles, all 194 unique grids
  - Max word frequency: 15 (REED)
  - 1606/1940 word entries have curated clues (~83%), rest have "N letters" fallback
  - `tsc --noEmit` passes clean
- Files changed:
  - `scripts/generate-crosswords.mjs` — full rewrite
  - `src/lib/games/crossword.ts` — lines 167-2698 replaced (RAW_PUZZLES array only)
- Files NOT changed: types, buildPuzzle(), buildCrossword(), renderer, date rotation, scoring
