"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import ScoreSubmissionForm from "@/components/games/ScoreSubmissionForm";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
    KEYBOARD_ROWS,
    MAX_GUESSES,
    WORD_LENGTH,
    getKeyboardStatusesFromHistory,
    getStorageKey,
    getTodayKey,
    type LetterStatus,
} from "@/lib/games/painedle";
import {
    captureBrowserProfile,
    fetchPlayerGameScore,
    GAME_LEADERBOARD_REFRESH_EVENT,
    getStoredGamePlayer,
    saveStoredGamePlayer,
    submitPainedleScore,
} from "@/lib/games/leaderboard";

type GameStatus = "playing" | "won" | "lost";

type SavedGameState = {
    guesses: string[];
    // Per-guess letter statuses from the server (parallel to guesses[]).
    // Cached locally so we don't re-fetch on each page load.
    statusHistory: LetterStatus[][];
    // Solution is only set after the game ends — populated by /reveal.
    solution: string | null;
    currentGuess: string;
    status: GameStatus;
    message: string;
};

function tileClasses(status?: LetterStatus, hasLetter?: boolean) {
    if (status === "correct") {
        return "border-emerald-400 bg-emerald-500 text-white shadow-[0_10px_24px_rgba(16,185,129,0.28)]";
    }

    if (status === "present") {
        return "border-[#d6b073] bg-[#c69a72] text-slate-950 shadow-[0_10px_24px_rgba(198,154,114,0.22)]";
    }

    if (status === "absent") {
        return "border-[#4e6782] bg-[#28415d] text-white";
    }

    if (hasLetter) {
        return "border-[#d8b686] bg-[#f8efe1] text-primary";
    }

    return "border-white/12 bg-[#10263d]/82 text-white/55";
}

function keyboardKeyClasses(status?: LetterStatus) {
    if (status === "correct") return "border-emerald-400 bg-emerald-500 text-white";
    if (status === "present") return "border-[#d6b073] bg-[#c69a72] text-slate-950";
    if (status === "absent") return "border-[#4e6782] bg-[#28415d] text-white";
    return "border-[#6a8097] bg-[#eef2f6] text-primary hover:bg-white";
}

function isEditableTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    const tagName = target.tagName;
    return (
        target.isContentEditable ||
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT"
    );
}

// Server-side guess check — validates the word AND returns letter statuses
// (without revealing the solution). Replaces the old "fetch word list,
// evaluate locally" client logic.
async function checkGuess(dateKey: string, guess: string): Promise<{
    valid: boolean;
    statuses?: LetterStatus[];
    correct?: boolean;
}> {
    const response = await fetch("/api/games/painedle/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey, guess }),
    });
    if (!response.ok) throw new Error("Could not check guess.");
    return response.json();
}

async function fetchSolution(dateKey: string, guesses: string[]): Promise<string | null> {
    const response = await fetch("/api/games/painedle/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey, guesses }),
    });
    if (!response.ok) return null;
    const data = await response.json() as { solution?: string };
    return data.solution ?? null;
}

function emptyState(): SavedGameState {
    return {
        guesses: [],
        statusHistory: [],
        solution: null,
        currentGuess: "",
        status: "playing",
        message: "A new wedding word every day.",
    };
}

function createInitialState(dateKey: string): SavedGameState {
    if (typeof window === "undefined") return emptyState();

    const savedState = window.localStorage.getItem(getStorageKey(dateKey));
    if (!savedState) return emptyState();

    try {
        const parsed = JSON.parse(savedState) as Partial<SavedGameState> & { guesses?: string[] };
        // Migrate: if a saved game from the old client had guesses but no
        // statusHistory, drop the saved state. The server is the source of
        // truth now and we don't want stale colors based on a different
        // word list than the server has.
        if ((parsed.guesses?.length ?? 0) > 0 && !parsed.statusHistory) {
            return emptyState();
        }
        return {
            guesses: parsed.guesses ?? [],
            statusHistory: parsed.statusHistory ?? [],
            solution: parsed.solution ?? null,
            currentGuess: parsed.currentGuess ?? "",
            status: parsed.status ?? "playing",
            message: parsed.message ?? (parsed.status === "won" ? "You already solved today's Painedle." : "Welcome back."),
        };
    } catch {
        return emptyState();
    }
}

// ─── Rules Modal ──────────────────────────────────────────────────────────────

