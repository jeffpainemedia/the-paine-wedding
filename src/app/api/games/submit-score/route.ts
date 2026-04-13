import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Database = {
    public: {
        Tables: {
            game_players: {
                Row: {
                    id: string;
                    email: string;
                    username: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    username: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    email?: string;
                    username?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            game_scores: {
                Row: {
                    id: string;
                    player_id: string;
                    game: GameType;
                    puzzle_key: string;
                    score: number;
                    max_score: number | null;
                    attempts: number | null;
                    solved: boolean | null;
                    metadata: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    player_id: string;
                    game: GameType;
                    puzzle_key?: string;
                    score: number;
                    max_score?: number | null;
                    attempts?: number | null;
                    solved?: boolean | null;
                    metadata?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    player_id?: string;
                    game?: GameType;
                    puzzle_key?: string;
                    score?: number;
                    max_score?: number | null;
                    attempts?: number | null;
                    solved?: boolean | null;
                    metadata?: Json;
                    updated_at?: string;
                };
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};

type GameType = "trivia" | "painedle" | "crossword" | "connections";

type SubmitScoreBody = {
    game?: GameType;
    email?: string;
    username?: string;
    score?: number;
    maxScore?: number | null;
    attempts?: number | null;
    solved?: boolean | null;
    puzzleKey?: string;
    metadata?: Record<string, string | number | boolean | null>;
};

type GamePlayer = {
    id: string;
    email: string;
    username: string;
};

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function isBetterScore(existing: {
    score: number;
    attempts: number | null;
    solved: boolean | null;
}, incoming: {
    score: number;
    attempts: number | null;
    solved: boolean | null;
}) {
    if (incoming.score !== existing.score) {
        return incoming.score > existing.score;
    }

    if (incoming.solved !== existing.solved) {
        return Boolean(incoming.solved) && !existing.solved;
    }

    const existingAttempts = existing.attempts ?? Number.MAX_SAFE_INTEGER;
    const incomingAttempts = incoming.attempts ?? Number.MAX_SAFE_INTEGER;
    return incomingAttempts < existingAttempts;
}

function getRequestMetadata(request: NextRequest) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;

    return {
        request_ip: ip,
        request_country: request.headers.get("x-vercel-ip-country"),
        request_region: request.headers.get("x-vercel-ip-country-region"),
        request_city: request.headers.get("x-vercel-ip-city"),
        request_user_agent: request.headers.get("user-agent"),
        request_language: request.headers.get("accept-language"),
        request_referer: request.headers.get("referer"),
    } satisfies Record<string, string | null>;
}

async function upsertGamePlayer(
    supabase: ReturnType<typeof createClient<Database>>,
    email: string,
    username: string
) {
    const normalizedEmail = normalizeEmail(email);
    const trimmedUsername = username.trim();

    const { data, error } = await supabase
        .from("game_players")
        .upsert(
            {
                email: normalizedEmail,
                username: trimmedUsername,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "email" }
        )
        .select("id, email, username")
        .single();

    if (error) throw error;
    return data as GamePlayer;
}

export async function POST(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Use service role key (bypasses RLS) for server-side writes; fall back to anon key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder") || supabaseKey === "placeholder") {
        return NextResponse.json({ error: "Game database is not configured." }, { status: 500 });
    }

    try {
        const body = await request.json() as SubmitScoreBody;
        const game = body.game;
        const email = body.email?.trim() ?? "";
        const username = body.username?.trim() ?? "";
        const score = Number(body.score ?? 0);

        if (!game || !["trivia", "painedle", "crossword", "connections"].includes(game)) {
            return NextResponse.json({ error: "Invalid game." }, { status: 400 });
        }

        if (!email || !username) {
            return NextResponse.json({ error: "Username and email are required." }, { status: 400 });
        }

        if (!Number.isFinite(score) || score < 0) {
            return NextResponse.json({ error: "Invalid score." }, { status: 400 });
        }

        const supabase = createClient<Database>(supabaseUrl, supabaseKey);
        const player = await upsertGamePlayer(supabase, email, username);
        const puzzleKey = body.puzzleKey ?? "";

        const { data: existingScore, error: existingError } = await supabase
            .from("game_scores")
            .select("id, score, attempts, solved")
            .eq("player_id", player.id)
            .eq("game", game)
            .eq("puzzle_key", puzzleKey)
            .maybeSingle();

        if (existingError) {
            throw existingError;
        }

        const scorePayload = {
            player_id: player.id,
            game,
            puzzle_key: puzzleKey,
            score,
            max_score: body.maxScore ?? null,
            attempts: body.attempts ?? null,
            solved: body.solved ?? null,
            metadata: {
                ...(body.metadata ?? {}),
                ...getRequestMetadata(request),
            },
            updated_at: new Date().toISOString(),
        };

        if (existingScore) {
            const shouldUpdate = isBetterScore(existingScore, {
                score,
                attempts: body.attempts ?? null,
                solved: body.solved ?? null,
            });

            if (!shouldUpdate) {
                return NextResponse.json({ improved: false }, { status: 200 });
            }

            const { error } = await supabase
                .from("game_scores")
                .update(scorePayload)
                .eq("id", existingScore.id);

            if (error) throw error;
            return NextResponse.json({ improved: true }, { status: 200 });
        }

        const { error } = await supabase.from("game_scores").insert(scorePayload);
        if (error) throw error;

        return NextResponse.json({ improved: true }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not submit score.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
