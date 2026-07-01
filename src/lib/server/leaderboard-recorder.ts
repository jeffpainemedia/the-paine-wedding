import "server-only";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Shared score-recording helper used by every per-game submit endpoint.
// Centralizes player upsert, "is this an improvement?" gating, and rate-aware
// metadata capture so each game endpoint only has to worry about validating
// its own answer key.

type GameType = "trivia" | "painedle" | "crossword" | "connections";

type RecordScoreInput = {
    game: GameType;
    puzzleKey: string;
    score: number;
    maxScore: number | null;
    attempts: number | null;
    solved: boolean | null;
    player: { email: string; username: string };
    metadata?: Record<string, unknown>;
};

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function normalizeUsernameForModeration(username: string) {
    return username.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isAllowedUsername(username: string) {
    return /^[\p{L}\p{N}][\p{L}\p{N} ._'’-]{1,31}$/u.test(username);
}

export function containsBlockedLanguage(username: string) {
    const normalized = normalizeUsernameForModeration(username);
    return [
        "fuck", "shit", "bitch", "cunt", "nigger", "nigga",
        "faggot", "fag", "slut", "whore",
    ].some((word) => normalized.includes(word));
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

function isBetterScore(existing: { score: number; attempts: number | null; solved: boolean | null }, incoming: { score: number; attempts: number | null; solved: boolean | null }) {
    if (incoming.score !== existing.score) return incoming.score > existing.score;
    if (incoming.solved !== existing.solved) return Boolean(incoming.solved) && !existing.solved;
    const e = existing.attempts ?? Number.MAX_SAFE_INTEGER;
    const i = incoming.attempts ?? Number.MAX_SAFE_INTEGER;
    return i < e;
}

export async function recordScore(request: NextRequest, input: RecordScoreInput): Promise<
    | { ok: true; improved: boolean }
    | { ok: false; status: number; error: string }
> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes("placeholder") || key === "placeholder") {
        return { ok: false, status: 500, error: "Game database is not configured." };
    }

    const username = input.player.username.trim();
    if (!username) return { ok: false, status: 400, error: "Username is required." };
    if (!isAllowedUsername(username) || containsBlockedLanguage(username)) {
        return {
            ok: false,
            status: 400,
            error: "Please choose a simple display name using letters, numbers, spaces, or punctuation.",
        };
    }
    if (!Number.isFinite(input.score) || input.score < 0) {
        return { ok: false, status: 400, error: "Invalid score." };
    }

    try {
        const sb = createClient(url, key);
        const email = input.player.email?.trim() || `${username.toLowerCase().replace(/\s+/g, ".")}.guest@wedding.local`;
        const { data: player, error: playerErr } = await sb
            .from("game_players")
            .upsert(
                { email: normalizeEmail(email), username, updated_at: new Date().toISOString() },
                { onConflict: "email" }
            )
            .select("id")
            .single();
        if (playerErr || !player) {
            return { ok: false, status: 500, error: playerErr?.message ?? "Could not record player." };
        }

        const { data: existingScore } = await sb
            .from("game_scores")
            .select("id, score, attempts, solved")
            .eq("player_id", player.id)
            .eq("game", input.game)
            .eq("puzzle_key", input.puzzleKey)
            .maybeSingle();

        const payload = {
            player_id: player.id,
            game: input.game,
            puzzle_key: input.puzzleKey,
            score: input.score,
            max_score: input.maxScore,
            attempts: input.attempts,
            solved: input.solved,
            metadata: { ...(input.metadata ?? {}), ...getRequestMetadata(request) },
            updated_at: new Date().toISOString(),
        };

        if (existingScore) {
            const better = isBetterScore(existingScore, {
                score: input.score,
                attempts: input.attempts,
                solved: input.solved,
            });
            if (!better) return { ok: true, improved: false };
            const { error } = await sb.from("game_scores").update(payload).eq("id", existingScore.id);
            if (error) return { ok: false, status: 500, error: error.message };
            return { ok: true, improved: true };
        }

        const { error } = await sb.from("game_scores").insert(payload);
        if (error) return { ok: false, status: 500, error: error.message };
        return { ok: true, improved: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Could not record score.";
        return { ok: false, status: 500, error: message };
    }
}
