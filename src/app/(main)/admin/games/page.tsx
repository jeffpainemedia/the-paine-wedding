"use client";

import { useEffect, useState } from "react";
import AdminFrame from "@/components/admin/AdminFrame";
import AdminLoginCard from "@/components/admin/AdminLoginCard";
import GamesAdminPanel from "@/components/admin/GamesAdminPanel";
import { useAdminSession } from "@/components/admin/useAdminSession";
import type { AdminGameScore } from "@/lib/games/admin-types";
import { supabase } from "@/lib/supabase";

export default function AdminGamesPage() {
    const { status, role, login, logout } = useAdminSession();
    const [gameScores, setGameScores] = useState<AdminGameScore[]>([]);
    const [gameScoresError, setGameScoresError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function fetchGameData() {
        setLoading(true);

        const { data, error } = await supabase
            .from("game_scores")
            .select("id, game, puzzle_key, score, max_score, attempts, solved, metadata, created_at, game_players(id, username, email, created_at)")
            .order("created_at", { ascending: false })
            .limit(300);

        if (error) {
            setGameScores([]);
            setGameScoresError(
                error.message.includes("game_scores")
                    ? "Leaderboard tables are not available yet. Run the game leaderboard migration first."
                    : error.message
            );
        } else {
            setGameScores(data as unknown as AdminGameScore[]);
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
            description="Painedle, Crossing Paths, trivia, leaderboards, submissions, and player profiles live here."
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
