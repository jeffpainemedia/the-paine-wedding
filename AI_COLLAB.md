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
- [ ] **Crossword clue quality** — finish generator fix (Session 22 started this); run final generator, paste output into `crossword.ts`, TypeScript check, deploy
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
