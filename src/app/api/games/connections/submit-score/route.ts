import { NextRequest } from "next/server";
import { computeConnectionsScore, MAX_MISTAKES } from "@/lib/games/connections";
import { getConnectionsPuzzleById } from "@/lib/games/connections-server";
import { recordScore } from "@/lib/server/leaderboard-recorder";
import { enforceRateLimit, noStoreJson } from "@/lib/server/request-security";

// POST /api/games/connections/submit-score
// Validates the player's solved-groups list against the puzzle's answer key
// and computes the canonical score from server-known data.
export async function POST(request: NextRequest) {
    const rl = await enforceRateLimit(request, {
        bucket: "game-submit-score",
        limit: 25,
        windowSeconds: 600,
        message: "Too many score submissions. Please wait and try again.",
    });
    if (rl) return rl;

    let body: { puzzleId?: unknown; solvedCategories?: unknown; mistakes?: unknown; durationSeconds?: unknown; player?: unknown };
    try { body = await request.json(); }
    catch { return noStoreJson({ error: "Invalid JSON." }, { status: 400 }); }

    const puzzleId = typeof body.puzzleId === "number" ? body.puzzleId : null;
    const solvedCategories = Array.isArray(body.solvedCategories) && body.solvedCategories.every((c) => typeof c === "string")
        ? (body.solvedCategories as string[])
        : null;
    const mistakes = typeof body.mistakes === "number" ? body.mistakes : null;
    const durationSeconds = typeof body.durationSeconds === "number" ? body.durationSeconds : null;
    const player = body.player && typeof body.player === "object"
        ? body.player as { email?: string; username?: string }
        : null;

    if (puzzleId === null || !solvedCategories || mistakes === null || durationSeconds === null || !player?.username) {
        return noStoreJson({ error: "puzzleId, solvedCategories, mistakes, durationSeconds, and player.username required." }, { status: 400 });
    }
    if (mistakes < 0 || mistakes > MAX_MISTAKES || durationSeconds < 0) {
        return noStoreJson({ error: "Invalid mistakes or duration." }, { status: 400 });
    }

    const puzzle = getConnectionsPuzzleById(puzzleId);
    if (!puzzle) return noStoreJson({ error: "Puzzle not found." }, { status: 404 });

    // Each "solved" category must actually be a category in the puzzle, and
    // they must be unique. The set size also caps at the four real groups.
    const validCategories = new Set(puzzle.groups.map((g) => g.category));
    const uniqueClaimed = new Set(solvedCategories);
    for (const cat of uniqueClaimed) {
        if (!validCategories.has(cat)) {
            return noStoreJson({ error: `Unknown category: ${cat}` }, { status: 400 });
        }
    }
    const solvedCount = uniqueClaimed.size;
    const solved = solvedCount === 4 && mistakes < MAX_MISTAKES;

    if (!solved) {
        return noStoreJson({ improved: false, recorded: false }, { status: 200 });
    }

    const computedScore = computeConnectionsScore(mistakes, durationSeconds);

    const result = await recordScore(request, {
        game: "connections",
        puzzleKey: `connections-${puzzle.id}`,
        score: computedScore,
        maxScore: 100,
        attempts: mistakes,
        solved: true,
        player: { email: player.email ?? "", username: player.username },
        metadata: {
            puzzle_id: puzzle.id,
            mistakes,
            duration_seconds: durationSeconds,
            completed_at: new Date().toISOString(),
        },
    });

    if (!result.ok) return noStoreJson({ error: result.error }, { status: result.status });
    return noStoreJson({ improved: result.improved, recorded: true, score: computedScore }, { status: 200 });
}
