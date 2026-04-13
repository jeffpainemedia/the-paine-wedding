import { supabase } from "@/lib/supabase";

export type GameType = "trivia" | "painedle" | "crossword" | "connections";

export type LeaderboardEntry = {
    id: string;
    username: string;
    score: number;
    maxScore: number | null;
    attempts: number | null;
    solved: boolean | null;
    createdAt: string;
    puzzleKey: string;
    metadata?: Record<string, string | number | boolean | null> | null;
};

export type SubmitGameScoreInput = {
    game: GameType;
    email: string;
    username: string;
    score: number;
    maxScore?: number | null;
    attempts?: number | null;
    solved?: boolean | null;
    puzzleKey?: string;
    metadata?: Record<string, string | number | boolean | null>;
};

export type BrowserProfile = {
    language: string;
    languages: string;
    platform: string;
    timezone: string;
    userAgent: string;
    screen: string;
};

export type StoredGamePlayer = {
    email: string;
    username: string;
    browserProfile?: BrowserProfile;
    updatedAt?: string;
};

export const GAME_PLAYER_STORAGE_KEY = "wedding-games-player";
export const GAME_LEADERBOARD_REFRESH_EVENT = "wedding-games-leaderboard-refresh";

export function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

export function captureBrowserProfile(): BrowserProfile | null {
    if (typeof window === "undefined") return null;

    return {
        language: navigator.language,
        languages: navigator.languages.join(", "),
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userAgent: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
    };
}

export function saveStoredGamePlayer(player: { email: string; username: string; browserProfile?: BrowserProfile | null }) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
        GAME_PLAYER_STORAGE_KEY,
        JSON.stringify({
            email: normalizeEmail(player.email),
            username: player.username.trim(),
            browserProfile: player.browserProfile ?? captureBrowserProfile() ?? undefined,
            updatedAt: new Date().toISOString(),
        })
    );
    document.cookie = "wedding-games-profile=1; path=/; max-age=31536000; samesite=lax";
}

export function getStoredGamePlayer() {
    if (typeof window === "undefined") return null;

    const rawValue = window.localStorage.getItem(GAME_PLAYER_STORAGE_KEY);
    if (!rawValue) return null;

    try {
        const parsed = JSON.parse(rawValue) as StoredGamePlayer;
        if (!parsed.email || !parsed.username) return null;
        return {
            email: parsed.email,
            username: parsed.username,
            browserProfile: parsed.browserProfile,
            updatedAt: parsed.updatedAt,
        };
    } catch {
        return null;
    }
}

export function clearStoredGamePlayer() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(GAME_PLAYER_STORAGE_KEY);
    document.cookie = "wedding-games-profile=; path=/; max-age=0; samesite=lax";
}

export async function submitGameScore(input: SubmitGameScoreInput) {
    const response = await fetch("/api/games/submit-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });

    const data = await response.json() as { improved?: boolean; error?: string };

    if (!response.ok) {
        throw new Error(data.error || "Could not submit score.");
    }

    return { improved: Boolean(data.improved) };
}

export async function fetchLeaderboard(game: GameType, options?: { limit?: number; puzzleKey?: string }) {
    const limit = options?.limit ?? 10;
    let query = supabase
        .from("game_scores")
        .select("id, score, max_score, attempts, solved, created_at, puzzle_key, metadata, game_players!inner(username)")
        .eq("game", game)
        .order("score", { ascending: false })
        .order("attempts", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })
        .limit(limit);

    if (options?.puzzleKey !== undefined) {
        query = query.eq("puzzle_key", options.puzzleKey);
    }

    const { data, error } = await query;
    if (error) throw error;

    type RawLeaderboardRow = {
        id: string;
        score: number;
        max_score: number | null;
        attempts: number | null;
        solved: boolean | null;
        created_at: string;
        puzzle_key: string;
        metadata?: Record<string, string | number | boolean | null> | null;
        game_players: { username: string } | Array<{ username: string }> | null;
    };

    return ((data ?? []) as RawLeaderboardRow[]).map((entry) => ({
        id: entry.id,
        username: Array.isArray(entry.game_players)
            ? entry.game_players[0]?.username ?? "Guest"
            : entry.game_players?.username ?? "Guest",
        score: entry.score,
        maxScore: entry.max_score,
        attempts: entry.attempts,
        solved: entry.solved,
        createdAt: entry.created_at,
        puzzleKey: entry.puzzle_key,
        metadata: entry.metadata ?? null,
    })) as LeaderboardEntry[];
}
