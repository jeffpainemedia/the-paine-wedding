import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 60;

// Public-facing trivia question shape — answers and prompts only.
// Correct answer + fun fact are NOT included; clients fetch those one at a
// time via POST /api/games/trivia/check after submitting an answer.
export type PublicTriviaQuestion = {
    id: string;
    prompt: string;
    answer_a: string;
    answer_b: string;
    answer_c: string;
    answer_d: string;
    sort_order: number;
};

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder") || supabaseKey === "placeholder") {
        return NextResponse.json({ error: "Database not configured." }, { status: 500 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Explicit column list — never include correct_index or fun_fact in
        // the public payload.
        const { data, error } = await supabase
            .from("trivia_questions")
            .select("id, prompt, answer_a, answer_b, answer_c, answer_d, sort_order")
            .eq("archived", false)
            .order("sort_order", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ questions: data as PublicTriviaQuestion[] }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load trivia questions.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
