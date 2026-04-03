"use client";

import { useEffect, useState } from "react";
import {
    fetchLeaderboard,
    GAME_LEADERBOARD_REFRESH_EVENT,
    type GameType,
    type LeaderboardEntry,
} from "@/lib/games/leaderboard";

type LeaderboardPanelProps = {
    game: GameType;
    title: string;
    subtitle: string;
    puzzleKey?: string;
    refreshKey?: number;
};

export default function LeaderboardPanel({
    game,
    title,
    subtitle,
    puzzleKey,
    refreshKey = 0,
}: LeaderboardPanelProps) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshVersion, setRefreshVersion] = useState(0);

    function getEntrySubtitle(entry: LeaderboardEntry) {
        if (game === "trivia") {
            return `${entry.score}${entry.maxScore ? ` / ${entry.maxScore}` : ""}`;
        }

        if (game === "crossword") {
            const duration = typeof entry.metadata?.duration_seconds === "number" ? entry.metadata.duration_seconds : null;
            const minutes = duration ? Math.max(1, Math.round(duration / 60)) : null;

            if (minutes) {
                return `${minutes} min${minutes === 1 ? "" : "s"}`;
            }

            return entry.solved ? "Completed puzzle" : "In progress";
        }

        return entry.solved
            ? `Solved in ${entry.attempts} ${entry.attempts === 1 ? "guess" : "guesses"}`
            : "Unsolved";
    }

    useEffect(() => {
        let isActive = true;

        async function loadLeaderboard() {
            setLoading(true);
            setError(null);

            try {
                const data = await fetchLeaderboard(game, { limit: 10, puzzleKey });
                if (isActive) {
                    setEntries(data);
                }
            } catch {
                if (isActive) {
                    setError("Leaderboard unavailable right now.");
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        }

        void loadLeaderboard();

        return () => {
            isActive = false;
        };
    }, [game, puzzleKey, refreshKey, refreshVersion]);

    useEffect(() => {
        function handleRefresh() {
            setRefreshVersion((current) => current + 1);
        }

        window.addEventListener(GAME_LEADERBOARD_REFRESH_EVENT, handleRefresh);
        return () => window.removeEventListener(GAME_LEADERBOARD_REFRESH_EVENT, handleRefresh);
    }, []);

    return (
        <div className="relative overflow-hidden rounded-[2.2rem] border border-primary/12 bg-[linear-gradient(160deg,#fffaf4_0%,#f3ede4_100%)] p-6 shadow-[0_24px_80px_rgba(20,42,68,0.10)] md:p-8">
            <div className="pointer-events-none absolute -right-12 top-0 h-44 w-44 rounded-full bg-accent/18 blur-3xl" />

            <div className="relative">
                <p className="text-sm uppercase tracking-[0.3em] text-text-secondary">Leaderboard</p>
                <h3 className="mt-4 font-heading text-3xl text-primary">{title}</h3>
                <p className="mt-3 text-text-secondary">{subtitle}</p>

                {loading ? (
                    <p className="mt-8 text-text-secondary">Loading scores...</p>
                ) : error ? (
                    <p className="mt-8 text-secondary">{error}</p>
                ) : entries.length === 0 ? (
                    <div className="mt-8 rounded-[1.5rem] border border-primary/8 bg-white/85 px-5 py-5">
                        <p className="text-text-secondary">No scores yet. First one on the board wins the room.</p>
                    </div>
                ) : (
                    <div className="mt-8 space-y-3">
                        {entries.map((entry, index) => (
                            <div
                                key={entry.id}
                                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[1.25rem] border border-primary/8 bg-white/85 px-4 py-4 shadow-[0_8px_24px_rgba(20,42,68,0.05)]"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-medium text-primary">{entry.username}</p>
                                    <p className="text-sm text-text-secondary">{getEntrySubtitle(entry)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-heading text-2xl text-primary">{entry.score}</p>
                                    <p className="text-xs uppercase tracking-[0.24em] text-text-secondary">Points</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
