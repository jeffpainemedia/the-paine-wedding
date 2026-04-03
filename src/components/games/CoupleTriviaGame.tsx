"use client";

import { useEffect, useRef, useState } from "react";
import ScoreSubmissionForm from "@/components/games/ScoreSubmissionForm";
import { GAME_LEADERBOARD_REFRESH_EVENT, getStoredGamePlayer, saveStoredGamePlayer, submitGameScore } from "@/lib/games/leaderboard";
import type { TriviaQuestionRow } from "@/app/api/games/trivia-questions/route";

const LETTERS = ["A", "B", "C", "D"] as const;

type TriviaQuestion = {
    id: string;
    prompt: string;
    answers: [string, string, string, string];
    correctIndex: number;
    funFact?: string | null;
};

function rowToQuestion(row: TriviaQuestionRow): TriviaQuestion {
    return {
        id: row.id,
        prompt: row.prompt,
        answers: [row.answer_a, row.answer_b, row.answer_c, row.answer_d],
        correctIndex: row.correct_index,
        funFact: row.fun_fact,
    };
}

async function fetchTriviaQuestions(): Promise<TriviaQuestion[]> {
    const response = await fetch("/api/games/trivia-questions");

    if (!response.ok) {
        throw new Error("Could not load trivia questions.");
    }

    const data = await response.json() as { questions: TriviaQuestionRow[] };
    return data.questions.map(rowToQuestion);
}

function getScoreMessage(score: number, total: number) {
    const pct = score / total;

    if (pct <= 0.3) {
        return "A few table clues may have helped here. Try another round.";
    }

    if (pct <= 0.6) {
        return "Solid score. You know the broad strokes of their story.";
    }

    if (pct <= 0.8) {
        return "Strong work. You clearly know more than the average guest.";
    }

    return "Elite performance. That is inner-circle knowledge.";
}

