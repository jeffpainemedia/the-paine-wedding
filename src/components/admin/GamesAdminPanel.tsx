"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdminGameScore, GamePlayerRecord } from "@/lib/games/admin-types";
import { CROSSWORD_PUZZLE, CROSSWORD_PUZZLE_KEY } from "@/lib/games/crossword";
import { PAINEDLE_WORDS } from "@/lib/games/word-list";
import { getDailyWord, getTodayKey } from "@/lib/games/painedle";
import {
    CROSSWORD_UNLOCK_LABEL,
    getCrosswordUnlockDate,
    getTimeRemaining,
    getTriviaUnlockDate,
    TRIVIA_UNLOCK_LABEL,
} from "@/lib/games/schedule";

type GamesAdminPanelProps = {
    gameScores: AdminGameScore[];
    gameScoresError: string | null;
};

type ModalView =
    | "today-word"
    | "schedule"
    | "word-bank"
    | "crossword"
    | "trivia-bank"
    | "leaderboards"
    | "submissions"
    | "players";

type ScoreFilter = "all" | "trivia" | "painedle" | "crossword";

type PlayerSummary = {
    email: string;
    username: string;
    createdAt: string | null;
    totalSubmissions: number;
    triviaSubmissions: number;
    painedleSubmissions: number;
    crosswordSubmissions: number;
    bestTriviaScore: number | null;
    bestPainedleScore: number | null;
    bestCrosswordScore: number | null;
    latestSeenAt: string | null;
    latestTimezone: string | null;
    latestLocation: string | null;
    latestDevice: string | null;
    latestIp: string | null;
};

function getPlayerDetails(score: AdminGameScore): GamePlayerRecord | undefined {
    return Array.isArray(score.game_players) ? score.game_players[0] : score.game_players;
}

function getSubmissionSortValue(score: AdminGameScore) {
    return new Date(score.created_at).getTime();
}

function sortTriviaScores(a: AdminGameScore, b: AdminGameScore) {
    return b.score - a.score || getSubmissionSortValue(a) - getSubmissionSortValue(b);
}

function sortPainedleScores(a: AdminGameScore, b: AdminGameScore) {
    return b.score - a.score || (a.attempts ?? 99) - (b.attempts ?? 99) || getSubmissionSortValue(a) - getSubmissionSortValue(b);
}

function formatSubmissionTime(value: string) {
    return new Date(value).toLocaleString();
}

function getMetadataValue(score: AdminGameScore, key: string) {
    const value = score.metadata?.[key];
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getProfileSummary(score: AdminGameScore) {
    const timezone = getMetadataValue(score, "browser_timezone");
    const city = getMetadataValue(score, "request_city");
    const region = getMetadataValue(score, "request_region");
    const country = getMetadataValue(score, "request_country");
    const userAgent = getMetadataValue(score, "browser_user_agent") || getMetadataValue(score, "request_user_agent");

    const location = [city, region, country].filter(Boolean).join(", ") || timezone || "Unknown location";
    const device = userAgent
        ? /mobile|iphone|android/i.test(userAgent)
            ? "Mobile browser"
            : "Desktop browser"
        : "Unknown device";

    return {
        location,
        device,
        timezone,
        ip: getMetadataValue(score, "request_ip"),
    };
}

function buildUpcomingSchedule(days: number) {
    const today = new Date();

    return Array.from({ length: days }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);
        const key = getTodayKey(date);

        return {
            key,
            label: date.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
            }),
            word: getDailyWord(key),
        };
    });
}

function getScoreLabel(score: AdminGameScore) {
    if (score.game === "trivia") {
        return `${score.score}${score.max_score ? ` / ${score.max_score}` : ""}`;
    }

    if (score.game === "crossword") {
        const duration = score.metadata?.duration_seconds;
        const reveals = score.metadata?.reveals_used;
        const durationLabel = typeof duration === "number" ? ` • ${Math.max(1, Math.round(duration / 60))} min` : "";
        const revealLabel = typeof reveals === "number" ? ` • ${reveals} reveal${reveals === 1 ? "" : "s"}` : "";
        return `${score.score} pts${durationLabel}${revealLabel}`;
    }

    return `${score.score} pts${score.attempts ? ` • ${score.attempts} guesses` : ""}`;
}

function getPuzzleLabel(score: AdminGameScore) {
    if (score.game === "trivia") return "Wedding-day trivia";
    if (score.game === "crossword") return "Mini crossword";
    return score.puzzle_key;
}

function PillButton({
    label,
    onClick,
}: {
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-full border border-primary/12 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em] text-primary transition-colors duration-200 hover:bg-primary hover:text-white"
        >
            {label}
        </button>
    );
}

