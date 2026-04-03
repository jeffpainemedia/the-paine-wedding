export type GameType = "trivia" | "painedle" | "crossword";

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

export type PlayerGameScore = {
    id: string;
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
    email?: string;
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
    firstName?: string;
    lastName?: string;
    browserProfile?: BrowserProfile;
    updatedAt?: string;
};

export type GamePlayerProfile = {
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
};

// email is optional when creating/saving a player
export type SaveGamePlayerInput = {
    email?: string;
    username: string;
    firstName?: string;
    lastName?: string;
    browserProfile?: BrowserProfile | null;
};

export const GAME_PLAYER_STORAGE_KEY = "wedding-games-player";
export const GAME_LEADERBOARD_REFRESH_EVENT = "wedding-games-leaderboard-refresh";

export function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

export function getEffectivePlayerEmail(player: { email?: string; username: string }) {
    const normalizedEmail = player.email?.trim() ? normalizeEmail(player.email) : "";
    return normalizedEmail || `${player.username.toLowerCase().replace(/\s+/g, ".")}.guest@wedding.local`;
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

export function saveStoredGamePlayer(player: { email?: string; username: string; firstName?: string; lastName?: string; browserProfile?: BrowserProfile | null }) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
        GAME_PLAYER_STORAGE_KEY,
        JSON.stringify({
            email: player.email ? normalizeEmail(player.email) : "",
            username: player.username.trim(),
            firstName: player.firstName?.trim(),
            lastName: player.lastName?.trim(),
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
        if (!parsed.username) return null;
        return {
            email: parsed.email,
            username: parsed.username,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
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

export async function fetchPlayerProfileByEmail(email: string) {
    const normalizedEmail = normalizeEmail(email);
    const response = await fetch(`/api/games/player-profile?email=${encodeURIComponent(normalizedEmail)}`, {
        cache: "no-store",
    });
    const payload = await response.json() as {
        profile?: {
            email: string;
            username: string;
        } | null;
        error?: string;
    };

    if (!response.ok) {
        throw new Error(payload.error || "Could not load player profile.");
    }

    if (!payload.profile) {
        return null;
    }

    const parts = payload.profile.username.trim().split(/\s+/).filter(Boolean);
    return {
        email: payload.profile.email,
        username: payload.profile.username,
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" "),
    } satisfies GamePlayerProfile;
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
    const params = new URLSearchParams({
        game,
        limit: String(limit),
    });

    if (options?.puzzleKey !== undefined) {
        params.set("puzzleKey", options.puzzleKey);
    }

    const response = await fetch(`/api/games/leaderboard?${params.toString()}`);
    const payload = await response.json() as {
        entries?: RawLeaderboardRow[];
        error?: string;
    };

    if (!response.ok) {
        throw new Error(payload.error || "Could not load leaderboard.");
    }

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

    return (payload.entries ?? []).map((entry) => ({
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

export async function fetchPlayerGameScore(game: GameType, puzzleKey: string, player: { email?: string; username: string }) {
    const params = new URLSearchParams({
        game,
        puzzleKey,
        email: getEffectivePlayerEmail(player),
        username: player.username.trim(),
    });

    const response = await fetch(`/api/games/player-score?${params.toString()}`, {
        cache: "no-store",
    });
    const payload = await response.json() as {
        entry?: {
            id: string;
            score: number;
            max_score: number | null;
            attempts: number | null;
            solved: boolean | null;
            created_at: string;
            puzzle_key: string;
            metadata?: Record<string, string | number | boolean | null> | null;
        } | null;
        error?: string;
    };

    if (!response.ok) {
        throw new Error(payload.error || "Could not load player score.");
    }

    if (!payload.entry) {
        return null;
    }

    return {
        id: payload.entry.id,
        score: payload.entry.score,
        maxScore: payload.entry.max_score,
        attempts: payload.entry.attempts,
        solved: payload.entry.solved,
        createdAt: payload.entry.created_at,
        puzzleKey: payload.entry.puzzle_key,
        metadata: payload.entry.metadata ?? null,
    } satisfies PlayerGameScore;
}