function HelpModal({ onClose }: { onClose: () => void }) {
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={onClose}
        >
            {/* Scrim */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f2439] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Daily Puzzle</p>
                        <h3 className="mt-1 font-heading text-2xl text-white">How to Play</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
                        aria-label="Close"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Rules */}
                <div className="mt-5 space-y-2 text-sm leading-relaxed text-white/75">
                    <p>Guess the daily <strong className="font-semibold text-white">5-letter wedding word</strong> in six tries.</p>
                    <p>Type any valid word and press <strong className="font-semibold text-white">Enter</strong> to submit.</p>
                    <p>Tiles reveal how close you were after each guess.</p>
                </div>

                {/* Color legend */}
                <div className="mt-6 space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Tile Colors</p>

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.7rem] border border-emerald-400 bg-emerald-500 text-base font-bold text-white">
                            A
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Correct</p>
                            <p className="text-xs text-white/55">Right letter, right position.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.7rem] border border-[#d6b073] bg-[#c69a72] text-base font-bold text-slate-950">
                            B
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Wrong Spot</p>
                            <p className="text-xs text-white/55">In the word, but wrong position.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.7rem] border border-[#4e6782] bg-[#28415d] text-base font-bold text-white">
                            C
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Not in Word</p>
                            <p className="text-xs text-white/55">This letter is not in today&apos;s word.</p>
                        </div>
                    </div>
                </div>

                {/* Tip */}
                <p className="mt-6 rounded-[1rem] border border-white/8 bg-white/5 px-4 py-3 text-xs leading-relaxed text-white/60">
                    All words are wedding-themed — think venues, roles, vows, and celebration.
                </p>
            </div>
        </div>
    );
}

// ─── Board ────────────────────────────────────────────────────────────────────