function ModalButton({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em] transition-colors duration-200 ${
                active ? "bg-primary text-white" : "border border-primary/12 bg-white text-primary hover:bg-primary/5"
            }`}
        >
            {label}
        </button>
    );
}

function OverviewMetric({
    label,
    value,
    note,
}: {
    label: string;
    value: string | number;
    note: string;
}) {
    return (
        <div className="rounded-[1.5rem] border border-primary/8 bg-[#fbf8f3] p-5 shadow-[0_8px_24px_rgba(20,42,68,0.04)]">
            <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">{label}</p>
            <p className="mt-3 font-heading text-4xl text-primary">{value}</p>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{note}</p>
        </div>
    );
}

function ControlCard({
    eyebrow,
    title,
    copy,
    children,
}: {
    eyebrow: string;
    title: string;
    copy: string;
    children: ReactNode;
}) {
    return (
        <div className="rounded-[1.9rem] border border-primary/10 bg-white p-6 shadow-[0_16px_50px_rgba(20,42,68,0.06)]">
            <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">{eyebrow}</p>
            <h3 className="mt-4 font-heading text-3xl text-primary">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{copy}</p>
            <div className="mt-6 flex flex-wrap gap-3">{children}</div>
        </div>
    );
}

type DbTriviaQuestion = {
    id: string;
    prompt: string;
    answer_a: string;
    answer_b: string;
    answer_c: string;
    answer_d: string;
    correct_index: number;
    fun_fact: string | null;
    sort_order: number;
    archived: boolean;
    created_at: string;
    updated_at: string;
};

type TriviaFormState = {
    prompt: string;
    answer_a: string;
    answer_b: string;
    answer_c: string;
    answer_d: string;
    correct_index: number;
    fun_fact: string;
    sort_order: string;
};

function emptyTriviaForm(sortHint = 0): TriviaFormState {
    return { prompt: "", answer_a: "", answer_b: "", answer_c: "", answer_d: "", correct_index: 0, fun_fact: "", sort_order: String(sortHint) };
}

function questionToForm(q: DbTriviaQuestion): TriviaFormState {
    return {
        prompt: q.prompt,
        answer_a: q.answer_a,
        answer_b: q.answer_b,
        answer_c: q.answer_c,
        answer_d: q.answer_d,
        correct_index: q.correct_index,
        fun_fact: q.fun_fact ?? "",
        sort_order: String(q.sort_order),
    };
}

type TriviaFormProps = {
    initial: TriviaFormState;
    saving: boolean;
    onSave: (form: TriviaFormState) => void;
    onCancel: () => void;
};

function TriviaQuestionForm({ initial, saving, onSave, onCancel }: TriviaFormProps) {
    const [form, setForm] = useState<TriviaFormState>(initial);

    function field(key: keyof TriviaFormState) {
        return {
            value: form[key] as string,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setForm((prev) => ({ ...prev, [key]: e.target.value })),
        };
    }

    const inputClass = "w-full rounded-[0.9rem] border border-primary/12 bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary";
    const labelClass = "mb-1 block text-xs uppercase tracking-[0.22em] text-text-secondary";
    const LETTERS = ["A", "B", "C", "D"] as const;

    return (
        <div className="space-y-4 rounded-[1.5rem] border border-primary/10 bg-[#fbf8f3] p-5">
            <div>
                <label className={labelClass}>Prompt</label>
                <textarea
                    rows={2}
                    {...field("prompt")}
                    className={`${inputClass} resize-none`}
                    placeholder="Question prompt"
                />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                {(["answer_a", "answer_b", "answer_c", "answer_d"] as const).map((key, i) => (
                    <div key={key}>
                        <label className={labelClass}>{LETTERS[i]}</label>
                        <input type="text" {...field(key)} className={inputClass} placeholder={`Answer ${LETTERS[i]}`} />
                    </div>
                ))}
            </div>
            <div>
                <label className={labelClass}>Correct answer</label>
                <div className="flex gap-3">
                    {LETTERS.map((letter, i) => (
                        <button
                            key={letter}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, correct_index: i }))}
                            className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium uppercase tracking-[0.12em] transition-colors ${
                                form.correct_index === i
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-primary/15 bg-white text-text-secondary hover:border-primary"
                            }`}
                        >
                            {letter}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <div>
                    <label className={labelClass}>Fun fact (optional)</label>
                    <input type="text" {...field("fun_fact")} className={inputClass} placeholder="Fun fact after answer is revealed" />
                </div>
                <div>
                    <label className={labelClass}>Sort order</label>
                    <input type="number" {...field("sort_order")} className={inputClass} placeholder="0" />
                </div>
            </div>
            <div className="flex gap-3 pt-1">
                <button
                    type="button"
                    onClick={() => onSave(form)}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:bg-primary/40"
                >
                    {saving ? "Saving…" : "Save"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex items-center justify-center rounded-full border border-primary/15 bg-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-text-secondary transition-all hover:border-primary hover:text-primary"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default function GamesAdminPanel({ gameScores, gameScoresError }: GamesAdminPanelProps) {
    const [modalView, setModalView] = useState<ModalView | null>(null);
    const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
    const [wordSearch, setWordSearch] = useState("");
    const [remaining, setRemaining] = useState(() => getTimeRemaining(getTriviaUnlockDate()));
    const [crosswordRemaining, setCrosswordRemaining] = useState(() => getTimeRemaining(getCrosswordUnlockDate()));
    const [triviaQuestions, setTriviaQuestions] = useState<DbTriviaQuestion[]>([]);
    const [triviaLoadState, setTriviaLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [triviaOpError, setTriviaOpError] = useState<string | null>(null);
    const hasFetchedTrivia = useRef(false);
    const [todayKey] = useState(() => getTodayKey());
    const todayWord = getDailyWord(todayKey);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setRemaining(getTimeRemaining(getTriviaUnlockDate()));
            setCrosswordRemaining(getTimeRemaining(getCrosswordUnlockDate()));
        }, 1000);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        document.body.style.overflow = modalView ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [modalView]);

    const fetchTriviaQuestions = useCallback(async () => {
        setTriviaLoadState("loading");
        setTriviaOpError(null);

        try {
            const res = await fetch("/api/admin/trivia-questions");

            if (!res.ok) {
                throw new Error("Could not load questions.");
            }

            const json = await res.json() as { questions: DbTriviaQuestion[] };
            setTriviaQuestions(json.questions);
            setTriviaLoadState("ready");
        } catch {
            setTriviaLoadState("error");
        }
    }, []);

    useEffect(() => {
        if (modalView !== "trivia-bank") return;
        if (hasFetchedTrivia.current) return;
        hasFetchedTrivia.current = true;
        void fetchTriviaQuestions();
    }, [modalView, fetchTriviaQuestions]);

    async function handleSaveQuestion(id: string | null, form: TriviaFormState) {
        setSavingId(id ?? "new");
        setTriviaOpError(null);

        try {
            const payload = {
                prompt: form.prompt,
                answer_a: form.answer_a,
                answer_b: form.answer_b,
                answer_c: form.answer_c,
                answer_d: form.answer_d,
                correct_index: form.correct_index,
                fun_fact: form.fun_fact || null,
                sort_order: parseInt(form.sort_order, 10) || 0,
            };

            const url = id ? `/api/admin/trivia-questions/${id}` : "/api/admin/trivia-questions";
            const method = id ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json() as { error?: string };
                throw new Error(err.error ?? "Could not save question.");
            }
        } catch (err) {
            setTriviaOpError(err instanceof Error ? err.message : "Could not save question.");
            setSavingId(null);
            return;
        }

        setSavingId(null);
        setEditingId(null);
        setIsAddingNew(false);
        hasFetchedTrivia.current = false;
        void fetchTriviaQuestions();
    }

    async function handleArchiveToggle(question: DbTriviaQuestion) {
        setSavingId(question.id);
        setTriviaOpError(null);

        try {
            const res = await fetch(`/api/admin/trivia-questions/${question.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ archived: !question.archived }),
            });

            if (!res.ok) throw new Error("Could not update question.");
        } catch (err) {
            setTriviaOpError(err instanceof Error ? err.message : "Could not update question.");
            setSavingId(null);
            return;
        }

        setSavingId(null);
        hasFetchedTrivia.current = false;
        void fetchTriviaQuestions();
    }

    async function handleDeleteQuestion(id: string) {
        setSavingId(id);
        setTriviaOpError(null);

        try {
            const res = await fetch(`/api/admin/trivia-questions/${id}`, { method: "DELETE" });

            if (!res.ok) throw new Error("Could not delete question.");
        } catch (err) {
            setTriviaOpError(err instanceof Error ? err.message : "Could not delete question.");
            setSavingId(null);
            setDeleteConfirmId(null);
            return;
        }

        setSavingId(null);
        setDeleteConfirmId(null);
        hasFetchedTrivia.current = false;
        void fetchTriviaQuestions();
    }

    const triviaScores = useMemo(
        () => gameScores.filter((score) => score.game === "trivia").sort(sortTriviaScores),
        [gameScores]
    );
    const crosswordScores = useMemo(
        () => gameScores.filter((score) => score.game === "crossword").sort(sortTriviaScores),
        [gameScores]
    );
    const painedleScores = useMemo(
        () => gameScores.filter((score) => score.game === "painedle").sort(sortPainedleScores),
        [gameScores]
    );
    const todaysPainedleScores = useMemo(
        () => painedleScores.filter((score) => score.puzzle_key === todayKey),
        [painedleScores, todayKey]
    );
    const averageTriviaScore = triviaScores.length
        ? (triviaScores.reduce((sum, score) => sum + score.score, 0) / triviaScores.length).toFixed(1)
        : "0.0";
    const uniquePlayers = useMemo(() => {
        const playerMap = new Map<string, PlayerSummary>();

        gameScores.forEach((score) => {
            const player = getPlayerDetails(score);
            if (!player) return;

            const key = player.email || `${player.username}:${score.id}`;
            const existing = playerMap.get(key);

            if (!existing) {
                playerMap.set(key, {
                    email: player.email,
                    username: player.username,
                    createdAt: player.created_at ?? null,
                    totalSubmissions: 1,
                    triviaSubmissions: score.game === "trivia" ? 1 : 0,
                    painedleSubmissions: score.game === "painedle" ? 1 : 0,
                    crosswordSubmissions: score.game === "crossword" ? 1 : 0,
                    bestTriviaScore: score.game === "trivia" ? score.score : null,
                    bestPainedleScore: score.game === "painedle" ? score.score : null,
                    bestCrosswordScore: score.game === "crossword" ? score.score : null,
                    latestSeenAt: score.created_at,
                    latestTimezone: getMetadataValue(score, "browser_timezone"),
                    latestLocation: getProfileSummary(score).location,
                    latestDevice: getProfileSummary(score).device,
                    latestIp: getProfileSummary(score).ip,
                });
                return;
            }

            existing.totalSubmissions += 1;
            if (score.game === "trivia") {
                existing.triviaSubmissions += 1;
                existing.bestTriviaScore = Math.max(existing.bestTriviaScore ?? 0, score.score);
            } else if (score.game === "painedle") {
                existing.painedleSubmissions += 1;
                existing.bestPainedleScore = Math.max(existing.bestPainedleScore ?? 0, score.score);
            } else {
                existing.crosswordSubmissions += 1;
                existing.bestCrosswordScore = Math.max(existing.bestCrosswordScore ?? 0, score.score);
            }
            if (!existing.createdAt && player.created_at) {
                existing.createdAt = player.created_at;
            }

            if (!existing.latestSeenAt || new Date(score.created_at).getTime() > new Date(existing.latestSeenAt).getTime()) {
                existing.latestSeenAt = score.created_at;
                existing.latestTimezone = getMetadataValue(score, "browser_timezone");
                existing.latestLocation = getProfileSummary(score).location;
                existing.latestDevice = getProfileSummary(score).device;
                existing.latestIp = getProfileSummary(score).ip;
            }
        });

        return Array.from(playerMap.values()).sort((a, b) => {
            return b.totalSubmissions - a.totalSubmissions || a.username.localeCompare(b.username);
        });
    }, [gameScores]);
    const leaderboardPreview = useMemo(
        () => ({
            trivia: triviaScores.slice(0, 5),
            crossword: crosswordScores.slice(0, 5),
            painedle: todaysPainedleScores.slice(0, 5),
        }),
        [crosswordScores, todaysPainedleScores, triviaScores]
    );
    const upcomingSchedule = useMemo(() => buildUpcomingSchedule(21), []);
    const filteredWordBank = useMemo(() => {
        if (!wordSearch.trim()) return PAINEDLE_WORDS;
        return PAINEDLE_WORDS.filter((word) => word.includes(wordSearch.trim().toLowerCase()));
    }, [wordSearch]);
    const filteredScores = useMemo(() => {
        if (scoreFilter === "all") return gameScores;
        return gameScores.filter((score) => score.game === scoreFilter);
    }, [gameScores, scoreFilter]);

    function renderModalContent() {
        if (modalView === "today-word") {
            return (
                <div className="space-y-8">
                    <div className="grid gap-4 md:grid-cols-3">
                        <OverviewMetric
                            label="Today's Key"
                            value={todayKey}
                            note="This is the live puzzle key guests submit against."
                        />
                        <OverviewMetric
                            label="Rotation Slot"
                            value={`${PAINEDLE_WORDS.indexOf(todayWord) + 1} / ${PAINEDLE_WORDS.length}`}
                            note="Position of the current answer inside the word bank."
                        />
                        <OverviewMetric
                            label="Submissions Today"
                            value={todaysPainedleScores.length}
                            note="Live score rows currently tied to today's puzzle key."
                        />
                    </div>

                    <div className="rounded-[2rem] border border-primary/10 bg-[linear-gradient(145deg,#173756_0%,#10253c_100%)] p-8 text-white shadow-[0_16px_44px_rgba(20,42,68,0.14)]">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Current Answer</p>
                        <h3 className="mt-4 font-heading text-6xl tracking-[0.2em] md:text-7xl">{todayWord.toUpperCase()}</h3>
                        <p className="mt-4 max-w-2xl text-white/76">
                            This reveal stays out of the overview tab on purpose. Open it only when you actually need to verify the live answer.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            {todayWord.toUpperCase().split("").map((letter, index) => (
                                <div
                                    key={`${letter}-${index}`}
                                    className="flex h-14 w-14 items-center justify-center rounded-[1rem] border border-white/15 bg-white/10 text-2xl font-semibold"
                                >
                                    {letter}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (modalView === "schedule") {
            return (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <OverviewMetric
                            label="Schedule Window"
                            value="21 days"
                            note="Preview of the next 3 weeks of daily answers."
                        />
                        <OverviewMetric
                            label="Start"
                            value={upcomingSchedule[0]?.key ?? todayKey}
                            note="The first row is always today's live puzzle key."
                        />
                        <OverviewMetric
                            label="Cycle"
                            value={`${PAINEDLE_WORDS.length} words`}
                            note="The rotation advances one word per day and only loops after the full bank is exhausted."
                        />
                    </div>

                    <div className="overflow-hidden rounded-[1.8rem] border border-primary/10 bg-white shadow-[0_12px_34px_rgba(20,42,68,0.05)]">
                        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-primary/8 bg-[#fbf8f3] px-6 py-4 text-xs uppercase tracking-[0.26em] text-text-secondary">
                            <div>Date</div>
                            <div>Key</div>
                            <div>Word</div>
                        </div>
                        <div className="max-h-[28rem] overflow-auto divide-y divide-primary/6">
                            {upcomingSchedule.map((entry) => (
                                <div key={entry.key} className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-4 text-sm text-text-secondary">
                                    <div className="font-medium text-primary">{entry.label}</div>
                                    <div>{entry.key}</div>
                                    <div className="font-mono uppercase text-primary">{entry.word}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (modalView === "word-bank") {
            return (
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Painedle Library</p>
                            <h3 className="mt-3 font-heading text-4xl text-primary">Full word bank</h3>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
                                Search the entire answer list, confirm spelling, and sanity-check how many usable words are currently available.
                            </p>
                        </div>
                        <div className="w-full md:max-w-xs">
                            <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-text-secondary">
                                Filter words
                            </label>
                            <input
                                type="text"
                                value={wordSearch}
                                onChange={(event) => setWordSearch(event.target.value.toLowerCase())}
                                placeholder="Search the word bank"
                                className="w-full rounded-[1rem] border border-primary/12 bg-white px-4 py-3 text-text-primary outline-none transition-colors focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <OverviewMetric
                            label="Bank Size"
                            value={PAINEDLE_WORDS.length}
                            note="Current number of daily answers in rotation."
                        />
                        <OverviewMetric
                            label="Search Results"
                            value={filteredWordBank.length}
                            note="Words matching the current search query."
                        />
                        <OverviewMetric
                            label="Today's Word"
                            value={todayWord.toUpperCase()}
                            note="Quick confirmation without opening the separate reveal again."
                        />
                    </div>

                    <div className="rounded-[1.8rem] border border-primary/10 bg-white p-6 shadow-[0_12px_34px_rgba(20,42,68,0.05)]">
                        <div className="flex max-h-[28rem] flex-wrap gap-3 overflow-auto">
                            {filteredWordBank.map((word) => (
                                <span
                                    key={word}
                                    className={`rounded-full border px-4 py-2 text-sm uppercase tracking-[0.22em] ${
                                        word === todayWord
                                            ? "border-primary bg-primary text-white"
                                            : "border-primary/12 bg-[#fbf8f3] text-primary"
                                    }`}
                                >
                                    {word}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (modalView === "crossword") {
            return (
                <div className="space-y-4">
                    {/* Status bar */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                        <span className="rounded-full border border-primary/12 bg-[#fbf8f3] px-3 py-1 uppercase tracking-[0.22em] text-primary">
                            {crosswordRemaining.isUnlocked ? "Live" : CROSSWORD_UNLOCK_LABEL}
                        </span>
                        <span>Key: <span className="font-mono text-primary">{CROSSWORD_PUZZLE_KEY}</span></span>
                        <span>{CROSSWORD_PUZZLE.entries.length} clues · {CROSSWORD_PUZZLE.rows}×{CROSSWORD_PUZZLE.cols} grid</span>
                    </div>

                    {/* Grid (left) + clue panels (right) — mirrors front-end layout */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Grid panel */}
                        <div className="self-start rounded-[1.9rem] bg-[linear-gradient(155deg,#173756_0%,#214467_100%)] p-4 shadow-[0_18px_48px_rgba(20,42,68,0.14)]">
                            <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-white/55">Board Preview — answers visible</p>
                            <div
                                className="grid w-full gap-1.5"
                                style={{ gridTemplateColumns: `repeat(${CROSSWORD_PUZZLE.cols}, minmax(0, 1fr))` }}
                            >
                                {CROSSWORD_PUZZLE.cells.map((cell) => (
                                    cell.answer ? (
                                        <div key={cell.key} className="relative flex aspect-square items-center justify-center rounded-[0.4rem] border border-white/20 bg-white/80 text-sm font-semibold uppercase text-primary">
                                            {cell.number ? (
                                                <span className="absolute left-0.5 top-0.5 text-[8px] font-semibold leading-none text-primary/65">{cell.number}</span>
                                            ) : null}
                                            {cell.answer}
                                        </div>
                                    ) : (
                                        <div key={cell.key} className="aspect-square rounded-[0.35rem] bg-[#0f2033]" />
                                    )
                                ))}
                            </div>
                        </div>

                        {/* Clue panels */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-text-secondary">Across</p>
                                <div className="space-y-1.5">
                                    {CROSSWORD_PUZZLE.across.map((entry) => (
                                        <div key={entry.id} className="rounded-xl border border-primary/8 bg-[#f9f6f1] px-3 py-2.5">
                                            <span className="mr-1.5 text-[10px] font-bold text-text-secondary">{entry.number}</span>
                                            <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-accent">{entry.answer}</span>
                                            <p className="mt-1 text-xs leading-snug text-primary">{entry.clue}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-text-secondary">Down</p>
                                <div className="space-y-1.5">
                                    {CROSSWORD_PUZZLE.down.map((entry) => (
                                        <div key={entry.id} className="rounded-xl border border-primary/8 bg-[#f9f6f1] px-3 py-2.5">
                                            <span className="mr-1.5 text-[10px] font-bold text-text-secondary">{entry.number}</span>
                                            <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-accent">{entry.answer}</span>
                                            <p className="mt-1 text-xs leading-snug text-primary">{entry.clue}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (modalView === "trivia-bank") {
            const activeQuestions = triviaQuestions.filter((q) => !q.archived);
            const archivedQuestions = triviaQuestions.filter((q) => q.archived);
            const nextSortOrder = triviaQuestions.length > 0
                ? Math.max(...triviaQuestions.map((q) => q.sort_order)) + 1
                : 1;

            return (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <OverviewMetric
                            label="Active Questions"
                            value={triviaLoadState === "ready" ? activeQuestions.length : "—"}
                            note="Non-archived questions served to the game."
                        />
                        <OverviewMetric
                            label="Unlock"
                            value={remaining.isUnlocked ? "Live" : TRIVIA_UNLOCK_LABEL}
                            note="Current status of the trivia launch gate."
                        />
                        <OverviewMetric
                            label="Archived"
                            value={triviaLoadState === "ready" ? archivedQuestions.length : "—"}
                            note="Hidden questions not shown to guests."
                        />
                    </div>

                    {triviaOpError ? (
                        <div className="rounded-[1.2rem] border border-secondary/20 bg-secondary/5 px-5 py-4 text-sm text-secondary">
                            {triviaOpError}
                        </div>
                    ) : null}

                    <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">
                            {triviaLoadState === "loading" ? "Loading…" : `${activeQuestions.length} active, ${archivedQuestions.length} archived`}
                        </p>
                        <button
                            type="button"
                            onClick={() => { setIsAddingNew(true); setEditingId(null); }}
                            disabled={isAddingNew}
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:bg-primary/40"
                        >
                            + Add Question
                        </button>
                    </div>

                    {isAddingNew ? (
                        <TriviaQuestionForm
                            initial={emptyTriviaForm(nextSortOrder)}
                            saving={savingId === "new"}
                            onSave={(form) => void handleSaveQuestion(null, form)}
                            onCancel={() => setIsAddingNew(false)}
                        />
                    ) : null}

                    {triviaLoadState === "loading" ? (
                        <div className="py-8 text-center text-sm text-text-secondary">Loading questions…</div>
                    ) : triviaLoadState === "error" ? (
                        <div className="py-8 text-center text-sm text-secondary">
                            Could not load questions.{" "}
                            <button
                                type="button"
                                onClick={() => { hasFetchedTrivia.current = false; void fetchTriviaQuestions(); }}
                                className="underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {[...activeQuestions, ...archivedQuestions].map((question, index) => {
                                const answers = [question.answer_a, question.answer_b, question.answer_c, question.answer_d];
                                const isEditing = editingId === question.id;
                                const isConfirmingDelete = deleteConfirmId === question.id;
                                const isBusy = savingId === question.id;

                                return (
                                    <div
                                        key={question.id}
                                        className={`rounded-[1.8rem] border p-5 shadow-[0_12px_34px_rgba(20,42,68,0.05)] transition-opacity ${
                                            question.archived
                                                ? "border-primary/6 bg-white/50 opacity-60"
                                                : "border-primary/10 bg-white"
                                        }`}
                                    >
                                        {isEditing ? (
                                            <TriviaQuestionForm
                                                initial={questionToForm(question)}
                                                saving={isBusy}
                                                onSave={(form) => void handleSaveQuestion(question.id, form)}
                                                onCancel={() => setEditingId(null)}
                                            />
                                        ) : (
                                            <>
                                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">
                                                                Q{index + 1} · Sort {question.sort_order}
                                                            </p>
                                                            {question.archived ? (
                                                                <span className="rounded-full border border-primary/12 bg-[#fbf8f3] px-2.5 py-0.5 text-xs uppercase tracking-[0.2em] text-text-secondary">
                                                                    Archived
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <h3 className="mt-2 font-heading text-2xl text-primary">{question.prompt}</h3>
                                                    </div>
                                                    <div className="flex shrink-0 flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setEditingId(question.id); setIsAddingNew(false); setDeleteConfirmId(null); }}
                                                            disabled={isBusy}
                                                            className="rounded-full border border-primary/12 bg-white px-4 py-2 text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-40"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleArchiveToggle(question)}
                                                            disabled={isBusy}
                                                            className="rounded-full border border-primary/12 bg-white px-4 py-2 text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-40"
                                                        >
                                                            {question.archived ? "Unarchive" : "Archive"}
                                                        </button>
                                                        {isConfirmingDelete ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void handleDeleteQuestion(question.id)}
                                                                    disabled={isBusy}
                                                                    className="rounded-full border border-secondary/40 bg-secondary px-4 py-2 text-xs uppercase tracking-[0.18em] text-white transition-colors hover:bg-secondary/90 disabled:opacity-40"
                                                                >
                                                                    {isBusy ? "Deleting…" : "Confirm Delete"}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeleteConfirmId(null)}
                                                                    className="rounded-full border border-primary/12 bg-white px-4 py-2 text-xs uppercase tracking-[0.18em] text-text-secondary transition-colors hover:border-primary"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteConfirmId(question.id)}
                                                                disabled={isBusy}
                                                                className="rounded-full border border-secondary/20 bg-white px-4 py-2 text-xs uppercase tracking-[0.18em] text-secondary transition-colors hover:border-secondary/60 hover:bg-secondary/5 disabled:opacity-40"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-4 grid gap-2 md:grid-cols-2">
                                                    {answers.map((answer, answerIndex) => (
                                                        <div
                                                            key={`${question.id}-answer-${answerIndex}`}
                                                            className={`rounded-[1rem] border px-3 py-3 text-sm ${
                                                                answerIndex === question.correct_index
                                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                                    : "border-primary/8 bg-[#fbf8f3] text-text-secondary"
                                                            }`}
                                                        >
                                                            <span className="mr-1.5 text-xs uppercase tracking-[0.24em] opacity-60">
                                                                {String.fromCharCode(65 + answerIndex)}
                                                            </span>
                                                            {answer}
                                                        </div>
                                                    ))}
                                                </div>

                                                {question.fun_fact ? (
                                                    <div className="mt-3 rounded-[1rem] border border-primary/8 bg-[#fbf8f3] px-4 py-3 text-sm leading-relaxed text-text-secondary">
                                                        <span className="mr-2 text-xs uppercase tracking-[0.24em]">Fun Fact</span>
                                                        {question.fun_fact}
                                                    </div>
                                                ) : null}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        if (modalView === "leaderboards") {
            return (
                <div className="grid gap-6 xl:grid-cols-3">
                    <div className="rounded-[1.8rem] border border-primary/10 bg-white p-6 shadow-[0_12px_34px_rgba(20,42,68,0.05)]">
                        <div className="flex items-end justify-between gap-4 border-b border-primary/8 pb-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Trivia</p>
                                <h3 className="mt-3 font-heading text-3xl text-primary">Top trivia scores</h3>
                            </div>
                            <p className="text-sm text-text-secondary">{triviaScores.length} submissions</p>
                        </div>
                        {gameScoresError ? (
                            <p className="mt-6 text-sm leading-relaxed text-secondary">{gameScoresError}</p>
                        ) : triviaScores.length === 0 ? (
                            <p className="mt-6 text-sm text-text-secondary">No trivia submissions yet.</p>
                        ) : (
                            <div className="mt-6 space-y-3">
                                {triviaScores.slice(0, 10).map((score, index) => {
                                    const player = getPlayerDetails(score);
                                    return (
                                        <div key={score.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[1.2rem] border border-primary/8 bg-[#fbf8f3] px-4 py-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{index + 1}</div>
                                            <div>
                                                <p className="font-medium text-primary">{player?.username ?? "Guest"}</p>
                                                <p className="text-sm text-text-secondary">{player?.email ?? "No email"}</p>
                                            </div>
                                            <div className="text-right text-primary">
                                                <p className="font-heading text-2xl">{score.score}</p>
                                                <p className="text-xs uppercase tracking-[0.22em] text-text-secondary">points</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="rounded-[1.8rem] border border-primary/10 bg-white p-6 shadow-[0_12px_34px_rgba(20,42,68,0.05)]">
                        <div className="flex items-end justify-between gap-4 border-b border-primary/8 pb-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Crossword</p>
                                <h3 className="mt-3 font-heading text-3xl text-primary">Top crossword scores</h3>
                            </div>
                            <p className="text-sm text-text-secondary">{crosswordScores.length} submissions</p>
                        </div>
                        {gameScoresError ? (
                            <p className="mt-6 text-sm leading-relaxed text-secondary">{gameScoresError}</p>
                        ) : crosswordScores.length === 0 ? (
                            <p className="mt-6 text-sm text-text-secondary">No crossword submissions yet.</p>
                        ) : (
                            <div className="mt-6 space-y-3">
                                {crosswordScores.slice(0, 10).map((score, index) => {
                                    const player = getPlayerDetails(score);
                                    return (
                                        <div key={score.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[1.2rem] border border-primary/8 bg-[#fbf8f3] px-4 py-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{index + 1}</div>
                                            <div>
                                                <p className="font-medium text-primary">{player?.username ?? "Guest"}</p>
                                                <p className="text-sm text-text-secondary">{getScoreLabel(score)}</p>
                                            </div>
                                            <div className="text-right text-primary">
                                                <p className="font-heading text-2xl">{score.score}</p>
                                                <p className="text-xs uppercase tracking-[0.22em] text-text-secondary">points</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="rounded-[1.8rem] border border-primary/10 bg-white p-6 shadow-[0_12px_34px_rgba(20,42,68,0.05)]">
                        <div className="flex items-end justify-between gap-4 border-b border-primary/8 pb-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Painedle</p>
                                <h3 className="mt-3 font-heading text-3xl text-primary">Today&rsquo;s leaders</h3>
                            </div>
                            <p className="text-sm text-text-secondary">{todayKey}</p>
                        </div>
                        {gameScoresError ? (
                            <p className="mt-6 text-sm leading-relaxed text-secondary">{gameScoresError}</p>
                        ) : todaysPainedleScores.length === 0 ? (
                            <p className="mt-6 text-sm text-text-secondary">No Painedle scores for today yet.</p>
                        ) : (
                            <div className="mt-6 space-y-3">
                                {todaysPainedleScores.slice(0, 10).map((score, index) => {
                                    const player = getPlayerDetails(score);
                                    return (
                                        <div key={score.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[1.2rem] border border-primary/8 bg-[#fbf8f3] px-4 py-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{index + 1}</div>
                                            <div>
                                                <p className="font-medium text-primary">{player?.username ?? "Guest"}</p>
                                                <p className="text-sm text-text-secondary">{score.attempts ?? "-"} guesses</p>
                                            </div>
                                            <div className="text-right text-primary">
                                                <p className="font-heading text-2xl">{score.score}</p>
                                                <p className="text-xs uppercase tracking-[0.22em] text-text-secondary">points</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (modalView === "submissions") {
            return (
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Activity Feed</p>
                            <h3 className="mt-3 font-heading text-4xl text-primary">Recent submissions</h3>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
                                Full score log with usernames, puzzle keys, timestamps, attempts, and profile signals pulled from the browser and request headers.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <ModalButton label="All" active={scoreFilter === "all"} onClick={() => setScoreFilter("all")} />
                            <ModalButton label="Trivia" active={scoreFilter === "trivia"} onClick={() => setScoreFilter("trivia")} />
                            <ModalButton label="Crossword" active={scoreFilter === "crossword"} onClick={() => setScoreFilter("crossword")} />
                            <ModalButton label="Painedle" active={scoreFilter === "painedle"} onClick={() => setScoreFilter("painedle")} />
                        </div>
                    </div>

                    {gameScoresError ? (
                        <div className="rounded-[1.5rem] border border-yellow-200 bg-yellow-50 px-5 py-5 text-sm leading-relaxed text-yellow-900">
                            {gameScoresError}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-[1.8rem] border border-primary/10 bg-white shadow-[0_12px_34px_rgba(20,42,68,0.05)]">
                            <div className="grid grid-cols-[1.1fr_0.8fr_0.6fr_0.6fr_0.9fr_1fr] gap-4 border-b border-primary/8 bg-[#fbf8f3] px-6 py-4 text-xs uppercase tracking-[0.26em] text-text-secondary">
                                <div>Player</div>
                                <div>Game / Puzzle</div>
                                <div>Score</div>
                                <div>Attempts</div>
                                <div>Profile</div>
                                <div>Submitted</div>
                            </div>
                            <div className="max-h-[32rem] overflow-auto divide-y divide-primary/6">
                                {filteredScores.map((score) => {
                                    const player = getPlayerDetails(score);
                                    const profile = getProfileSummary(score);
                                    return (
                                        <div key={score.id} className="grid grid-cols-[1.1fr_0.8fr_0.6fr_0.6fr_0.9fr_1fr] gap-4 px-6 py-4 text-sm text-text-secondary">
                                            <div>
                                                <p className="font-medium text-primary">{player?.username ?? "Guest"}</p>
                                                <p className="text-xs text-text-secondary">{player?.email ?? "No email"}</p>
                                            </div>
                                            <div>
                                                <p className="uppercase tracking-[0.14em] text-primary">{score.game}</p>
                                                <p className="text-xs text-text-secondary">{getPuzzleLabel(score)}</p>
                                            </div>
                                            <div className="text-primary">{getScoreLabel(score)}</div>
                                            <div>{score.attempts ?? "-"}</div>
                                            <div>
                                                <p className="text-primary">{profile.device}</p>
                                                <p className="text-xs text-text-secondary">{profile.location}</p>
                                                {profile.ip ? <p className="text-xs text-text-secondary">IP {profile.ip}</p> : null}
                                            </div>
                                            <div>{formatSubmissionTime(score.created_at)}</div>
                                        </div>
                                    );
                                })}
                                {filteredScores.length === 0 ? (
                                    <div className="px-6 py-10 text-center text-sm text-text-secondary">No submissions for this filter yet.</div>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (modalView === "players") {
            return (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <OverviewMetric
                            label="Unique Players"
                            value={uniquePlayers.length}
                            note="Distinct emails currently attached to game submissions."
                        />
                        <OverviewMetric
                            label="Most Active"
                            value={uniquePlayers[0]?.username ?? "-"}
                            note="Player with the highest number of total submissions."
                        />
                        <OverviewMetric
                            label="Trivia Players"
                            value={uniquePlayers.filter((player) => player.triviaSubmissions > 0).length}
                            note="Unique guests who have submitted at least one trivia score."
                        />
                        <OverviewMetric
                            label="Crossword Players"
                            value={uniquePlayers.filter((player) => player.crosswordSubmissions > 0).length}
                            note="Unique guests who have submitted the crossword board."
                        />
                    </div>

                    {gameScoresError ? (
                        <div className="rounded-[1.5rem] border border-yellow-200 bg-yellow-50 px-5 py-5 text-sm leading-relaxed text-yellow-900">
                            {gameScoresError}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-[1.8rem] border border-primary/10 bg-white shadow-[0_12px_34px_rgba(20,42,68,0.05)]">
                            <div className="grid grid-cols-[1fr_0.45fr_0.55fr_0.55fr_0.55fr_1fr] gap-4 border-b border-primary/8 bg-[#fbf8f3] px-6 py-4 text-xs uppercase tracking-[0.26em] text-text-secondary">
                                <div>Player</div>
                                <div>Total</div>
                                <div>Best Trivia</div>
                                <div>Best Crossword</div>
                                <div>Best Painedle</div>
                                <div>Latest Profile</div>
                            </div>
                            <div className="max-h-[32rem] overflow-auto divide-y divide-primary/6">
                                {uniquePlayers.map((player) => (
                                    <div key={player.email || player.username} className="grid grid-cols-[1fr_0.45fr_0.55fr_0.55fr_0.55fr_1fr] gap-4 px-6 py-4 text-sm text-text-secondary">
                                        <div>
                                            <p className="font-medium text-primary">{player.username}</p>
                                            <p className="text-xs text-text-secondary">{player.email || "No email"}</p>
                                        </div>
                                        <div>{player.totalSubmissions}</div>
                                        <div>{player.bestTriviaScore ?? "-"}</div>
                                        <div>{player.bestCrosswordScore ?? "-"}</div>
                                        <div>{player.bestPainedleScore ?? "-"}</div>
                                        <div>
                                            <p className="text-primary">{player.latestDevice ?? "Unknown device"}</p>
                                            <p className="text-xs text-text-secondary">{player.latestLocation ?? "Unknown location"}</p>
                                            <p className="text-xs text-text-secondary">
                                                {player.latestSeenAt ? `Seen ${formatSubmissionTime(player.latestSeenAt)}` : "No recent activity"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {uniquePlayers.length === 0 ? (
                                    <div className="px-6 py-10 text-center text-sm text-text-secondary">No players yet.</div>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    }

    return (
        <>
            <div className="space-y-8">
                {gameScoresError ? (
                    <div className="rounded-[1.8rem] border border-yellow-200 bg-yellow-50 px-6 py-5 text-sm leading-relaxed text-yellow-900">
                        <p className="text-xs uppercase tracking-[0.28em] text-yellow-800">Games Health</p>
                        <p className="mt-3">
                            {gameScoresError} Static admin controls below still work, so you can review trivia content,
                            today&rsquo;s word, and the full Painedle bank even before the tables are ready.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-[1.8rem] border border-primary/10 bg-[linear-gradient(145deg,#173756_0%,#10253c_100%)] px-6 py-5 text-white shadow-[0_16px_44px_rgba(20,42,68,0.12)]">
                        <p className="text-xs uppercase tracking-[0.28em] text-white/60">Games Status</p>
                        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <p className="max-w-3xl text-sm leading-relaxed text-white/80">
                                Painedle is live now, the crossword unlocks {crosswordRemaining.isUnlocked ? "now" : `on ${CROSSWORD_UNLOCK_LABEL}`}, and trivia stays locked until {TRIVIA_UNLOCK_LABEL}.
                            </p>
                            <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/78">
                                {crosswordRemaining.isUnlocked
                                    ? (remaining.isUnlocked ? "Crossword + Trivia Live" : "Crossword Live")
                                    : `${crosswordRemaining.days}d ${crosswordRemaining.hours}h ${crosswordRemaining.minutes}m until crossword`}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <OverviewMetric
                        label="Total Scores"
                        value={gameScores.length}
                        note="All leaderboard rows across the live game set."
                    />
                    <OverviewMetric
                        label="Unique Players"
                        value={uniquePlayers.length}
                        note="Distinct users by email."
                    />
                    <OverviewMetric
                        label="Trivia Scores"
                        value={triviaScores.length}
                        note="All trivia submissions so far."
                    />
                    <OverviewMetric
                        label="Crossword Scores"
                        value={crosswordScores.length}
                        note="All mini crossword submissions so far."
                    />
                    <OverviewMetric
                        label="Avg Trivia"
                        value={averageTriviaScore}
                        note="Average trivia score out of 10."
                    />
                    <OverviewMetric
                        label="Today's Painedle"
                        value={todaysPainedleScores.length}
                        note="Submissions against today's puzzle key."
                    />
                    <OverviewMetric
                        label="Word Bank"
                        value={PAINEDLE_WORDS.length}
                        note="Total Painedle answers in rotation."
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                    <ControlCard
                        eyebrow="Painedle Control Room"
                        title="Daily puzzle management"
                        copy="Keep the live word hidden in the overview, then drill into the answer, the upcoming schedule, or the full bank only when needed."
                    >
                        <PillButton label="Reveal today's word" onClick={() => setModalView("today-word")} />
                        <PillButton label="Preview schedule" onClick={() => setModalView("schedule")} />
                        <PillButton label="View word bank" onClick={() => setModalView("word-bank")} />
                    </ControlCard>

                    <ControlCard
                        eyebrow="Crossword Control Room"
                        title="Week-before puzzle preview"
                        copy="Review the full clue list, the solved grid, and the unlock date without exposing the answers in the overview."
                    >
                        <PillButton label="Preview crossword" onClick={() => setModalView("crossword")} />
                        <PillButton label="Leaderboards" onClick={() => setModalView("leaderboards")} />
                    </ControlCard>

                    <ControlCard
                        eyebrow="Trivia Control Room"
                        title="Question and launch management"
                        copy="Review every trivia prompt, the correct answer, fun facts, and the current launch state without dumping the entire question bank into the tab body."
                    >
                        <PillButton label="Question bank" onClick={() => setModalView("trivia-bank")} />
                        <PillButton label="Leaderboards" onClick={() => setModalView("leaderboards")} />
                    </ControlCard>

                    <ControlCard
                        eyebrow="Player Activity"
                        title="Submissions and people"
                        copy="Track recent submissions, inspect score timing, and see who is actually playing without turning the overview into a giant table."
                    >
                        <PillButton label="Recent submissions" onClick={() => setModalView("submissions")} />
                        <PillButton label="Player directory" onClick={() => setModalView("players")} />
                    </ControlCard>
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                    <div className="rounded-[1.8rem] border border-primary/10 bg-white p-6 shadow-[0_12px_34px_rgba(20,42,68,0.05)]">
                        <div className="flex items-end justify-between gap-4 border-b border-primary/8 pb-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Preview</p>
                                <h3 className="mt-3 font-heading text-3xl text-primary">Crossword board</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalView("crossword")}
                                className="text-xs uppercase tracking-[0.22em] text-primary hover:text-secondary"
                            >
                                Open preview
                            </button>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-text-secondary">Unlock</p>
                                <p className="mt-2 text-lg text-primary">{CROSSWORD_UNLOCK_LABEL}</p>
                                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                                    Static one-board puzzle with fill-in-the-blank clues from the couple&apos;s story.
                                </p>
                            </div>
                            <div className="rounded-[1.4rem] border border-primary/10 bg-[#fbf8f3] px-5 py-4 text-center">
                                <p className="text-xs uppercase tracking-[0.24em] text-text-secondary">Entries</p>
                                <p className="mt-2 font-heading text-4xl text-primary">{CROSSWORD_PUZZLE.entries.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-primary/10 bg-white p-6 shadow-[0_12px_34px_rgba(20,42,68,0.05)]">
                        <div className="flex items-end justify-between gap-4 border-b border-primary/8 pb-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Preview</p>
                                <h3 className="mt-3 font-heading text-3xl text-primary">Trivia leaderboard</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalView("leaderboards")}
                                className="text-xs uppercase tracking-[0.22em] text-primary hover:text-secondary"
                            >
                                View full
                            </button>
                        </div>
                        {gameScoresError ? (
                            <p className="mt-6 text-sm leading-relaxed text-secondary">{gameScoresError}</p>
                        ) : leaderboardPreview.trivia.length === 0 ? (
                            <p className="mt-6 text-sm text-text-secondary">No trivia scores yet.</p>
                        ) : (
                            <div className="mt-6 space-y-3">
                                {leaderboardPreview.trivia.map((score, index) => {
                                    const player = getPlayerDetails(score);
                                    return (
                                        <div key={score.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[1.2rem] border border-primary/8 bg-[#fbf8f3] px-4 py-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{index + 1}</div>
                                            <div>
                                                <p className="font-medium text-primary">{player?.username ?? "Guest"}</p>
                                                <p className="text-sm text-text-secondary">{player?.email ?? "No email"}</p>
                                            </div>
                                            <div className="text-primary">{score.score}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="rounded-[1.8rem] border border-primary/10 bg-white p-6 shadow-[0_12px_34px_rgba(20,42,68,0.05)]">
                        <div className="flex items-end justify-between gap-4 border-b border-primary/8 pb-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Preview</p>
                                <h3 className="mt-3 font-heading text-3xl text-primary">Today&rsquo;s Painedle board</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalView("today-word")}
                                className="text-xs uppercase tracking-[0.22em] text-primary hover:text-secondary"
                            >
                                Reveal word
                            </button>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-text-secondary">Today&rsquo;s key</p>
                                <p className="mt-2 text-lg text-primary">{todayKey}</p>
                                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                                    Live answer is hidden from the overview. Open the reveal view when you need it.
                                </p>
                            </div>
                            <div className="rounded-[1.4rem] border border-primary/10 bg-[#fbf8f3] px-5 py-4 text-center">
                                <p className="text-xs uppercase tracking-[0.24em] text-text-secondary">Today&rsquo;s plays</p>
                                <p className="mt-2 font-heading text-4xl text-primary">{todaysPainedleScores.length}</p>
                            </div>
                        </div>

                        {gameScoresError ? (
                            <p className="mt-6 text-sm leading-relaxed text-secondary">{gameScoresError}</p>
                        ) : leaderboardPreview.painedle.length === 0 ? (
                            <p className="mt-6 text-sm text-text-secondary">No Painedle submissions for today yet.</p>
                        ) : (
                            <div className="mt-6 space-y-3">
                                {leaderboardPreview.painedle.map((score, index) => {
                                    const player = getPlayerDetails(score);
                                    return (
                                        <div key={score.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[1.2rem] border border-primary/8 bg-[#fbf8f3] px-4 py-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{index + 1}</div>
                                            <div>
                                                <p className="font-medium text-primary">{player?.username ?? "Guest"}</p>
                                                <p className="text-sm text-text-secondary">{score.attempts ?? "-"} guesses</p>
                                            </div>
                                            <div className="text-primary">{score.score}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {modalView ? (
                <div className="fixed inset-0 z-[70] bg-primary/60 px-4 py-6 backdrop-blur-sm">
                    <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-primary/12 bg-[linear-gradient(180deg,#fcfaf6_0%,#f5efe6_100%)] shadow-[0_30px_90px_rgba(20,42,68,0.25)]">
                        <div className="flex flex-col gap-4 border-b border-primary/10 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
                            <div>
                                <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">Games Admin</p>
                                <h2 className="mt-2 font-heading text-3xl text-primary">
                                    {modalView === "today-word" && "Today's Painedle"}
                                    {modalView === "schedule" && "Painedle schedule preview"}
                                    {modalView === "word-bank" && "Painedle word bank"}
                                    {modalView === "crossword" && "Mini crossword preview"}
                                    {modalView === "trivia-bank" && "Trivia question bank"}
                                    {modalView === "leaderboards" && "Leaderboard views"}
                                    {modalView === "submissions" && "Recent submissions"}
                                    {modalView === "players" && "Player directory"}
                                </h2>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalView(null)}
                                    className="rounded-full border border-primary/12 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em] text-primary transition-colors duration-200 hover:bg-primary hover:text-white"
                                >
                                    Back to Games Overview
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalView(null)}
                                    className="rounded-full bg-primary px-4 py-2 text-xs uppercase tracking-[0.22em] text-white transition-colors duration-200 hover:bg-primary/90"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto px-6 py-6 md:px-8 md:py-8">{renderModalContent()}</div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
