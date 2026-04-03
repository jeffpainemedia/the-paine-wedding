import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit, noStoreJson } from "@/lib/server/request-security";

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

type GameType = "trivia" | "painedle" | "crossword";

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

function normalizeUsernameForModeration(username: string) {
    return username.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isAllowedUsername(username: string) {
    return /^[\p{L}\p{N}][\p{L}\p{N} ._'’-]{1,31}$/u.test(username);
}

function containsBlockedLanguage(username: string) {
    const normalized = normalizeUsernameForModeration(username);
    return [
        "fuck",
        "shit",
        "bitch",
        "cunt",
        "nigger",
        "nigga",
        "faggot",
        "fag",
        "slut",
        "whore",
    ].some((word) => normalized.includes(word));
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
    const rateLimitResponse = await enforceRateLimit(request, {
        bucket: "game-submit-score",
        limit: 25,
        windowSeconds: 60 * 10,
        message: "Too many score submissions. Please wait a moment and try again.",
    });
    if (rateLimitResponse) return rateLimitResponse;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Use service role key (bypasses RLS) for server-side writes; fall back to anon key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder") || supabaseKey === "placeholder") {
        return noStoreJson({ error: "Game database is not configured." }, { status: 500 });
    }

    try {
        const body = await request.json() as SubmitScoreBody;
        const game = body.game;
        const email = body.email?.trim() ?? "";
        const username = body.username?.trim() ?? "";
        const score = Number(body.score ?? 0);

        if (!game || !["trivia", "painedle", "crossword"].includes(game)) {
            return noStoreJson({ error: "Invalid game." }, { status: 400 });
        }

        if (!username) {
            return noStoreJson({ error: "Username is required." }, { status: 400 });
        }

        if (!isAllowedUsername(username) || containsBlockedLanguage(username)) {
            return noStoreJson(
                { error: "Please choose a simple display name using letters, numbers, spaces, or punctuation." },
                { status: 400 },
            );
        }

        if (!Number.isFinite(score) || score < 0) {
            return noStoreJson({ error: "Invalid score." }, { status: 400 });
        }

        const supabase = createClient<Database>(supabaseUrl, supabaseKey);
        // If no email provided, derive a stable synthetic one from the username so the upsert still works
        const effectiveEmail = email || `${username.toLowerCase().replace(/\s+/g, ".")}.guest@wedding.local`;
        const player = await upsertGamePlayer(supabase, effectiveEmail, username);
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
                return noStoreJson({ improved: false }, { status: 200 });
            }

            const { error } = await supabase
                .from("game_scores")
                .update(scorePayload)
                .eq("id", existingScore.id);

            if (error) throw error;
            return noStoreJson({ improved: true }, { status: 200 });
        }

        const { error } = await supabase.from("game_scores").insert(scorePayload);
        if (error) throw error;

        return noStoreJson({ improved: true }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not submit score.";
        return noStoreJson({ error: message }, { status: 500 });
    }
}
