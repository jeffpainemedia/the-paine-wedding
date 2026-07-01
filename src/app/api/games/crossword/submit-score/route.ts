import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeCrosswordScore } from "@/lib/games/crossword-types";
import { getCrosswordPuzzleById, parseCrosswordOverrides } from "@/lib/games/crossword";
import { recordScore } from "@/lib/server/leaderboard-recorder";
import { enforceRateLimit, noStoreJson } from "@/lib/server/request-security";

const CROSSWORD_OVERRIDES_KEY = "games.crossword.overrides";

async function loadOverrides() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return {};
    try {
        const sb = createClient(url, key);
        const { data } = await sb
            .from("site_settings")
            .select("value")
            .eq("key", CROSSWORD_OVERRIDES_KEY)
            .maybeSingle();
        return parseCrosswordOverrides(data?.value);
    } catch {
        return {};
    }
}

// POST /api/games/crossword/submit-score
// Validates the submitted letters fully match the puzzle's answer key, then
// computes the score with the reveal/check penalties.
export async function POST(request: NextRequest) {
    const rl = await enforceRateLimit(request, {
        bucket: "game-submit-score",
        limit: 25,
        windowSeconds: 600,
        message: "Too many score submissions. Please wait and try again.",
    });
    if (rl) return rl;

    let body: {
        puzzleId?: unknown;
        letters?: unknown;
        revealedEntryIds?: unknown;
        durationSeconds?: unknown;
        player?: unknown;
    };
    try { body = await request.json(); }
    catch { return noStoreJson({ error: "Invalid JSON." }, { status: 400 }); }

    const puzzleId = typeof body.puzzleId === "string" ? body.puzzleId : null;
    const letters = body.letters && typeof body.letters === "object" && !Array.isArray(body.letters)
        ? body.letters as Record<string, string>
        : null;
    const revealedEntryIds = Array.isArray(body.revealedEntryIds) && body.revealedEntryIds.every((id) => typeof id === "string")
        ? (body.revealedEntryIds as string[])
        : [];
    const durationSeconds = typeof body.durationSeconds === "number" ? body.durationSeconds : null;
    const player = body.player && typeof body.player === "object"
        ? body.player as { email?: string; username?: string }
        : null;

    if (!puzzleId || !letters || durationSeconds === null || !player?.username) {
        return noStoreJson({ error: "puzzleId, letters, durationSeconds, and player.username required." }, { status: 400 });
    }
    if (durationSeconds < 0) {
        return noStoreJson({ error: "Invalid duration." }, { status: 400 });
    }

    const overrides = await loadOverrides();
    const puzzle = getCrosswordPuzzleById(puzzleId, overrides);
    if (!puzzle) return noStoreJson({ error: "Puzzle not found." }, { status: 404 });

    // Verify every fillable cell matches the answer key.
    for (const cell of puzzle.cells) {
        if (!cell.answer) continue;
        const guessed = (letters[cell.key] ?? "").trim().toUpperCase();
        if (guessed !== cell.answer) {
            return noStoreJson({ improved: false, recorded: false, reason: "incomplete_or_incorrect" }, { status: 200 });
        }
    }

    // Validate revealed entries actually exist in the puzzle.
    const validEntryIds = new Set(puzzle.entries.map((e) => e.id));
    const revealsCount = revealedEntryIds.filter((id) => validEntryIds.has(id)).length;

    const computedScore = computeCrosswordScore(durationSeconds, 0, revealsCount);

    const result = await recordScore(request, {
        game: "crossword",
        puzzleKey: puzzleId,
        score: computedScore,
        maxScore: 100,
        attempts: revealsCount,
        solved: true,
        player: { email: player.email ?? "", username: player.username },
        metadata: {
            duration_seconds: durationSeconds,
            checks_used: 0,
            reveals_used: revealsCount,
            completed_at: new Date().toISOString(),
        },
    });

    if (!result.ok) return noStoreJson({ error: result.error }, { status: result.status });
    return noStoreJson({ improved: result.improved, recorded: true, score: computedScore }, { status: 200 });
}
