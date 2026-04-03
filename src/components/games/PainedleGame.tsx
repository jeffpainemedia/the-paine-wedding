"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import ScoreSubmissionForm from "@/components/games/ScoreSubmissionForm";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
    KEYBOARD_ROWS,
    MAX_GUESSES,
    WORD_LENGTH,
    evaluateGuess,
    getDailyWord,
    getStorageKey,
    getTodayKey,
    getWordStatusMap,
    type LetterStatus,
} from "@/lib/games/painedle";
import {
    captureBrowserProfile,
    GAME_LEADERBOARD_REFRESH_EVENT,
    getStoredGamePlayer,
    saveStoredGamePlayer,
    submitGameScore,
} from "@/lib/games/leaderboard";

type GameStatus = "playing" | "won" | "lost";

type SavedGameState = {
    guesses: string[];
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

async function validateGuessWord(guess: string) {
    const response = await fetch("/api/games/validate-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: guess }),
    });

    if (!response.ok) {
        throw new Error("Could not validate word.");
    }

    const data = await response.json() as { valid?: boolean };
    return Boolean(data.valid);
}

function createInitialState(dateKey: string): SavedGameState {
    if (typeof window === "undefined") {
        return {
            guesses: [],
            currentGuess: "",
            status: "playing",
            message: "A new wedding word every day.",
        };
    }

    const savedState = window.localStorage.getItem(getStorageKey(dateKey));
    if (!savedState) {
        return {
            guesses: [],
            currentGuess: "",
            status: "playing",
            message: "A new wedding word every day.",
        };
    }

    try {
        const parsed = JSON.parse(savedState) as SavedGameState;
        return {
            guesses: parsed.guesses ?? [],
            currentGuess: parsed.currentGuess ?? "",
            status: parsed.status ?? "playing",
            message: parsed.message ?? (parsed.status === "won" ? "You already solved today's Painedle." : "Welcome back."),
        };
    } catch {
        return {
            guesses: [],
            currentGuess: "",
            status: "playing",
            message: "A new wedding word every day.",
        };
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
                        ✕
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
    const [guesses, setGuesses] = useState<string[]>(() => createInitialState(dateKey).guesses);
    const [currentGuess, setCurrentGuess] = useState(() => createInitialState(dateKey).currentGuess);
    const [status, setStatus] = useState<GameStatus>(() => createInitialState(dateKey).status);
    const [message, setMessage] = useState(() => createInitialState(dateKey).message);
    const [flippingRow, setFlippingRow] = useState<number | null>(null);
    const [shakingRow, setShakingRow] = useState<number | null>(null);
    const [isCheckingGuess, setIsCheckingGuess] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showAdminAnswer, setShowAdminAnswer] = useState(false);
    const [autoSubmitStatus, setAutoSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [shareCopied, setShareCopied] = useState(false);
    const autoSubmitAttempted = useRef(false);

    const { isAdmin } = useAdminSession();

    const solution = getDailyWord(dateKey);
    const storageKey = getStorageKey(dateKey);
    const keyboardStatuses = getWordStatusMap(guesses, solution);
    const score = status === "won" ? MAX_GUESSES - guesses.length + 1 : 0;

    // Auto-submit score when game ends if player account is stored
    useEffect(() => {
        if (status === "playing" || autoSubmitAttempted.current) return;
        if (status !== "won") return; // only submit wins
        const storedPlayer = getStoredGamePlayer();
        if (!storedPlayer) return;
        autoSubmitAttempted.current = true;
        setAutoSubmitStatus("submitting");
        const browserProfile = storedPlayer.browserProfile ?? captureBrowserProfile();
        const fullName = storedPlayer.firstName && storedPlayer.lastName
            ? `${storedPlayer.firstName} ${storedPlayer.lastName}`
            : storedPlayer.username ?? "";
        submitGameScore({
            game: "painedle",
            username: fullName,
            email: storedPlayer.email ?? "",
            score,
            maxScore: MAX_GUESSES,
            attempts: guesses.length,
            solved: true,
            puzzleKey: dateKey,
            metadata: {
                solution,
                word_length: WORD_LENGTH,
                browser_language: browserProfile?.language ?? null,
                browser_languages: browserProfile?.languages ?? null,
                browser_platform: browserProfile?.platform ?? null,
                browser_timezone: browserProfile?.timezone ?? null,
                browser_user_agent: browserProfile?.userAgent ?? null,
                browser_screen: browserProfile?.screen ?? null,
            },
        }).then(() => {
            saveStoredGamePlayer({ ...storedPlayer, username: fullName, browserProfile });
            setAutoSubmitStatus("success");
            window.dispatchEvent(new Event(GAME_LEADERBOARD_REFRESH_EVENT));
        }).catch(() => {
            setAutoSubmitStatus("error");
        });
    }, [status, score, guesses.length, dateKey, solution]);

    function buildShareText() {
        const guessEmojis = guesses.map((guess) =>
            evaluateGuess(guess, solution)
                .map((s) => s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛")
                .join("")
        );
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
            currentGuess,
            status,
            message,
        };

        window.localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }, [currentGuess, guesses, message, status, storageKey]);

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

        let isValid = false;

        try {
            isValid = await validateGuessWord(guess);
        } catch {
            setMessage("Could not validate that word right now.");
            triggerShake();
            setIsCheckingGuess(false);
            return;
        }

        if (!isValid) {
            setMessage("That guess is not a recognized word.");
            triggerShake();
            setIsCheckingGuess(false);
            return;
        }

        const nextGuesses = [...guesses, guess];
        const nextRowIndex = nextGuesses.length - 1;
        const hasWon = guess === solution;
        const hasLost = nextGuesses.length === MAX_GUESSES && !hasWon;

        setGuesses(nextGuesses);
        setCurrentGuess("");
        setFlippingRow(nextRowIndex);
        setStatus(hasWon ? "won" : hasLost ? "lost" : "playing");
        setMessage(
            hasWon
                ? "Solved. Strong work."
                : hasLost
                    ? `The word was ${solution.toUpperCase()}.`
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

                {/* Admin answer reveal */}
                {isAdmin && (
                    <div className="relative mt-4 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowAdminAnswer((v) => !v)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-amber-300 transition-colors hover:bg-amber-400/25"
                        >
                            ⚑ {showAdminAnswer ? "Hide Answer" : "Show Answer"}
                        </button>
                        {showAdminAnswer && (
                            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-1.5 font-heading text-lg uppercase tracking-[0.22em] text-amber-300">
                                {solution}
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
                        const statuses = submittedGuess ? evaluateGuess(submittedGuess, solution) : [];

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
                                        {isBack ? "←" : key}
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
                            {shareCopied ? "✓ Copied!" : "Share Result"}
                        </button>

                        {status === "won" ? (
                            autoSubmitStatus === "success" ? (
                                <div className="rounded-[1.75rem] border border-emerald-400/20 bg-emerald-400/10 p-5 text-center">
                                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                                        Score Submitted ✓
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
                                    metadata={{ solution, word_length: WORD_LENGTH }}
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

    useEffect(() => {
        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setHours(24, 0, 0, 0);
        const timeout = window.setTimeout(() => {
            setDateKey(getTodayKey());
        }, nextMidnight.getTime() - now.getTime() + 50);

        return () => window.clearTimeout(timeout);
    }, [dateKey]);

    return <PainedleBoard key={dateKey} dateKey={dateKey} />;
}