export default function CoupleTriviaGame() {
    const gameRef = useRef<HTMLDivElement>(null);
    const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
    const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
    const [screen, setScreen] = useState<"welcome" | "playing" | "results">("welcome");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [hasAccount, setHasAccount] = useState(false);
    const [autoSubmitStatus, setAutoSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [shareCopied, setShareCopied] = useState(false);
    const autoSubmitAttempted = useRef(false);

    useEffect(() => {
        fetchTriviaQuestions()
            .then((loaded) => {
                setQuestions(loaded);
                setLoadState("ready");
            })
            .catch(() => {
                setLoadState("error");
            });
        setHasAccount(!!getStoredGamePlayer());
    }, []);

    const currentQuestion = questions[currentIndex];
    const selectedAnswer = selectedAnswers[currentIndex];
    const answeredCount = selectedAnswers.length;
    const score = selectedAnswers.reduce((total, answer, index) => {
        return total + (answer === questions[index]?.correctIndex ? 1 : 0);
    }, 0);

    // Auto-submit when results screen is shown and player is stored
    useEffect(() => {
        if (screen !== "results" || autoSubmitAttempted.current) return;
        const player = getStoredGamePlayer();
        if (!player) return;

        autoSubmitAttempted.current = true;
        setAutoSubmitStatus("submitting");

        const fullName = player.firstName && player.lastName
            ? `${player.firstName} ${player.lastName}`
            : player.username ?? "";
        const computedScore = Math.round((score / questions.length) * answeredCount * 10);
        submitGameScore({
            game: "trivia",
            username: fullName,
            email: player.email ?? "",
            score: computedScore,
            maxScore: questions.length * 10,
            attempts: answeredCount,
            solved: score === answeredCount && answeredCount === questions.length,
            puzzleKey: "wedding-day-trivia",
            metadata: { question_count: questions.length, answered_count: answeredCount, raw_score: score },
        })
            .then(() => {
                saveStoredGamePlayer({ ...player, username: fullName });
                setAutoSubmitStatus("success");
                window.dispatchEvent(new CustomEvent(GAME_LEADERBOARD_REFRESH_EVENT));
            })
            .catch(() => {
                setAutoSubmitStatus("error");
            });
    }, [screen, score, answeredCount, questions.length]);

    function buildShareText() {
        const pct = Math.round((score / (answeredCount || 1)) * 100);
        return `Couple Trivia — ${score}/${answeredCount} (${pct}%)\nthepainewedding.com/games/trivia`;
    }

    function handleShare() {
        const text = buildShareText();
        if (typeof navigator !== "undefined" && navigator.share) {
            navigator.share({ text }).catch(() => {});
        } else {
            navigator.clipboard.writeText(text).then(() => {
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
            }).catch(() => {});
        }
    }

    function handleStart() {
        setScreen("playing");
        setTimeout(() => {
            gameRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    }

    function handleRestart() {
        setScreen("welcome");
        setCurrentIndex(0);
        setSelectedAnswers([]);
        autoSubmitAttempted.current = false;
        setAutoSubmitStatus("idle");
        setShareCopied(false);
    }

    function handleSelect(answerIndex: number) {
        if (selectedAnswer !== undefined) return;

        setSelectedAnswers((currentAnswers) => {
            const nextAnswers = [...currentAnswers];
            nextAnswers[currentIndex] = answerIndex;
            return nextAnswers;
        });
    }

    function handleNext() {
        if (currentIndex === questions.length - 1) {
            setScreen("results");
            return;
        }

        setCurrentIndex(currentIndex + 1);
    }

    if (loadState === "loading") {
        return (
            <div className="rounded-[2rem] border border-primary/10 bg-[linear-gradient(160deg,#fffaf4_0%,#f3ebe0_100%)] p-8 shadow-[0_20px_60px_rgba(20,42,68,0.10)] md:p-10">
                <p className="text-sm uppercase tracking-[0.3em] text-text-secondary">Loading</p>
                <p className="mt-4 text-text-secondary">Fetching questions…</p>
            </div>
        );
    }

    if (loadState === "error") {
        return (
            <div className="rounded-[2rem] border border-primary/10 bg-[linear-gradient(160deg,#fffaf4_0%,#f3ebe0_100%)] p-8 shadow-[0_20px_60px_rgba(20,42,68,0.10)] md:p-10">
                <p className="text-sm uppercase tracking-[0.3em] text-secondary">Error</p>
                <p className="mt-4 text-text-secondary">Could not load the trivia questions. Please refresh and try again.</p>
            </div>
        );
    }

    if (screen === "welcome") {
        return (
            <div className="rounded-[2rem] border border-primary/10 bg-[linear-gradient(160deg,#fffaf4_0%,#f3ebe0_100%)] p-8 shadow-[0_20px_60px_rgba(20,42,68,0.10)] md:p-10">
                <p className="text-sm uppercase tracking-[0.3em] text-text-secondary">Welcome</p>
                <h2 className="mt-4 font-heading text-4xl text-primary">How Well Do You Know the Couple?</h2>
                <p className="mt-4 max-w-2xl text-text-secondary leading-relaxed">
                    {questions.length} questions. Four answer choices each. Pick the best answer and see where your score lands.
                </p>

                {hasAccount ? (
                    <button
                        type="button"
                        onClick={handleStart}
                        className="mt-10 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90"
                    >
                        Start Trivia
                    </button>
                ) : (
                    <div className="mt-8 rounded-[1.5rem] border border-primary/10 bg-surface/60 px-6 py-5">
                        <p className="text-sm text-text-secondary">Set up your player account above to track your score on the leaderboard before starting.</p>
                    </div>
                )}
            </div>
        );
    }

    if (screen === "results") {
        return (
            <div className="rounded-[2rem] border border-primary/10 bg-[linear-gradient(160deg,#fffaf4_0%,#f3ebe0_100%)] p-8 shadow-[0_20px_60px_rgba(20,42,68,0.10)] md:p-10">
                <p className="text-sm uppercase tracking-[0.3em] text-text-secondary">Results</p>
                <h2 className="mt-4 font-heading text-4xl text-primary">{score} / {answeredCount}</h2>
                <p className="mt-3 text-sm text-text-secondary/60">{answeredCount < questions.length ? `${answeredCount} of ${questions.length} questions answered` : `All ${questions.length} questions answered`}</p>
                <p className="mt-4 max-w-2xl text-text-secondary leading-relaxed">{getScoreMessage(score, answeredCount)}</p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-white px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-primary transition-all duration-200 hover:bg-primary/5"
                    >
                        {shareCopied ? "✓ Copied!" : "Share Result"}
                    </button>
                    <button
                        type="button"
                        onClick={handleRestart}
                        className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90"
                    >
                        Play Again
                    </button>
                </div>

                <div className="mt-8">
                    {autoSubmitStatus === "success" ? (
                        <div className="rounded-[1.5rem] border border-emerald-600/20 bg-emerald-50 p-5 text-center">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Score Submitted ✓</p>
                            <p className="mt-2 text-sm text-text-secondary">Your trivia score is on the leaderboard.</p>
                        </div>
                    ) : autoSubmitStatus === "submitting" ? (
                        <div className="rounded-[1.5rem] border border-primary/8 bg-white/60 p-5 text-center">
                            <p className="text-sm text-text-secondary/60">Submitting score…</p>
                        </div>
                    ) : (
                        <ScoreSubmissionForm
                            game="trivia"
                            score={Math.round((score / questions.length) * answeredCount * 10)}
                            maxScore={questions.length * 10}
                            attempts={answeredCount}
                            solved={score === answeredCount && answeredCount === questions.length}
                            puzzleKey="wedding-day-trivia"
                            metadata={{ question_count: questions.length, answered_count: answeredCount, raw_score: score }}
                            successMessage="Trivia score submitted."
                        />
                    )}
                </div>
            </div>
        );
    }

    if (!currentQuestion) return null;

    // Only show answers that are not placeholder "—" values
    const visibleAnswers = currentQuestion.answers
        .map((answer, index) => ({ answer, index }))
        .filter(({ answer }) => answer.trim() !== "—");

    return (
        <div ref={gameRef} className="scroll-mt-24 rounded-[2rem] border border-primary/10 bg-[linear-gradient(160deg,#fffaf4_0%,#f3ebe0_100%)] p-5 shadow-[0_20px_60px_rgba(20,42,68,0.10)] md:p-10">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Playing</p>
                    <h2 className="mt-1 font-heading text-2xl text-primary md:text-4xl">Question {currentIndex + 1}</h2>
                </div>
                <p className="text-xs uppercase tracking-[0.24em] text-text-secondary shrink-0">
                    {answeredCount}/{questions.length}
                </p>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
            </div>

            <div className="mt-5">
                <h3 className="font-heading text-xl leading-snug text-primary md:text-4xl">{currentQuestion.prompt}</h3>
                <div className={`mt-4 grid gap-2 md:gap-4 ${visibleAnswers.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
                    {visibleAnswers.map(({ answer, index }) => {
                        const isSelected = index === selectedAnswer;
                        const isCorrect = index === currentQuestion.correctIndex;
                        const stateClass = selectedAnswer !== undefined
                            ? isCorrect
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : isSelected
                                    ? "border-secondary bg-secondary text-white"
                                    : "border-surface bg-surface text-text-primary"
                            : "border-primary/10 bg-white/88 text-text-primary hover:border-primary hover:bg-primary/5";

                        return (
                            <button
                                key={answer}
                                type="button"
                                onClick={() => handleSelect(index)}
                                className={`rounded-[1.2rem] border px-3 py-4 text-left transition-all duration-200 md:rounded-[1.5rem] md:px-5 md:py-6 ${stateClass}`}
                            >
                                <p className="text-[10px] uppercase tracking-[0.3em] opacity-70 md:text-xs">{LETTERS[index]}</p>
                                <p className="mt-1.5 text-sm leading-snug md:mt-3 md:text-lg md:leading-relaxed">{answer}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-surface pt-6 md:flex-row md:items-center md:justify-between">
                <div className="min-h-16 max-w-2xl text-text-secondary">
                    {selectedAnswer !== undefined && currentQuestion.funFact ? currentQuestion.funFact : "Choose an answer to reveal the fun fact."}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={selectedAnswer === undefined}
                        className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40 disabled:hover:translate-y-0"
                    >
                        {currentIndex === questions.length - 1 ? "See Results" : "Next Question"}
                    </button>
                    {currentIndex < questions.length - 1 && answeredCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setScreen("results")}
                            className="text-sm text-text-secondary/60 underline underline-offset-2 transition-colors hover:text-text-secondary"
                        >
                            Finish early
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
