import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";
import { noStoreJson } from "@/lib/server/request-security";

type TriviaQuestionInsert = {
    prompt: string;
    answer_a: string;
    answer_b: string;
    answer_c: string;
    answer_d: string;
    correct_index: number;
    fun_fact?: string | null;
    sort_order?: number;
    archived?: boolean;
};

async function getAdminSupabase() {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    const session = verifyAdminSessionToken(token);

    if (!session) return null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) return null;

    return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

function cleanTrimmedText(value: unknown, label: string, maxLength: number, required = false) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (!trimmed) {
        if (required) {
            throw new Error(`${label} is required.`);
        }
        return null;
    }
    if (trimmed.length > maxLength) {
        throw new Error(`${label} is too long.`);
    }
    return trimmed;
}

export async function GET() {
    const supabase = await getAdminSupabase();

    if (!supabase) {
        return noStoreJson({ error: "Unauthorized." }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from("trivia_questions")
            .select("*")
            .order("sort_order", { ascending: true });

        if (error) throw error;

        return noStoreJson({ questions: data }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load questions.";
        return noStoreJson({ error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const supabase = await getAdminSupabase();

    if (!supabase) {
        return noStoreJson({ error: "Unauthorized." }, { status: 401 });
    }

    try {
        const body = await request.json() as Partial<TriviaQuestionInsert>;
        const prompt = cleanTrimmedText(body.prompt, "Prompt", 240, true);
        const answerA = cleanTrimmedText(body.answer_a, "Answer A", 120, true);
        const answerB = cleanTrimmedText(body.answer_b, "Answer B", 120, true);
        const answerC = cleanTrimmedText(body.answer_c, "Answer C", 120, true);
        const answerD = cleanTrimmedText(body.answer_d, "Answer D", 120, true);
        const funFact = cleanTrimmedText(body.fun_fact, "Fun fact", 600);
        const sortOrder = typeof body.sort_order === "number" ? body.sort_order : 0;

        if (typeof body.correct_index !== "number" || body.correct_index < 0 || body.correct_index > 3) {
            return noStoreJson({ error: "correct_index must be 0, 1, 2, or 3." }, { status: 400 });
        }

        if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10_000) {
            return noStoreJson({ error: "sort_order must be a whole number between 0 and 10000." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("trivia_questions")
            .insert({
                prompt,
                answer_a: answerA,
                answer_b: answerB,
                answer_c: answerC,
                answer_d: answerD,
                correct_index: body.correct_index,
                fun_fact: funFact,
                sort_order: sortOrder,
                archived: false,
            })
            .select("*")
            .single();

        if (error) throw error;

        return noStoreJson({ question: data }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not create question.";
        const status = message.endsWith("is required.") || message.endsWith("is too long.") ? 400 : 500;
        return noStoreJson({ error: message }, { status });
    }
}
