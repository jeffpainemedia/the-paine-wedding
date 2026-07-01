import { NextRequest } from "next/server";
import { evaluateGuess, MAX_GUESSES, WORD_LENGTH } from "@/lib/games/painedle";
import { getDailyWord } from "@/lib/games/painedle-server";
import { isValidDictionaryGuess } from "@/lib/games/dictionary";
import { recordScore } from "@/lib/server/leaderboard-recorder";
import { enforceRateLimit, noStoreJson } from "@/lib/server/request-security";

// POST /api/games/painedle/submit-score
// Server validates the player's guesses against today's word and computes
// the canonical score. Replaces trusting the client to self-report.
export async function POST(request: NextRequest) {
    const rl = await enforceRateLimit(request, {
        bucket: "game-submit-score",
        limit: 25,
        windowSeconds: 600,
        message: "Too many score submissions. Please wait and try again.",
    });
    if (rl) return rl;

    let body: { dateKey?: unknown; guesses?: unknown; player?: unknown };
    try { body = await request.json(); }
    catch { return noStoreJson({ error: "Invalid JSON." }, { status: 400 }); }

    const dateKey = typeof body.dateKey === "string" ? body.dateKey : null;
    const guesses = Array.isArray(body.guesses) && body.guesses.every((g) => typeof g === "string")
        ? (body.guesses as string[]).map((g) => g.toLowerCase())
        : null;
    const player = body.player && typeof body.player === "object"
        ? body.player as { email?: string; username?: string }
        : null;

    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !guesses || !player?.username) {
        return noStoreJson({ error: "dateKey, guesses, and player.username required." }, { status: 400 });
    }
    if (guesses.length === 0 || guesses.length > MAX_GUESSES) {
        return noStoreJson({ error: "Invalid guess count." }, { status: 400 });
    }
    for (const g of guesses) {
        if (g.length !== WORD_LENGTH || !/^[a-z]+$/.test(g) || !isValidDictionaryGuess(g)) {
            return noStoreJson({ error: "One or more guesses is not a valid word." }, { status: 400 });
        }
    }

    const solution = getDailyWord(dateKey);
    const winningIndex = guesses.findIndex((g) => g === solution);
    const solved = winningIndex !== -1;
    if (!solved) {
        // Don't record losses on the leaderboard — matches existing behaviour.
        return noStoreJson({ improved: false, recorded: false }, { status: 200 });
    }

    // Score = MAX_GUESSES - guessesUsed + 1 (1st-try win = MAX_GUESSES, last-try = 1)
    const guessesUsed = winningIndex + 1;
    const computedScore = MAX_GUESSES - guessesUsed + 1;

    // Per-letter statuses for the share text — computed server-side so we
    // know they match the answer key.
    const statuses = guesses.slice(0, guessesUsed).map((g) => evaluateGuess(g, solution));

    const result = await recordScore(request, {
        game: "painedle",
        puzzleKey: dateKey,
        score: computedScore,
        maxScore: MAX_GUESSES,
        attempts: guessesUsed,
        solved: true,
        player: { email: player.email ?? "", username: player.username },
        metadata: {
            solution,
            word_length: WORD_LENGTH,
            statuses_json: JSON.stringify(statuses),
        },
    });

    if (!result.ok) return noStoreJson({ error: result.error }, { status: result.status });
    return noStoreJson({ improved: result.improved, recorded: true, score: computedScore }, { status: 200 });
}
