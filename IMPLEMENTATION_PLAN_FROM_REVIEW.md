# Implementation Plan From Website Review

This document translates the findings in [`site-review.html`](./site-review.html) into an execution-ready plan for Claude or any other coding agent working inside this repository.

## Review Context

The March 16, 2026 review gave the site an overall **B+**.

High-level conclusions from that review:

- The site already has a strong visual identity and does **not** feel templated.
- The strongest areas are branding, hero presentation, attire, RSVP atmosphere, and the personality added by the games section.
- The main items holding the grade back are:
  - important practical pages are not surfaced aggressively enough
  - some content areas still feel unfinished or “coming soon”
  - practical information pages are slightly less polished than the emotional/editorial pages
  - mobile spacing and utility clarity can still improve
  - backend/admin surfaces are functional but could be better hardened
  - lint/tooling behavior is noisy and appears to crawl generated worktree artifacts

The review specifically recommended:

- stronger paths to Wedding Details, Schedule, and FAQ
- removal of all visible “coming soon” seams before guest traffic ramps up
- higher visual emphasis on guest-essential logistics
- better mobile breathing room in RSVP and other dense views
- a more polished fallback for the Travel map area
- tighter lint scoping
- better admin/backend hardening over time

## Goal

Raise the site from a strong **B+** toward **A / A-** by making the utility layer as polished and unmistakable as the emotional layer, while tightening technical rough edges.

This plan is split into:

1. Quick wins
2. Medium-scope UX/content improvements
3. Heavier engineering hardening

Claude should treat items in earlier phases as higher priority unless the user explicitly reorders them.

## Working Rules For Claude

- Preserve the existing visual language. This site already has a strong style.
- Do not redesign for the sake of redesign.
- Improve discoverability, clarity, and readiness without flattening the brand personality.
- Prefer changes that help real guests complete real tasks quickly.
- Avoid removing the games/personality layer; keep it additive.
- If practical info conflicts with editorial elegance, favor the guest experience.
- Never remove or overwrite unrelated user changes.

## Recommended Execution Order

### Phase 1: Guest-Essentials Visibility

Objective:
Make it impossible for a guest to miss the core logistical pages and facts.

Primary files likely involved:

- `src/components/layout/Navbar.tsx`
- `src/components/layout/Footer.tsx`
- `src/app/(main)/page.tsx`
- `src/app/(main)/wedding-details/page.tsx`
- `src/app/(main)/schedule/page.tsx`
- `src/app/(main)/faq/page.tsx`

Tasks:

- Add stronger navigation or homepage access to:
  - Wedding Details
  - Schedule
  - FAQ
- Introduce a clear “Guest Essentials” or equivalent block on the homepage.
- Surface the highest-importance facts in a compact, scannable way:
  - date
  - venue
  - ceremony time
  - RSVP deadline
  - quick links to schedule, travel, attire, and FAQ
- Review whether Wedding Details and Schedule should appear in the main nav, footer, homepage, or a combination of those.
- Ensure practical pages feel intentional and first-class, not tucked away.

Success criteria:

- A first-time guest can find practical information within one click from the homepage.
- Wedding Details and Schedule feel like core pages, not secondary pages.
- The homepage remains attractive, but materially more useful.

## Phase 2: Remove “Still In Progress” Signals

Objective:
Eliminate visible cues that make the site feel unfinished.

Primary files likely involved:

- `src/app/(main)/wedding-details/page.tsx`
- `src/app/(main)/faq/page.tsx`
- `src/app/(main)/attire/page.tsx`
- `src/app/(main)/bridal-party/page.tsx`
- `src/app/(main)/schedule/page.tsx`
- `src/lib/wedding-data.ts`
- `src/lib/site-settings.ts`

Tasks:

- Audit all visible strings and conditions that produce:
  - “Coming Soon”
  - “Details coming soon”
  - “TBD”
  - similar placeholder states
- Replace placeholder copy with final copy where the actual content already exists.
- Where data genuinely is not finalized yet, improve the UX so the experience feels intentional:
  - reframe incomplete areas with softer, more confident language
  - hide incomplete sub-sections if they reduce trust
  - avoid obvious placeholder presentation on primary guest pages
- Specifically revisit:
  - pizza/menu placeholder in Wedding Details
  - any FAQ answers still resolving to placeholder copy
  - any attire fallback copy that feels temporary
  - any schedule or bridal-party fallback states that should be hidden or replaced

Success criteria:

- The public site no longer reads as “under construction.”
- Guests should not encounter raw `TBD`-style content on primary pages.
- Any incomplete information is presented gracefully and minimally.

## Phase 3: RSVP And Mobile Comfort Pass

Objective:
Make the highest-stakes flow feel easier on phones and more breathable overall.

Primary files likely involved:

- `src/app/(main)/rsvp/page.tsx`
- `src/components/layout/Navbar.tsx`
- `src/app/globals.css`
- Any shared UI wrappers used by RSVP

Tasks:

- Reduce visual crowding in the mobile RSVP experience.
- Review:
  - card width
  - step indicator spacing
  - headline size
  - input spacing
  - button size relative to viewport height
- Ensure the first screen of RSVP feels calm, obvious, and easy to act on.
- Review the mobile header/menu affordance for prominence and clarity.
- Check other dense mobile pages for similar breathing-room issues, especially:
  - Games hub
  - Attire
  - Travel

