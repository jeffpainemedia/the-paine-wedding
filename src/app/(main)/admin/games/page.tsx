"use client";

import { useEffect, useState } from "react";
import AdminFrame from "@/components/admin/AdminFrame";
import AdminLoginCard from "@/components/admin/AdminLoginCard";
import GamesAdminPanel from "@/components/admin/GamesAdminPanel";
import { useAdminSession } from "@/components/admin/useAdminSession";
import type { AdminGameScore } from "@/lib/games/admin-types";

export default function AdminGamesPage() {
    const { status, role, login, logout } = useAdminSession();
    const [gameScores, setGameScores] = useState<AdminGameScore[]>([]);
    const [gameScoresError, setGameScoresError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function fetchGameData() {
        setLoading(true);
        const response = await fetch("/api/admin/game-scores", { credentials: "same-origin" });
        const payload = await response.json() as { gameScores?: AdminGameScore[]; error?: string };

        if (!response.ok) {
            setGameScores([]);
            setGameScoresError(
                (payload.error ?? "").includes("game_scores")
                    ? "Leaderboard tables are not available yet. Run the game leaderboard migration first."
                    : (payload.error ?? "Failed to load game scores.")
            );
        } else {
            setGameScores(payload.gameScores ?? []);
            setGameScoresError(null);
        }

        setLoading(false);
    }

    useEffect(() => {
        if (status !== "authenticated") return;

        const timer = window.setTimeout(() => {
            void fetchGameData();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [status]);

    if (status === "checking") {
        return <div className="min-h-screen bg-base" />;
    }

    if (status !== "authenticated") {
        return <AdminLoginCard onLogin={login} />;
    }

    return (
        <AdminFrame
            section="games"
            role={role}
            title="Games Admin"
            description="Painedle, mini crossword, trivia, leaderboards, submissions, and player profiles live here."
            onLogout={logout}
        >
            {loading ? (
                <div className="py-16 text-center text-text-secondary">Loading game data...</div>
            ) : (
                <GamesAdminPanel gameScores={gameScores} gameScoresError={gameScoresError} />
            )}
        </AdminFrame>
    );
}