function PainedleBoard({ dateKey }: { dateKey: string }) {
    const initialState = useRef(createInitialState(dateKey));
    const [guesses, setGuesses] = useState<string[]>(() => initialState.current.guesses);
    const [statusHistory, setStatusHistory] = useState<LetterStatus[][]>(() => initialState.current.statusHistory);
    const [solution, setSolution] = useState<string | null>(() => initialState.current.solution);
    const [currentGuess, setCurrentGuess] = useState(() => initialState.current.currentGuess);
    const [status, setStatus] = useState<GameStatus>(() => initialState.current.status);
    const [message, setMessage] = useState(() => initialState.current.message);
    const [flippingRow, setFlippingRow] = useState<number | null>(null);
    const [shakingRow, setShakingRow] = useState<number | null>(null);
    const [isCheckingGuess, setIsCheckingGuess] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [adminAnswer, setAdminAnswer] = useState<string | null>(null);
    const [showAdminAnswer, setShowAdminAnswer] = useState(false);
    const [autoSubmitStatus, setAutoSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [shareCopied, setShareCopied] = useState(false);
    const autoSubmitAttempted = useRef(false);

    const { isAdmin } = useAdminSession();

    const storageKey = getStorageKey(dateKey);
    const keyboardStatuses = getKeyboardStatusesFromHistory(guesses, statusHistory);
    const score = status === "won" ? MAX_GUESSES - guesses.length + 1 : 0;

    // Reveal solution from server once the game ends. Solution is stored in
    // state (and persisted) so subsequent renders don't need to re-fetch.
    useEffect(() => {
        if (status === "playing" || solution || guesses.length === 0) return;
        let cancelled = false;
        void fetchSolution(dateKey, guesses).then((s) => {
            if (cancelled || !s) return;
            setSolution(s);
            // If the player lost, surface the revealed word in the status
            // message now that we have it.
            if (status === "lost") {
                setMessage(`The word was ${s.toUpperCase()}.`);
            }
        });
        return () => { cancelled = true; };
    }, [status, solution, guesses, dateKey]);

    // Auto-submit score when game ends if player account is stored. First
    // checks whether the server already has a recorded score for today's
    // puzzle (e.g. the player reloaded the page after a win) so we never
    // double-post the same win to the leaderboard.
    useEffect(() => {
        if (status === "playing" || autoSubmitAttempted.current) return;
        if (status !== "won") return; // only submit wins
        if (isAdmin) return; // Admin play doesn't record scores
        const storedPlayer = getStoredGamePlayer();
        if (!storedPlayer) return;

        autoSubmitAttempted.current = true;
        let isActive = true;

        void fetchPlayerGameScore("painedle", dateKey, {
            email: storedPlayer.email,
            username: storedPlayer.username,
        })
            .then((existing) => {
                if (!isActive) return;
                if (existing) {
                    setAutoSubmitStatus("success");
                    return;
                }

                setAutoSubmitStatus("submitting");
                const browserProfile = storedPlayer.browserProfile ?? captureBrowserProfile();
                const fullName = storedPlayer.firstName && storedPlayer.lastName
                    ? `${storedPlayer.firstName} ${storedPlayer.lastName}`
                    : storedPlayer.username ?? "";
                // Server validates every guess against today's word and
                // computes the canonical score from the verified solve
                // position. Browser profile is no longer attached here — the
                // validated endpoint focuses on gameplay proof; metadata can
                // be enriched in a follow-up.
                void browserProfile;
                return submitPainedleScore({
                    dateKey,
                    guesses,
                    player: { email: storedPlayer.email ?? "", username: fullName },
                }).then(() => {
                    if (!isActive) return;
                    saveStoredGamePlayer({ ...storedPlayer, username: fullName, browserProfile });
                    setAutoSubmitStatus("success");
                    window.dispatchEvent(new Event(GAME_LEADERBOARD_REFRESH_EVENT));
                });
            })
            .catch(() => {
                if (isActive) setAutoSubmitStatus("error");
            });

        return () => {
            isActive = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, score, guesses.length, dateKey, solution, isAdmin]);

    function buildShareText() {
        const guessEmojis = guesses.map((_, idx) => {
            const statuses = statusHistory[idx];
            if (!statuses) return "";
            return statuses.map((s) => s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛").join("");
        });
        const header = `Painedle ${status === "won" ? guesses.length : "X"}/${MAX_GUESSES}`;
        return [header, ...guessEmojis, "", "thepainewedding.com/games/painedle"].join("\n");
    }

    function handleShare() {
        const text = buildShareText();
        if (navigator.share) {
            void navigator.share({ text });
        } else {
            void navigator.clipboard.writeText(text).then(() => {
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
            });
        }
    }

    useEffect(() => {
        const stateToSave: SavedGameState = {
            guesses,
            statusHistory,
            solution,
            currentGuess,
            status,
            message,
        };

        window.localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }, [currentGuess, guesses, statusHistory, solution, message, status, storageKey]);

    function triggerShake() {
        const rowIndex = guesses.length;
        setShakingRow(rowIndex);
        window.setTimeout(() => setShakingRow(null), 450);
    }

    async function handleSubmit() {
        if (status !== "playing" || isCheckingGuess) return;

        if (currentGuess.length !== WORD_LENGTH) {
            setMessage(`Enter a full ${WORD_LENGTH}-letter word.`);
            triggerShake();
            return;
        }

        const guess = currentGuess.toLowerCase();

        setIsCheckingGuess(true);

        let result;
        try {
            result = await checkGuess(dateKey, guess);
        } catch {
            setMessage("Could not validate that word right now.");
            triggerShake();
            setIsCheckingGuess(false);
            return;
        }

        if (!result.valid) {
            setMessage("That guess is not a recognized word.");
            triggerShake();
            setIsCheckingGuess(false);
            return;
        }

        const guessStatuses = result.statuses!;
        const nextGuesses = [...guesses, guess];
        const nextStatusHistory = [...statusHistory, guessStatuses];
        const nextRowIndex = nextGuesses.length - 1;
        const hasWon = Boolean(result.correct);
        const hasLost = nextGuesses.length === MAX_GUESSES && !hasWon;

        setGuesses(nextGuesses);
        setStatusHistory(nextStatusHistory);
        setCurrentGuess("");
        setFlippingRow(nextRowIndex);
        setStatus(hasWon ? "won" : hasLost ? "lost" : "playing");
        setMessage(
            hasWon
                ? "Solved. Strong work."
                : hasLost
                    ? "Out of guesses — the word will be revealed shortly."
                    : "Guess locked in."
        );
        window.setTimeout(() => setFlippingRow(null), 900);
        setIsCheckingGuess(false);
    }

    function handleKeyInput(key: string) {
        if (status !== "playing") return;

        if (key === "Enter" || key === "ENTER") {
            handleSubmit();
            return;
        }

        if (key === "Backspace") {
            setCurrentGuess((guess) => guess.slice(0, -1));
            return;
        }

        if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
            setCurrentGuess((guess) => `${guess}${key.toLowerCase()}`);
        }
    }

    const handlePhysicalKeyInput = useEffectEvent((key: string) => {
        if (showHelp) return;

        if (key === "Enter" || key === "Backspace") {
            handleKeyInput(key);
            return;
        }

        if (/^[A-Z]$/.test(key)) {
            handleKeyInput(key);
        }
    });

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            if (isEditableTarget(event.target)) return;

            const key = event.key;
            if (key === "Enter" || key === "Backspace") {
                event.preventDefault();
                void handlePhysicalKeyInput(key);
                return;
            }

            if (/^[a-zA-Z]$/.test(key)) {
                void handlePhysicalKeyInput(key.toUpperCase());
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <>
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

            <div className="relative overflow-hidden rounded-[2.3rem] border border-white/18 bg-[linear-gradient(155deg,#0f2439_0%,#15314f_58%,#1e4566_100%)] p-6 text-white shadow-[0_20px_70px_rgba(12,24,39,0.30)] md:p-10">
                <div className="pointer-events-none absolute -right-12 top-0 h-52 w-52 rounded-full bg-accent/16 blur-3xl" />
                <div className="pointer-events-none absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

                {/* Header */}
                <div className="relative flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Daily Puzzle</p>
                        <h2 className="mt-4 font-heading text-4xl text-white">Painedle</h2>
                        <p className="mt-4 max-w-2xl leading-relaxed text-white/78">
                            Guess the daily wedding word in six tries. Progress saves in your browser.
                        </p>
                    </div>

                    {/* Help / rules button */}
                    <button
                        type="button"
                        onClick={() => setShowHelp(true)}
                        className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                        aria-label="How to play"
                    >
                        ?
                    </button>
                </div>

                {/* Admin answer reveal — fetches today's word via the
                    admin-authenticated endpoint instead of bundling it. */}
                {isAdmin && (
                    <div className="relative mt-4 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                if (showAdminAnswer) {
                                    setShowAdminAnswer(false);
                                    return;
                                }
                                if (adminAnswer) {
                                    setShowAdminAnswer(true);
                                    return;
                                }
                                void fetch(`/api/admin/games/painedle-answer?dateKey=${dateKey}`)
                                    .then((r) => r.ok ? r.json() : null)
                                    .then((d: { solution?: string } | null) => {
                                        if (d?.solution) {
                                            setAdminAnswer(d.solution);
                                            setShowAdminAnswer(true);
                                        }
                                    });
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-amber-300 transition-colors hover:bg-amber-400/25"
                        >
                            {showAdminAnswer ? "Hide Answer" : "Show Answer"}
                        </button>
                        {showAdminAnswer && adminAnswer && (
                            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-1.5 font-heading text-lg uppercase tracking-[0.22em] text-amber-300">
                                {adminAnswer}
                            </span>
                        )}
                    </div>
                )}

                {/* Message */}
                <div className="relative mt-6">
                    <div className="inline-flex rounded-full border border-white/12 bg-white/8 px-5 py-3 text-sm text-white/80 backdrop-blur-sm">
                        {message}
                    </div>
                </div>

                {/* Tile grid */}
                <div className="relative mt-8 flex flex-col items-center gap-3">
                    {Array.from({ length: MAX_GUESSES }, (_, rowIndex) => {
                        const submittedGuess = guesses[rowIndex];
                        const activeGuess = rowIndex === guesses.length ? currentGuess : "";
                        const letters = (submittedGuess ?? activeGuess).padEnd(WORD_LENGTH).split("");
                        const statuses = submittedGuess ? (statusHistory[rowIndex] ?? []) : [];

                        return (
                            <div
                                key={`row-${rowIndex + 1}`}
                                className={`flex gap-2 ${shakingRow === rowIndex ? "animate-painedle-shake" : ""}`}
                            >
                                {letters.map((letter, columnIndex) => (
                                    <div
                                        key={`tile-${rowIndex + 1}-${columnIndex + 1}`}
                                        className={`flex h-14 w-14 items-center justify-center rounded-[1rem] border text-xl font-semibold uppercase tracking-[0.12em] transition-all duration-300 md:h-16 md:w-16 md:text-2xl ${tileClasses(statuses[columnIndex], Boolean(letter.trim()))} ${flippingRow === rowIndex && submittedGuess ? "animate-painedle-flip" : ""}`}
                                        style={{
                                            animationDelay: flippingRow === rowIndex && submittedGuess ? `${columnIndex * 120}ms` : undefined,
                                        }}
                                    >
                                        {letter.trim()}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>

                {/* Keyboard */}
                <div className="relative mt-6 space-y-[2px] md:space-y-1.5">
                    {KEYBOARD_ROWS.map((row) => (
                        <div key={row.join("")} className="flex justify-center gap-[2px] md:gap-1.5">
                            {row.map((key) => {
                                const isEnter = key === "ENTER";
                                const isBack = key === "BACK";
                                const isAction = isEnter || isBack;
                                const keyStatus = !isAction ? keyboardStatuses[key.toLowerCase()] : undefined;
                                const statusClass = isAction
                                    ? "border-primary bg-primary text-white hover:bg-[#1e4566]"
                                    : keyboardKeyClasses(keyStatus);
                                const sizeClass = isEnter
                                    ? "min-w-[4.5rem] px-1 md:min-w-[5.5rem] md:px-4"
                                    : "w-[calc((100vw-2rem)/10)] max-w-[3.1rem] md:w-[3.1rem]";

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            void handleKeyInput(isBack ? "Backspace" : key);
                                        }}
                                        className={`flex h-[calc((100vw-2rem)/10)] max-h-14 min-h-10 items-center justify-center rounded-[0.6rem] border text-xs font-semibold uppercase tracking-[0.05em] transition-colors duration-200 md:h-14 md:rounded-[0.9rem] md:text-sm ${sizeClass} ${statusClass}`}
                                    >
                                        {isBack ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                                <path d="M21 12H9m0 0 4-4m-4 4 4 4" />
                                                <path d="M9 12 4.5 6.5a1 1 0 0 0-1.5.8v9.4a1 1 0 0 0 1.5.8L9 12Z" />
                                            </svg>
                                        ) : key}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Post-game */}
                {status !== "playing" ? (
                    <div className="relative mt-10 space-y-4">
                        {/* Share button — always shown after game ends */}
                        <button
                            type="button"
                            onClick={handleShare}
                            className="flex w-full items-center justify-center gap-2 rounded-[1.75rem] border border-white/15 bg-white/10 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/80 transition-colors hover:bg-white/18 hover:text-white"
                        >
                            {shareCopied ? "Copied!" : "Share Result"}
                        </button>

                        {status === "won" ? (
                            isAdmin ? (
                                <div className="rounded-[1.75rem] border border-accent/25 bg-accent/12 p-5 text-center">
                                    <p className="text-sm text-white/60">Admin mode — score not recorded</p>
                                </div>
                            ) : autoSubmitStatus === "success" ? (
                                <div className="rounded-[1.75rem] border border-accent/25 bg-accent/12 p-5 text-center">
                                    <p className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                        Score Submitted
                                    </p>
                                    <p className="mt-2 text-sm text-white/60">Your Painedle score is on the leaderboard.</p>
                                </div>
                            ) : autoSubmitStatus === "submitting" ? (
                                <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5 text-center">
                                    <p className="text-sm text-white/50">Submitting score…</p>
                                </div>
                            ) : (
                                <ScoreSubmissionForm
                                    game="painedle"
                                    score={score}
                                    maxScore={MAX_GUESSES}
                                    attempts={guesses.length}
                                    solved
                                    puzzleKey={dateKey}
                                    metadata={{ solution: solution ?? null, word_length: WORD_LENGTH }}
                                    buttonLabel="Submit Painedle Score"
                                    successMessage="Painedle score submitted."
                                />
                            )
                        ) : (
                            <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-6">
                                <p className="text-sm uppercase tracking-[0.3em] text-white/60">Round Complete</p>
                                <p className="mt-3 text-white/78">
                                    Only solved games go on the leaderboard. Come back tomorrow for the next word.
                                </p>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </>
    );
}

export default function PainedleGame() {
    const [dateKey, setDateKey] = useState(() => getTodayKey());

    // Daily rollover is tied to the Central-time day key (matches server
    // word selection), not the browser's local midnight. Poll rather than
    // schedule a single local-midnight timeout, since that timeout doesn't
    // line up with the actual Central day boundary.
    useEffect(() => {
        const interval = window.setInterval(() => {
            const currentKey = getTodayKey();
            setDateKey((prev) => (prev === currentKey ? prev : currentKey));
        }, 60_000);

        return () => window.clearInterval(interval);
    }, []);

    return <PainedleBoard key={dateKey} dateKey={dateKey} />;
}
