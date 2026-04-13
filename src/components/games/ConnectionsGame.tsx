"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    checkOneAway,
    computeConnectionsScore,
    DIFFICULTY_BG,
    DIFFICULTY_LABELS,
    findMatchingGroup,
    getConnectionsStorageKey,
    MAX_MISTAKES,
    type ConnectionsGroup,
    type ConnectionsPuzzle,
} from "@/lib/games/connections";
import ScoreSubmissionForm from "@/components/games/ScoreSubmissionForm";

// ── Types ─────────────────────────────────────────────────────────────────────

type GameStatus = "playing" | "won" | "lost";

type SavedState = {
    selectedWords: string[];
    solvedGroups: ConnectionsGroup[];
    mistakes: number;
    shuffleOrder: string[];
    status: GameStatus;
    startedAt: string | null;
    completedAt: string | null;
    scoreSubmitted: boolean;
};

type ConnectionsGameProps = {
    puzzle: ConnectionsPuzzle;
    dateKey: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[], seed: number): T[] {
    const result = [...arr];
    let s = seed;
    for (let i = result.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        const j = Math.abs(s) % (i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function getDurationSeconds(startedAt: string | null, completedAt: string | null): number {
    if (!startedAt) return 0;
    const end = completedAt ? new Date(completedAt) : new Date();
    return Math.floor((end.getTime() - new Date(startedAt).getTime()) / 1000);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MistakeDots({ remaining }: { remaining: number }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-text-secondary">Mistakes remaining:</span>
            <div className="flex gap-1.5">
                {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-3.5 w-3.5 rounded-full transition-all duration-300 ${
                            i < remaining ? "bg-primary" : "bg-primary/15"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

function SolvedGroupRow({ group }: { group: ConnectionsGroup }) {
    return (
        <div
            className={`flex flex-col items-center justify-center rounded-[1.1rem] px-4 py-3.5 ${DIFFICULTY_BG[group.difficulty]}`}
        >
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em]">{group.category}</p>
            <p className="mt-1 text-center text-sm">{group.words.join(", ")}</p>
        </div>
    );
}

function HelpModal({ onClose }: { onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md rounded-[2rem] border border-primary/10 bg-white p-8 shadow-[0_24px_80px_rgba(20,42,68,0.18)]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/8 text-primary transition-colors hover:bg-primary/15"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>
                <p className="text-xs uppercase tracking-[0.3em] text-accent">How to play</p>
                <h3 className="mt-3 font-heading text-3xl text-primary">Connected</h3>
                <div className="mt-5 space-y-3 text-text-secondary">
                    <p>Find four groups of four words that share something in common.</p>
                    <p>Select four words, then tap <strong className="text-primary">Submit</strong> to check your answer.</p>
                    <p>You have <strong className="text-primary">four mistakes</strong> before the puzzle ends.</p>
                    <p>If three of your selected words belong to the same group, you&apos;ll get a hint.</p>
                </div>
                <div className="mt-6 space-y-2">
                    {([1, 2, 3, 4] as const).map((d) => (
                        <div key={d} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${DIFFICULTY_BG[d]}`}>
                            <span className="text-xs font-bold uppercase tracking-wider">{DIFFICULTY_LABELS[d]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ConnectionsGame({ puzzle, dateKey }: ConnectionsGameProps) {
    const storageKey = getConnectionsStorageKey(puzzle.id, dateKey);

    // Load or initialize state
    const [solvedGroups, setSolvedGroups] = useState<ConnectionsGroup[]>([]);
    const [mistakes, setMistakes] = useState(0);
    const [shuffleOrder, setShuffleOrder] = useState<string[]>(() => puzzle.words);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [status, setStatus] = useState<GameStatus>("playing");
    const [startedAt, setStartedAt] = useState<string | null>(null);
    const [completedAt, setCompletedAt] = useState<string | null>(null);
    const [scoreSubmitted, setScoreSubmitted] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [shakingWords, setShakingWords] = useState<string[]>([]);
    const [animatingGroup, setAnimatingGroup] = useState<ConnectionsGroup | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [hydrated, setHydrated] = useState(false);

    // Hydrate from localStorage
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (raw) {
                const saved = JSON.parse(raw) as SavedState;
                setSolvedGroups(saved.solvedGroups ?? []);
                setMistakes(saved.mistakes ?? 0);
                setShuffleOrder(saved.shuffleOrder ?? puzzle.words);
                setSelectedWords([]);
                setStatus(saved.status ?? "playing");
                setStartedAt(saved.startedAt ?? null);
                setCompletedAt(saved.completedAt ?? null);
                setScoreSubmitted(saved.scoreSubmitted ?? false);
            }
        } catch {
            // ignore
        }
        setHydrated(true);
    }, [storageKey, puzzle.words]);

    // Persist state
    useEffect(() => {
        if (!hydrated) return;
        try {
            const saved: SavedState = {
                selectedWords,
                solvedGroups,
                mistakes,
                shuffleOrder,
                status,
                startedAt,
                completedAt,
                scoreSubmitted,
            };
            window.localStorage.setItem(storageKey, JSON.stringify(saved));
        } catch {
            // ignore
        }
    }, [hydrated, storageKey, selectedWords, solvedGroups, mistakes, shuffleOrder, status, startedAt, completedAt, scoreSubmitted]);

    // Timer
    useEffect(() => {
        if (status !== "playing" || !startedAt) return;
        const interval = setInterval(() => {
            setElapsed(getDurationSeconds(startedAt, null));
        }, 1000);
        return () => clearInterval(interval);
    }, [status, startedAt]);

    // Toast helper
    const showToast = useCallback((msg: string) => {
        setToast(msg);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 2000);
    }, []);

    const remainingWords = shuffleOrder.filter(
        (w) => !solvedGroups.some((g) => g.words.includes(w))
    );
    const unsolvedGroups = puzzle.groups.filter(
        (g) => !solvedGroups.some((s) => s.category === g.category)
    );

    function handleWordClick(word: string) {
        if (status !== "playing" || animatingGroup || isSubmitting) return;
        if (!startedAt) setStartedAt(new Date().toISOString());

        setSelectedWords((prev) => {
            if (prev.includes(word)) return prev.filter((w) => w !== word);
            if (prev.length >= 4) return prev;
            return [...prev, word];
        });
    }

    function handleShuffle() {
        if (status !== "playing") return;
        setShuffleOrder((prev) => {
            const solved = prev.filter((w) => solvedGroups.some((g) => g.words.includes(w)));
            const unsolved = prev.filter((w) => !solvedGroups.some((g) => g.words.includes(w)));
            return [...solved, ...shuffleArray(unsolved, Date.now())];
        });
    }

    function handleDeselectAll() {
        setSelectedWords([]);
    }

    async function handleSubmit() {
        if (selectedWords.length !== 4 || status !== "playing" || isSubmitting || animatingGroup) return;
        setIsSubmitting(true);

        const match = findMatchingGroup(selectedWords, unsolvedGroups);

        if (match) {
            setAnimatingGroup(match);
            setTimeout(() => {
                setSolvedGroups((prev) => {
                    const next = [...prev, match];
                    if (next.length === 4) {
                        const now = new Date().toISOString();
                        setCompletedAt(now);
                        setStatus("won");
                    }
                    return next;
                });
                setSelectedWords([]);
                setAnimatingGroup(null);
                setIsSubmitting(false);
            }, 600);
        } else {
            const oneAway = checkOneAway(selectedWords, unsolvedGroups);
            if (oneAway) showToast("One away!");

            setShakingWords(selectedWords);
            setTimeout(() => setShakingWords([]), 500);

            const newMistakes = mistakes + 1;
            setMistakes(newMistakes);
            setSelectedWords([]);

            if (newMistakes >= MAX_MISTAKES) {
                const now = new Date().toISOString();
                setCompletedAt(now);
                setStatus("lost");
                // Reveal all groups in order
                setSolvedGroups(
                    [...puzzle.groups].sort((a, b) => a.difficulty - b.difficulty)
                );
            }

            setIsSubmitting(false);
        }
    }

    const durationSeconds = getDurationSeconds(startedAt, completedAt ?? (status !== "playing" ? new Date().toISOString() : null));
    const finalScore = computeConnectionsScore(mistakes, durationSeconds);

    if (!hydrated) return null;

    return (
        <div className="mx-auto w-full max-w-lg">
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">
                    {status === "playing"
                        ? elapsed > 0
                            ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`
                            : "Ready"
                        : status === "won"
                            ? "Solved!"
                            : "Better luck tomorrow"}
                </p>
                <button
                    onClick={() => setShowHelp(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/12 bg-white/70 text-xs font-semibold text-primary transition-colors hover:bg-white"
                >
                    ?
                </button>
            </div>

            {/* Toast */}
            {toast && (
                <div className="mb-4 flex justify-center">
                    <div className="rounded-full border border-primary/10 bg-primary px-5 py-2 text-sm text-white shadow-lg">
                        {toast}
                    </div>
                </div>
            )}

            {/* Solved groups */}
            <div className="space-y-2">
                {solvedGroups.map((g) => (
                    <SolvedGroupRow key={g.category} group={g} />
                ))}
            </div>

            {/* Word grid */}
            {status === "playing" && (
                <>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                        {remainingWords.map((word) => {
                            const isSelected = selectedWords.includes(word);
                            const isShaking = shakingWords.includes(word);
                            const isAnimating = animatingGroup?.words.includes(word);
                            return (
                                <button
                                    key={word}
                                    onClick={() => handleWordClick(word)}
                                    disabled={!!animatingGroup || isSubmitting}
                                    className={[
                                        "relative flex min-h-[3.5rem] items-center justify-center rounded-[0.9rem] border px-1 py-3 text-center text-xs font-bold uppercase tracking-[0.12em] transition-all duration-200 select-none",
                                        isAnimating
                                            ? "scale-105 border-transparent bg-primary text-white shadow-lg"
                                            : isSelected
                                                ? "border-primary bg-primary text-white shadow-md"
                                                : "border-primary/12 bg-white/85 text-primary hover:bg-white hover:shadow-md active:scale-95",
                                        isShaking ? "animate-shake" : "",
                                    ].join(" ")}
                                >
                                    {word}
                                </button>
                            );
                        })}
                    </div>

                    {/* Controls */}
                    <div className="mt-5 flex flex-col items-center gap-4">
                        <MistakeDots remaining={MAX_MISTAKES - mistakes} />
                        <div className="flex gap-3">
                            <button
                                onClick={handleShuffle}
                                className="rounded-full border border-primary/15 bg-white/70 px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:bg-white"
                            >
                                Shuffle
                            </button>
                            <button
                                onClick={handleDeselectAll}
                                disabled={selectedWords.length === 0}
                                className="rounded-full border border-primary/15 bg-white/70 px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:bg-white disabled:opacity-40"
                            >
                                Deselect All
                            </button>
                            <button
                                onClick={() => void handleSubmit()}
                                disabled={selectedWords.length !== 4 || !!animatingGroup || isSubmitting}
                                className="rounded-full bg-primary px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-white shadow-md transition-all hover:bg-primary/90 disabled:opacity-40"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Game over */}
            {(status === "won" || status === "lost") && (
                <div className="mt-8 space-y-5">
                    <div className="rounded-[1.5rem] border border-primary/10 bg-white/85 p-6 text-center shadow-md">
                        <p className="font-heading text-5xl text-primary">{finalScore}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.3em] text-text-secondary">Points</p>
                        <div className="mt-4 flex justify-center gap-6 text-sm text-text-secondary">
                            <span>{mistakes} mistake{mistakes === 1 ? "" : "s"}</span>
                            <span>
                                {Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, "0")}
                            </span>
                        </div>
                    </div>

                    {!scoreSubmitted && (
                        <ScoreSubmissionForm
                            game="connections"
                            score={finalScore}
                            maxScore={100}
                            attempts={mistakes}
                            solved={status === "won"}
                            puzzleKey={`connections-${puzzle.id}`}
                            metadata={{
                                duration_seconds: durationSeconds,
                                mistakes,
                                completed_at: completedAt ?? new Date().toISOString(),
                            }}
                            buttonLabel="Submit Score"
                            successMessage="Score submitted!"
                            onSubmitted={() => setScoreSubmitted(true)}
                        />
                    )}

                    {scoreSubmitted && (
                        <p className="text-center text-sm text-text-secondary">Score submitted ✓</p>
                    )}
                </div>
            )}
        </div>
    );
}
