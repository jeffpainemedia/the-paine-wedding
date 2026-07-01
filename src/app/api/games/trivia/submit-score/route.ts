import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { recordScore } from "@/lib/server/leaderboard-recorder";
import { enforceRateLimit, noStoreJson } from "@/lib/server/request-security";

// POST /api/games/trivia/submit-score
// Validates each chosen answer against the trivia question's correct_index
// and computes the canonical score from the verified count.
export async function POST(request: NextRequest) {
    const rl = await enforceRateLimit(request, {
        bucket: "game-submit-score",
        limit: 25,
        windowSeconds: 600,
        message: "Too many score submissions. Please wait and try again.",
    });
    if (rl) return rl;

    let body: { answers?: unknown; player?: unknown };
    try { body = await request.json(); }
    catch { return noStoreJson({ error: "Invalid JSON." }, { status: 400 }); }

    const answers = Array.isArray(body.answers)
        ? body.answers.filter((a): a is { questionId: string; chosenIndex: number } =>
              !!a && typeof a === "object"
              && typeof (a as { questionId?: unknown }).questionId === "string"
              && typeof (a as { chosenIndex?: unknown }).chosenIndex === "number")
        : null;
    const player = body.player && typeof body.player === "object"
        ? body.player as { email?: string; username?: string }
        : null;

    if (!answers || !player?.username) {
        return noStoreJson({ error: "answers (array) and player.username required." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return noStoreJson({ error: "Database not configured." }, { status: 500 });

    const sb = createClient(url, key);
    const ids = answers.map((a) => a.questionId);
    const { data: rows, error } = await sb
        .from("trivia_questions")
        .select("id, correct_index, archived")
        .in("id", ids);
    if (error) return noStoreJson({ error: error.message }, { status: 500 });

    const correctMap = new Map<string, number>();
    for (const row of rows ?? []) {
        if (!row.archived) correctMap.set(row.id as string, row.correct_index as number);
    }

    let correctCount = 0;
    for (const a of answers) {
        if (correctMap.get(a.questionId) === a.chosenIndex) correctCount++;
    }

    const { count: totalActive } = await sb
        .from("trivia_questions")
        .select("id", { count: "exact", head: true })
        .eq("archived", false);
    const totalQuestions = totalActive ?? answers.length;

    const answeredCount = answers.length;
    const computedScore = totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * answeredCount * 10)
        : 0;
    const solved = correctCount === answeredCount && answeredCount === totalQuestions;

    const result = await recordScore(request, {
        game: "trivia",
        puzzleKey: "wedding-day-trivia",
        score: computedScore,
        maxScore: totalQuestions * 10,
        attempts: answeredCount,
        solved,
        player: { email: player.email ?? "", username: player.username },
        metadata: {
            question_count: totalQuestions,
            answered_count: answeredCount,
            correct_count: correctCount,
        },
    });

    if (!result.ok) return noStoreJson({ error: result.error }, { status: result.status });
    return noStoreJson({ improved: result.improved, recorded: true, score: computedScore }, { status: 200 });
}
