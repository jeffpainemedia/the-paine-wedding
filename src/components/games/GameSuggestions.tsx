"use client";

import Link from "next/link";

type Game = "painedle" | "crossword" | "trivia" | "connections";

const GAMES: Record<Game, { label: string; eyebrow: string; href: string }> = {
    painedle: {
        label: "Painedle",
        eyebrow: "Daily puzzle",
        href: "/games/painedle",
    },
    crossword: {
        label: "Crossing Paths",
        eyebrow: "Daily puzzle",
        href: "/games/crossword",
    },
    trivia: {
        label: "Couple Trivia",
        eyebrow: "Reception day",
        href: "/games/trivia",
    },
    connections: {
        label: "Connected",
        eyebrow: "Daily puzzle",
        href: "/games/connections",
    },
};

export default function GameSuggestions({ current }: { current: Game }) {
    const others = (Object.keys(GAMES) as Game[]).filter((g) => g !== current);

    return (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
                href="/games"
                className="group inline-flex items-center gap-2 self-start rounded-full border border-primary/12 bg-white/70 px-4 py-2.5 text-[11px] uppercase tracking-[0.22em] text-text-secondary transition-colors hover:bg-white hover:text-primary"
            >
                <svg
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m15 18-6-6 6-6" />
                </svg>
                Game Hub
            </Link>

            <div className="flex flex-wrap gap-2.5">
                {others.map((game) => {
                    const info = GAMES[game];
                    return (
                        <Link
                            key={game}
                            href={info.href}
                            className="group relative overflow-hidden rounded-[1.1rem] border border-primary/10 bg-white/70 px-4 py-3 transition-all duration-200 hover:bg-white hover:shadow-[0_4px_16px_rgba(20,42,68,0.08)]"
                        >
                            <p className="text-[9px] uppercase tracking-[0.22em] text-text-secondary/70 transition-colors group-hover:text-text-secondary">
                                {info.eyebrow}
                            </p>
                            <p className="mt-0.5 text-sm font-medium text-primary">{info.label}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
