"use client";

import { useState } from "react";
import {
    captureBrowserProfile,
    GAME_LEADERBOARD_REFRESH_EVENT,
    getStoredGamePlayer,
    saveStoredGamePlayer,
    submitGameScore,
    type GameType,
} from "@/lib/games/leaderboard";

type ScoreSubmissionFormProps = {
    game: GameType;
    score: number;
    maxScore?: number | null;
    attempts?: number | null;
    solved?: boolean | null;
    puzzleKey?: string;
    metadata?: Record<string, string | number | boolean | null>;
    buttonLabel?: string;
    successMessage?: string;
    onSubmitted?: () => void;
};

export default function ScoreSubmissionForm({
    game,
    score,
    maxScore = null,
    attempts = null,
    solved = null,
    puzzleKey,
    metadata,
    buttonLabel = "Submit Score",
    successMessage = "Score submitted.",
    onSubmitted,
}: ScoreSubmissionFormProps) {
    const storedPlayer = getStoredGamePlayer();
    const [username, setUsername] = useState(() => storedPlayer?.username ?? "");
    const [email, setEmail] = useState(() => storedPlayer?.email ?? "");
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setStatus("submitting");
        setMessage("");

        const browserProfile = storedPlayer?.browserProfile ?? captureBrowserProfile();

        try {
            await submitGameScore({
                game,
                username,
                email,
                score,
                maxScore,
                attempts,
                solved,
                puzzleKey,
                metadata: {
                    ...(metadata ?? {}),
                    browser_language: browserProfile?.language ?? null,
                    browser_languages: browserProfile?.languages ?? null,
                    browser_platform: browserProfile?.platform ?? null,
                    browser_timezone: browserProfile?.timezone ?? null,
                    browser_user_agent: browserProfile?.userAgent ?? null,
                    browser_screen: browserProfile?.screen ?? null,
                },
            });

            saveStoredGamePlayer({ username, email, browserProfile });
            setStatus("success");
            setMessage(successMessage);
            window.dispatchEvent(new Event(GAME_LEADERBOARD_REFRESH_EVENT));
            onSubmitted?.();
        } catch {
            setStatus("error");
            setMessage("Could not submit score right now.");
        }
    }

    if (status === "success") {
        return (
            <div className="rounded-[1.85rem] border border-emerald-200/70 bg-[linear-gradient(160deg,#f2faf5_0%,#e8f5ed_100%)] p-6 shadow-[0_12px_34px_rgba(20,42,68,0.06)]">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">Score Submitted</p>
                <p className="mt-3 text-text-secondary">{successMessage}</p>
            </div>
        );
    }

    return (
        <div className="rounded-[1.85rem] border border-primary/10 bg-[linear-gradient(160deg,#fffaf4_0%,#f3ebe0_100%)] p-6 shadow-[0_12px_34px_rgba(20,42,68,0.08)]">
            <p className="text-sm uppercase tracking-[0.3em] text-text-secondary">Claim Your Score</p>
            <p className="mt-3 text-text-secondary">
                {storedPlayer
                    ? `Submitting as ${storedPlayer.username}.`
                    : "Add a username and email to show up on the leaderboard."}
            </p>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
                {storedPlayer ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="min-w-0 rounded-[1rem] border border-primary/12 bg-white px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.22em] text-text-secondary">Username</p>
                            <p className="mt-2 truncate text-text-primary">{username}</p>
                        </div>
                        <div className="min-w-0 rounded-[1rem] border border-primary/12 bg-white px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.22em] text-text-secondary">Email</p>
                            <p className="mt-2 truncate text-text-primary">{email}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <input
                            type="text"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="Username"
                            required
                            className="rounded-[1rem] border border-primary/12 bg-white px-4 py-3 text-text-primary outline-none transition-colors focus:border-accent"
                        />
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Email address"
                            required
                            className="rounded-[1rem] border border-primary/12 bg-white px-4 py-3 text-text-primary outline-none transition-colors focus:border-accent"
                        />
                    </>
                )}
                <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40 disabled:hover:translate-y-0"
                >
                    {status === "submitting" ? "Submitting..." : buttonLabel}
                </button>
            </form>

            {message && status === "error" ? (
                <p className="mt-4 text-sm text-secondary">{message}</p>
            ) : null}
        </div>
    );
}