Success criteria:

- RSVP feels comfortable and obvious on a phone-sized viewport.
- No key interactive element feels cramped or overly dominant.
- Mobile header/navigation remains easy to notice and use.

## Phase 4: Travel Page Polish

Objective:
Bring the Travel page up to the same polish level as the site’s best-designed pages.

Primary files likely involved:

- `src/app/(main)/travel/page.tsx`
- `src/lib/wedding-data.ts`

Tasks:

- Improve the top-of-page map experience.
- Investigate whether the embedded map should use `wedding.venue.mapsEmbedSrc` instead of a hardcoded iframe source.
- Add a stronger visual fallback if the map embed underperforms or appears blank.
- Increase emphasis on hotel selection and guest decisions.
- Make the opening section feel a little more authoritative and less washed out.

Success criteria:

- The map section looks intentional even when embeds fail or render poorly.
- A guest quickly understands where to stay and how to get there.
- The Travel page feels as polished as Attire and RSVP.

## Phase 5: FAQ / Utility Page Design Pass

Objective:
Make practical pages feel as premium as showcase pages.

Primary files likely involved:

- `src/app/(main)/faq/page.tsx`
- `src/app/(main)/wedding-details/page.tsx`
- `src/app/(main)/schedule/page.tsx`
- shared components under `src/components/ui/`

Tasks:

- Consider converting FAQ into grouped sections or accordions.
- Review card styling and hierarchy on Wedding Details and FAQ.
- Strengthen visual differentiation between:
  - critical facts
  - descriptive supporting copy
  - optional detail
- Create a more unified design pattern for “practical info” pages.

Success criteria:

- The site’s utility pages feel deliberate, not merely functional.
- Important information is easier to scan.
- Design consistency improves without losing the existing identity.

## Phase 6: Tooling Cleanup

Objective:
Make project verification reliable and fast.

Primary files likely involved:

- `eslint.config.mjs`
- `.gitignore`
- any repo-level config that influences lint scope

Context:

During review, `npm run build` passed successfully. `npm run lint` did not return a clean result in a reasonable window because it appeared to traverse generated `.next` output in `.claude/worktrees/...`.

Tasks:

- Confirm what directories ESLint is scanning.
- Exclude generated/build/worktree artifacts as needed.
- Ensure `npm run lint` focuses on actual source files.
- Re-run lint after cleanup and verify it returns normally.

Success criteria:

- `npm run lint` completes in a normal amount of time.
- Generated artifacts and side-worktree output are not being linted.

## Phase 7: Admin / Backend Hardening

Objective:
Tighten trust and safety around editing and guest data flows.

Primary files likely involved:

- `src/lib/admin/session.ts`
- `src/app/api/admin/auth/route.ts`
- `src/app/api/admin/guests/route.ts`
- `src/app/api/admin/upload-image/route.ts`
- `src/app/api/rsvp/viewed/route.ts`
- `src/lib/site-settings.ts`
- `src/lib/page-visibility.ts`

Tasks:

- Review admin auth model for:
  - password-only access
  - session integrity
  - rate limiting opportunities
  - auditability
- Review public write surfaces, especially `api/rsvp/viewed`.
- Decide whether guest-view tracking should remain public, become signed, or be otherwise constrained.
- Improve observability where helpers currently fail quietly.
- Preserve the low-friction admin workflow while reducing accidental or trivial abuse risks.

Success criteria:

- Admin flows remain usable.
- Public mutation surfaces are better constrained.
- Silent failures are reduced.

## Suggested Claude Workflow

When Claude picks this up, use this workflow:

1. Read this file and `site-review.html`.
2. Inspect current implementation for Phase 1 and Phase 2 items first.
3. Make the smallest set of coherent changes that materially improve guest usability.
4. Verify changes visually and with project checks.
5. Move to the next phase only after the previous phase is in a good state.

## Suggested First Implementation Batch

If Claude should start immediately with the highest ROI work, do this batch first:

1. Add stronger navigation/homepage access to Wedding Details, Schedule, and FAQ.
2. Add a clear Guest Essentials block on the homepage.
3. Remove or soften visible placeholder / coming-soon language on core public pages.
4. Improve mobile RSVP spacing and hierarchy.
5. Fix lint scoping so verification is dependable.

This batch likely gives the biggest grade improvement for the least amount of risk.

## Validation Checklist

After each phase, Claude should validate:

- `npm run build`
- `npm run lint`
- desktop review of homepage, RSVP, Travel, Attire, Wedding Details, Schedule, FAQ
- mobile review of homepage, RSVP, Games, and any changed utility pages

Functional checks:

- main nav links work
- footer links work
- homepage practical CTAs work
- RSVP still functions end-to-end
- hidden-page logic still behaves as expected
- admin edit affordances are not accidentally broken by UI changes

## Definition Of Done

This plan is done when:

- the site surfaces practical information as confidently as it surfaces romance/storytelling
- public pages no longer feel unfinished
- mobile critical flows are calmer and easier to use
- utility pages are more premium and easier to scan
- lint/build verification is trustworthy
- backend/admin risks are reduced without breaking the content workflow

## Notes For Claude

- This site’s personality is an asset. Protect it.
- The project does not need a dramatic redesign.
- The best improvements here are not flashy. They are clarity, readiness, confidence, and trust.
