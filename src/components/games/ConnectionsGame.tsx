"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    computeConnectionsScore,
    DIFFICULTY_BG,
    DIFFICULTY_LABELS,
    getConnectionsStorageKey,
    MAX_MISTAKES,
    type ConnectionsGroup,
    type PublicConnectionsPuzzle,
} from "@/lib/games/connections";
import ScoreSubmissionForm from "@/components/games/ScoreSubmissionForm";
import {
    submitConnectionsScore,
    saveStoredGamePlayer,
    getStoredGamePlayer,
    fetchPlayerGameScore,
    GAME_LEADERBOARD_REFRESH_EVENT,
} from "@/lib/games/leaderboard";
import { useAdminSession } from "@/hooks/useAdminSession";

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
    puzzle: PublicConnectionsPuzzle;
    dateKey: string;
};

// Server validates a 4-word selection.
async function checkSelection(puzzleId: number, words: string[]) {
    const res = await fetch("/api/games/connections/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId, words }),
    });
    if (!res.ok) throw new Error("Could not check selection.");
    return res.json() as Promise<
        | { result: "match"; group: ConnectionsGroup }
        | { result: "one_away" }
        | { result: "wrong" }
        | { result: "invalid" }
    >;
}

// Server returns the full grouping after game-over for the loss-reveal.
async function fetchSolution(puzzleId: number): Promise<ConnectionsGroup[]> {
    const res = await fetch(`/api/games/connections/solution?puzzleId=${puzzleId}`);
    if (!res.ok) throw new Error("Could not load solution.");
    const data = await res.json() as { groups: ConnectionsGroup[] };
    return data.groups;
}

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
            className={`flex flex-col items-center justify-center rounded-[1.1rem] px-4 md:px-5 py-3.5 md:py-4.5 ${DIFFICULTY_BG[group.difficulty]}`}
        >
            <p className="text-center text-xs md:text-sm font-bold uppercase tracking-[0.2em]">{group.category}</p>
            <p className="mt-1 text-center text-sm md:text-base">{group.words.join(", ")}</p>
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
    const [shuffleOrder, setShuffleOrder] = useState<string[]>(() => shuffleArray([...puzzle.words], puzzle.id));
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
    const [autoSubmitStatus, setAutoSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const autoSubmitAttempted = useRef(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pausedMs, setPausedMs] = useState(0);
    const startTimestamp = useRef<number>(0);
    const pausedSinceRef = useRef<number | null>(null);

    const { isAdmin } = useAdminSession();

    // Hydrate from localStorage
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (raw) {
                const saved = JSON.parse(raw) as SavedState;
                setSolvedGroups(saved.solvedGroups ?? []);
                setMistakes(saved.mistakes ?? 0);
                setShuffleOrder(saved.shuffleOrder ?? shuffleArray([...puzzle.words], puzzle.id));
                setSelectedWords([]);
                const savedStatus = saved.status ?? "playing";
                setStatus(savedStatus);
                setStartedAt(saved.startedAt ?? null);
                setCompletedAt(saved.completedAt ?? null);
                setScoreSubmitted(saved.scoreSubmitted ?? false);
                // Resume in-progress or show completed game without start overlay
                if (saved.startedAt || savedStatus !== "playing") {
                    setGameStarted(true);
                    if (saved.startedAt && savedStatus === "playing") {
                        startTimestamp.current = new Date(saved.startedAt).getTime();
                    }
                }
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

    // Check if player already submitted a score for today's puzzle (e.g. cleared localStorage)
    useEffect(() => {
        if (!hydrated || isAdmin) return;
        const player = getStoredGamePlayer();
        if (!player || scoreSubmitted) return;

        const puzzleKey = `connections-${puzzle.id}`;
        void fetchPlayerGameScore("connections", puzzleKey, { email: player.email, username: player.username })
            .then((existing) => {
                if (existing) {
                    autoSubmitAttempted.current = true;
                    setScoreSubmitted(true);
                    setAutoSubmitStatus("success");
                }
            })
            .catch(() => { /* ignore — non-fatal */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hydrated, isAdmin]);

    // Timer
    useEffect(() => {
        if (!gameStarted || status !== "playing" || !startedAt || isPaused) return;
        const interval = setInterval(() => {
            setElapsed(Math.round((Date.now() - startTimestamp.current - pausedMs) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [gameStarted, status, startedAt, isPaused, pausedMs]);

    // Toast helper
    const showToast = useCallback((msg: string) => {
        setToast(msg);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 2000);
    }, []);

    const remainingWords = shuffleOrder.filter(
        (w) => !solvedGroups.some((g) => g.words.includes(w))
    );

    function handleStartGame() {
        const now = new Date().toISOString();
        startTimestamp.current = Date.now();
        setStartedAt(now);
        setGameStarted(true);
    }

    function handlePause() {
        if (isPaused) {
            const now = Date.now();
            if (pausedSinceRef.current !== null) {
                setPausedMs((prev) => prev + (now - pausedSinceRef.current!));
                pausedSinceRef.current = null;
            }
            setIsPaused(false);
        } else {
            pausedSinceRef.current = Date.now();
            setIsPaused(true);
        }
    }

    function handleWordClick(word: string) {
        if (status !== "playing" || animatingGroup || isSubmitting || !gameStarted || isPaused) return;

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

        let response: Awaited<ReturnType<typeof checkSelection>>;
        try {
            response = await checkSelection(puzzle.id, selectedWords);
        } catch {
            // Network failure — let the player retry without penalty.
            setIsSubmitting(false);
            showToast("Connection issue. Try again.");
            return;
        }

        if (response.result === "match") {
            const match = response.group;
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
            return;
        }

        // Wrong or one-away both count as a mistake.
        setShakingWords(selectedWords);
        setTimeout(() => setShakingWords([]), 500);

        if (response.result === "one_away") showToast("One away!");

        const newMistakes = mistakes + 1;
        setMistakes(newMistakes);
        setSelectedWords([]);

        if (newMistakes >= MAX_MISTAKES) {
            const now = new Date().toISOString();
            setCompletedAt(now);
            setStatus("lost");
            // Server reveals all groups for the loss-state UI.
            try {
                const groups = await fetchSolution(puzzle.id);
                setSolvedGroups([...groups].sort((a, b) => a.difficulty - b.difficulty));
            } catch {
                // If solution fetch fails, we just won't reveal — game still ends.
            }
        }

        setIsSubmitting(false);
    }

    // Auto-submit when game ends and player profile exists
    useEffect(() => {
        if (status === "playing" || autoSubmitAttempted.current || scoreSubmitted) return;
        if (isAdmin) return; // Admin play doesn't record scores
        const player = getStoredGamePlayer();
        if (!player) return;

        autoSubmitAttempted.current = true;
        setAutoSubmitStatus("submitting");

        const fullName = player.firstName && player.lastName
            ? `${player.firstName} ${player.lastName}`
            : player.username ?? "";
        const duration = getDurationSeconds(startedAt, completedAt);

        // Validated submission: server re-checks each "solved" group against
        // the puzzle's answer key and computes the score itself. Wins only.
        if (status !== "won") {
            setAutoSubmitStatus("success");
            setScoreSubmitted(true);
            return;
        }
        submitConnectionsScore({
            puzzleId: puzzle.id,
            solvedCategories: solvedGroups.map((g) => g.category),
            mistakes,
            durationSeconds: duration,
            player: { email: player.email ?? "", username: fullName },
        })
            .then(() => {
                saveStoredGamePlayer({ email: player.email, username: fullName, firstName: player.firstName, lastName: player.lastName, browserProfile: player.browserProfile });
                setAutoSubmitStatus("success");
                setScoreSubmitted(true);
                window.dispatchEvent(new CustomEvent(GAME_LEADERBOARD_REFRESH_EVENT));
            })
            .catch(() => {
                setAutoSubmitStatus("error");
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, isAdmin]);

    const rawDurationSeconds = getDurationSeconds(startedAt, completedAt ?? (status !== "playing" ? new Date().toISOString() : null));
    const durationSeconds = Math.max(0, rawDurationSeconds - Math.round(pausedMs / 1000));
    const finalScore = computeConnectionsScore(mistakes, durationSeconds);

    if (!hydrated) return null;

    return (
        <div className="mx-auto w-full max-w-xl">
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">
                    {status === "won"
                        ? "Solved!"
                        : status === "lost"
                            ? "Better luck tomorrow"
                            : !gameStarted
                                ? "0:00"
                                : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`}
                </p>
                <div className="flex items-center gap-2">
                    {gameStarted && status === "playing" && (
                        <button
                            type="button"
                            onClick={handlePause}
                            className="whitespace-nowrap rounded-full border border-primary/20 px-3 py-1.5 text-[10px] uppercase tracking-widest text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
                        >
                            {isPaused ? "Resume" : "Pause"}
                        </button>
                    )}
                    <button
                        onClick={() => setShowHelp(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/12 bg-white/70 text-xs font-semibold text-primary transition-colors hover:bg-white"
                    >
                        ?
                    </button>
                </div>
            </div>

            {/* Game area with start/pause overlays */}
            <div className="relative">
                {/* Start overlay */}
                <div
                    className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 rounded-[1.5rem] bg-[rgba(23,55,86,0.52)] px-8 text-center backdrop-blur-sm transition-opacity duration-300 ${
                        !gameStarted ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                >
                    <p className="text-xs uppercase tracking-[0.35em] text-white/55">Ready to play?</p>
                    <p className="max-w-xs text-sm leading-relaxed text-white/70">
                        Find four groups of four. The timer starts when you do.
                    </p>
                    <button
                        type="button"
                        onClick={handleStartGame}
                        className="rounded-full bg-accent px-10 py-3.5 text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                        Start
                    </button>
                </div>

                {/* Pause overlay */}
                <div
                    className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-[rgba(23,55,86,0.52)] backdrop-blur-sm transition-opacity duration-300 ${
                        isPaused ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                >
                    <p className="text-xs uppercase tracking-[0.3em] text-white/55">Paused</p>
                    <button
                        type="button"
                        onClick={handlePause}
                        className="rounded-full bg-accent px-8 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-transform hover:scale-105 active:scale-95"
                    >
                        Resume
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
                        <div className="mt-2 grid grid-cols-4 gap-1.5 md:gap-2">
                            {remainingWords.map((word) => {
                                const isSelected = selectedWords.includes(word);
                                const isShaking = shakingWords.includes(word);
                                const isAnimating = animatingGroup?.words.includes(word);
                                // Auto-shrink text for longer words so 10-letter
                                // tiles like SOUNDTRACK don't overflow on phone widths.
                                const sizeClass =
                                    word.length >= 10 ? "text-[8px] md:text-xs tracking-normal"
                                    : word.length >= 8 ? "text-[10px] md:text-sm tracking-[0.08em]"
                                    : "text-xs md:text-sm tracking-[0.12em]";
                                return (
                                    <button
                                        key={word}
                                        onClick={() => handleWordClick(word)}
                                        disabled={!!animatingGroup || isSubmitting}
                                        className={[
                                            "relative flex min-h-[3.5rem] md:min-h-[4.25rem] items-center justify-center rounded-[0.9rem] border px-1 md:px-2 py-3 md:py-3.5 text-center font-bold uppercase transition-all duration-200 select-none",
                                            sizeClass,
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
                            <div className="flex w-full flex-wrap justify-center gap-2 md:gap-3">
                                <button
                                    onClick={handleShuffle}
                                    className="rounded-full border border-primary/15 bg-white/70 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm uppercase tracking-[0.18em] sm:tracking-[0.2em] text-primary transition-colors hover:bg-white"
                                >
                                    Shuffle
                                </button>
                                <button
                                    onClick={handleDeselectAll}
                                    disabled={selectedWords.length === 0}
                                    className="rounded-full border border-primary/15 bg-white/70 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm uppercase tracking-[0.18em] sm:tracking-[0.2em] text-primary transition-colors hover:bg-white disabled:opacity-40"
                                >
                                    Deselect All
                                </button>
                                <button
                                    onClick={() => void handleSubmit()}
                                    disabled={selectedWords.length !== 4 || !!animatingGroup || isSubmitting}
                                    className="rounded-full bg-primary px-5 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm uppercase tracking-[0.18em] sm:tracking-[0.2em] text-white shadow-md transition-all hover:bg-primary/90 disabled:opacity-40"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>{/* end game area */}

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

                    {/* Score submission */}
                    {isAdmin ? (
                        <div className="rounded-[1.5rem] border border-accent/20 bg-accent/8 px-5 py-4 text-center text-sm text-text-secondary">
                            Admin mode — score not recorded
                        </div>
                    ) : (
                        <>
                            {autoSubmitStatus === "submitting" && (
                                <div className="rounded-[1.5rem] border border-primary/8 bg-white/85 px-5 py-4 text-center text-sm text-text-secondary">
                                    Submitting score…
                                </div>
                            )}
                            {autoSubmitStatus === "success" && (
                                <div className="rounded-[1.5rem] border border-accent/30 bg-accent/10 px-5 py-4 text-center text-sm text-primary">
                                    Score submitted ✓ Your Connected score is on the leaderboard.
                                </div>
                            )}
                            {(autoSubmitStatus === "error" || autoSubmitStatus === "idle") && !scoreSubmitted && (
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
                            {scoreSubmitted && autoSubmitStatus !== "success" && (
                                <p className="text-center text-sm text-text-secondary">Score submitted ✓</p>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
