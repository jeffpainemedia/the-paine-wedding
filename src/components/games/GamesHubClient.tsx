"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    CONNECTIONS_UNLOCK_LABEL,
    CROSSWORD_UNLOCK_LABEL,
    getConnectionsUnlockDate,
    getCrosswordUnlockDate,
    getTimeRemaining,
    getTriviaUnlockDate,
    TRIVIA_UNLOCK_LABEL,
} from "@/lib/games/schedule";
import { useAdminSession } from "@/hooks/useAdminSession";

function CountdownCard({
    eyebrow,
    title,
    copy,
    href,
    cta,
    status,
    remaining,
    unlockLabel,
    muted = false,
    forceUnlocked = false,
}: {
    eyebrow: string;
    title: string;
    copy: string;
    href: string;
    cta: string;
    status: string;
    remaining: ReturnType<typeof getTimeRemaining>;
    unlockLabel?: string;
    muted?: boolean;
    forceUnlocked?: boolean;
}) {
    const isUnlocked = remaining.isUnlocked || forceUnlocked;

    const sharedContent = (
        <>
            <div className="relative">
                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm uppercase tracking-[0.3em] text-text-secondary/80">{eyebrow}</p>
                    <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
                        isUnlocked
                            ? "border-primary/15 bg-primary text-white"
                            : muted
                                ? "border-secondary/20 bg-white/80 text-secondary"
                                : "border-primary/12 bg-white/85 text-primary"
                    }`}>
                        {isUnlocked && !remaining.isUnlocked ? "Admin Preview" : status}
                    </span>
                </div>

                <h2 className={`mt-5 font-heading text-4xl md:text-5xl ${isUnlocked ? "text-primary" : muted ? "text-primary/68" : "text-primary/78"}`}>
                    {title}
                </h2>
                <p className={`mt-4 max-w-xl leading-relaxed ${isUnlocked ? "text-text-secondary" : muted ? "text-text-secondary/72" : "text-text-secondary/82"}`}>
                    {copy}
                </p>

                {isUnlocked ? (
                    <p className="mt-8 text-sm uppercase tracking-[0.24em] text-primary">
                        {cta}
                    </p>
                ) : (
                    <>
                        <div className="mt-8 grid grid-cols-4 gap-2">
                            {[
                                { label: "Days", value: remaining.days },
                                { label: "Hr", value: remaining.hours },
                                { label: "Min", value: remaining.minutes },
                                { label: "Sec", value: remaining.seconds },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="surface-inset flex min-w-0 flex-col items-center justify-center px-2 py-3 text-center"
                                >
                                    <p className="font-heading text-2xl lg:text-3xl text-primary">{item.value}</p>
                                    <p className="mt-1 text-[9px] uppercase tracking-wider text-text-secondary truncate">{item.label}</p>
                                </div>
                            ))}
                        </div>
                        {unlockLabel ? (
                            <p className="mt-6 text-xs uppercase tracking-[0.26em] text-secondary">
                                Opens {unlockLabel}
                            </p>
                        ) : null}
                    </>
                )}
            </div>
        </>
    );

    if (isUnlocked) {
        return (
            <Link
                href={href}
                className="surface-panel group relative block overflow-hidden p-8 transition-all duration-300 hover:-translate-y-1 md:p-9"
            >
                {sharedContent}
            </Link>
        );
    }

    return (
        <div
            className={`surface-panel relative overflow-hidden p-8 md:p-9 ${muted ? "opacity-80" : ""}`}
        >
            {sharedContent}
        </div>
    );
}

export default function GamesHubClient() {
    const [crosswordRemaining, setCrosswordRemaining] = useState(() => getTimeRemaining(getCrosswordUnlockDate()));
    const [triviaRemaining, setTriviaRemaining] = useState(() => getTimeRemaining(getTriviaUnlockDate()));
    const [connectionsRemaining, setConnectionsRemaining] = useState(() => getTimeRemaining(getConnectionsUnlockDate()));
    const { isAdmin } = useAdminSession();

    useEffect(() => {
        const interval = window.setInterval(() => {
            setCrosswordRemaining(getTimeRemaining(getCrosswordUnlockDate()));
            setTriviaRemaining(getTimeRemaining(getTriviaUnlockDate()));
            setConnectionsRemaining(getTimeRemaining(getConnectionsUnlockDate()));
        }, 1000);

        return () => window.clearInterval(interval);
    }, []);

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
            <Link
                href="/games/painedle"
                className="surface-panel group relative block overflow-hidden p-8 transition-all duration-300 hover:-translate-y-1 md:p-10"
            >
                <div className="relative">
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-sm uppercase tracking-[0.3em] text-text-secondary">Game One</p>
                        <span className="rounded-full border border-primary/15 bg-primary px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white">
                            Live Now
                        </span>
                    </div>
                    <h2 className="mt-5 font-heading text-4xl text-primary md:text-5xl">Painedle</h2>
                    <p className="mt-4 max-w-xl leading-relaxed text-text-secondary">
                        Crack the daily wedding word in six guesses. Every board saves in your browser, and every
                        solved round can land on the leaderboard.
                    </p>

                    <p className="mt-8 text-sm uppercase tracking-[0.24em] text-primary">
                        Play Painedle
                    </p>
                </div>
            </Link>

            <CountdownCard
                eyebrow="Game Two"
                title="Crossing Paths"
                copy="A fill-in-the-blank puzzle built from Ashlyn and Jeffrey's story — solve the crossword every day to climb the leaderboard."
                href="/games/crossword"
                cta="Open Crossword"
                status={crosswordRemaining.isUnlocked ? "Live Now" : "Unlocks Soon"}
                remaining={crosswordRemaining}
                unlockLabel={CROSSWORD_UNLOCK_LABEL}
                forceUnlocked={isAdmin}
            />

            <CountdownCard
                eyebrow="Game Three"
                title="Connected"
                copy="Sort 16 words into four hidden groups. A fresh puzzle every day — find them all with the fewest mistakes."
                href="/games/connections"
                cta="Play Connected"
                status={connectionsRemaining.isUnlocked ? "Live Now" : "Unlocks Soon"}
                remaining={connectionsRemaining}
                unlockLabel={CONNECTIONS_UNLOCK_LABEL}
                forceUnlocked={isAdmin}
            />

            <CountdownCard
                eyebrow="Game Four"
                title="Couple Trivia"
                copy="Reception-day trivia stays locked until the wedding so the room can play it live together."
                href="/games/trivia"
                cta="Open Trivia"
                status={triviaRemaining.isUnlocked ? "Open" : "Locked"}
                remaining={triviaRemaining}
                unlockLabel={TRIVIA_UNLOCK_LABEL}
                muted={!isAdmin}
                forceUnlocked={isAdmin}
            />

            {/* Admin tools panel — only visible to admins */}
            {isAdmin && (
                <div className="relative overflow-hidden rounded-[2rem] border border-secondary/25 bg-secondary/5 p-6 shadow-[0_8px_30px_rgba(124,31,40,0.08)]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-secondary/70">Admin Mode</p>
                            <h3 className="mt-2 font-heading text-2xl text-secondary">Games Admin</h3>
                            <p className="mt-2 text-sm leading-relaxed text-secondary/70">
                                All games are unlocked for preview. Crossword and Trivia show as live — guests still see the real gate.
                            </p>
                        </div>
                        <span className="mt-1 shrink-0 rounded-full border border-secondary/40 bg-secondary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-secondary">
                            Master
                        </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                            href="/admin/games"
                            className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary transition-colors hover:bg-white hover:border-secondary/60"
                        >
                            Games Dashboard
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                <path d="M9 6l6 6-6 6" />
                            </svg>
                        </Link>
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-transparent px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-secondary/70 transition-colors hover:bg-secondary/5 hover:text-secondary"
                        >
                            Admin Home
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
