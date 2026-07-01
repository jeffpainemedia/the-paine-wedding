import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/games/trivia/check
// Validates a single trivia answer server-side. The correct answer index and
// fun fact are not exposed to clients except via this endpoint after they've
// committed to an answer.
export async function POST(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: "Database not configured." }, { status: 500 });
    }

    let body: { questionId?: unknown; chosenIndex?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    const questionId = typeof body.questionId === "string" ? body.questionId : null;
    const chosenIndex = typeof body.chosenIndex === "number" ? body.chosenIndex : null;

    if (!questionId || chosenIndex === null || chosenIndex < 0 || chosenIndex > 3) {
        return NextResponse.json({ error: "questionId and chosenIndex (0-3) required." }, { status: 400 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
            .from("trivia_questions")
            .select("correct_index, fun_fact, archived")
            .eq("id", questionId)
            .maybeSingle();

        if (error) throw error;
        if (!data || data.archived) {
            return NextResponse.json({ error: "Question not found." }, { status: 404 });
        }

        const correctIndex = data.correct_index as number;
        const correct = chosenIndex === correctIndex;

        return NextResponse.json({
            correct,
            correctIndex,
            funFact: data.fun_fact ?? null,
        }, {
            status: 200,
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not check answer.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
