"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ScoreSubmissionForm from "@/components/games/ScoreSubmissionForm";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
    computeCrosswordScore,
    getDailyCrosswordPuzzle,
    getCrosswordStorageKey,
    type CrosswordCell,
    type CrosswordDirection,
    type CrosswordMetadata,
    type CrosswordNumberedEntry,
} from "@/lib/games/crossword";

function getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TODAY_KEY = getTodayKey();
const PUZZLE = getDailyCrosswordPuzzle(TODAY_KEY);
const STORAGE_KEY = getCrosswordStorageKey(PUZZLE.id, TODAY_KEY);

type SavedCrosswordState = {
    letters: Record<string, string>;
    activeEntryId: string;
    revealedEntryIds: string[];
    startedAt: string;
    completedAt: string | null;
    scoreSubmitted: boolean;
};

const ENTRY_MAP = new Map<string, CrosswordNumberedEntry>(PUZZLE.entries.map((entry) => [entry.id, entry]));
const ENTRY_IDS_BY_CELL = new Map<string, string[]>(
    PUZZLE.cells
        .filter((cell) => cell.answer)
        .map((cell) => [cell.key, cell.entryIds])
);

function getEmptyLetters() {
    return Object.fromEntries(
        PUZZLE.cells.filter((cell) => cell.answer).map((cell) => [cell.key, ""])
    ) as Record<string, string>;
}

function getDefaultState(): SavedCrosswordState {
    return {
        letters: getEmptyLetters(),
        activeEntryId: PUZZLE.entries[0]?.id ?? "",
        revealedEntryIds: [],
        startedAt: new Date().toISOString(),
        completedAt: null,
        scoreSubmitted: false,
    };
}

function getInitialState(): SavedCrosswordState {
    if (typeof window === "undefined") {
        return getDefaultState();
    }

    try {
        const rawValue = window.localStorage.getItem(STORAGE_KEY);
        if (!rawValue) return getDefaultState();

        const parsed = JSON.parse(rawValue) as Partial<SavedCrosswordState>;
        return {
            letters: parsed.letters ? { ...getEmptyLetters(), ...parsed.letters } : getEmptyLetters(),
            activeEntryId: parsed.activeEntryId && ENTRY_MAP.has(parsed.activeEntryId)
                ? parsed.activeEntryId
                : (PUZZLE.entries[0]?.id ?? ""),
            revealedEntryIds: Array.isArray(parsed.revealedEntryIds)
                ? parsed.revealedEntryIds.filter((id) => ENTRY_MAP.has(id))
                : [],
            startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : new Date().toISOString(),
            completedAt: typeof parsed.completedAt === "string" || parsed.completedAt === null ? parsed.completedAt : null,
            scoreSubmitted: typeof parsed.scoreSubmitted === "boolean" ? parsed.scoreSubmitted : false,
        };
    } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        return getDefaultState();
    }
}

function isSolvedLetters(letters: Record<string, string>) {
    return PUZZLE.cells.every((cell) => !cell.answer || letters[cell.key] === cell.answer);
}

function getEntryById(entryId: string | null) {
    return entryId ? ENTRY_MAP.get(entryId) ?? null : null;
}

function focusInput(inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>, cellKey: string) {
    const input = inputRefs.current[cellKey];
    input?.focus();
}

export default function MiniCrosswordGame() {
    const [initialState] = useState(getInitialState);
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [letters, setLetters] = useState<Record<string, string>>(initialState.letters);
    const [activeEntryId, setActiveEntryId] = useState<string>(initialState.activeEntryId);
    const [revealedEntryIds, setRevealedEntryIds] = useState<string[]>(initialState.revealedEntryIds);
    const [startedAt, setStartedAt] = useState(initialState.startedAt);
    const [completedAt, setCompletedAt] = useState<string | null>(initialState.completedAt);
    const [scoreSubmitted, setScoreSubmitted] = useState(initialState.scoreSubmitted);
    const [notice, setNotice] = useState("Tap a clue or a square to start filling the board.");
    const [focusedCellKey, setFocusedCellKey] = useState<string | null>(null);
    const [durationSeconds, setDurationSeconds] = useState(1);
    const [autoCheck, setAutoCheck] = useState(false);

    const { isAdmin } = useAdminSession();

    // Auto-check: only highlight incorrect cells when the toggle is on
    const incorrectKeys = useMemo(
        () =>
            autoCheck
                ? PUZZLE.cells
                    .filter((cell) => cell.answer && letters[cell.key] && letters[cell.key] !== cell.answer)
                    .map((cell) => cell.key)
                : [],
        [letters, autoCheck]
    );

    useEffect(() => {
        const payload: SavedCrosswordState = {
            letters,
            activeEntryId,
            revealedEntryIds,
            startedAt,
            completedAt,
            scoreSubmitted,
        };

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, [letters, activeEntryId, revealedEntryIds, startedAt, completedAt, scoreSubmitted]);

    const activeEntry = getEntryById(activeEntryId);
    const activeCells = activeEntry?.cells ?? [];

    const fillCount = useMemo(
        () => Object.values(letters).filter(Boolean).length,
        [letters]
    );
    const totalFillableCells = Object.keys(getEmptyLetters()).length;
    const isSolved = useMemo(
        () => PUZZLE.cells.every((cell) => !cell.answer || letters[cell.key] === cell.answer),
        [letters]
    );

    useEffect(() => {
        function updateDuration() {
            const endTime = completedAt ? new Date(completedAt).getTime() : Date.now();
            setDurationSeconds(Math.max(1, Math.round((endTime - new Date(startedAt).getTime()) / 1000)));
        }

        updateDuration();

        if (completedAt) return;

        const interval = window.setInterval(updateDuration, 1000);
        return () => window.clearInterval(interval);
    }, [completedAt, startedAt]);

    const score = computeCrosswordScore(durationSeconds, 0, revealedEntryIds.length);
    const metadata: CrosswordMetadata = {
        duration_seconds: durationSeconds,
        checks_used: 0,
        reveals_used: revealedEntryIds.length,
        completed_at: completedAt ?? startedAt,
    };

    function selectEntry(entry: CrosswordNumberedEntry, focus = true) {
        setActiveEntryId(entry.id);
        const firstOpenCell = entry.cells.find((cellKey) => !letters[cellKey]) ?? entry.cells[0];

        if (focus && firstOpenCell) {
            window.requestAnimationFrame(() => {
                focusInput(inputRefs, firstOpenCell);
            });
        }
    }

    function getEntryForCell(cellKey: string, preferredDirection?: CrosswordDirection) {
        const entryIds = ENTRY_IDS_BY_CELL.get(cellKey) ?? [];
        if (entryIds.length === 0) return null;

        if (preferredDirection) {
            const matching = entryIds.find((entryId) => ENTRY_MAP.get(entryId)?.direction === preferredDirection);
            if (matching) return ENTRY_MAP.get(matching) ?? null;
        }

        return ENTRY_MAP.get(entryIds[0]) ?? null;
    }

    function moveWithinEntry(entry: CrosswordNumberedEntry | null, currentKey: string, step: 1 | -1) {
        if (!entry) return;
        const currentIndex = entry.cells.indexOf(currentKey);
        if (currentIndex === -1) return;
        const nextKey = entry.cells[currentIndex + step];
        if (nextKey) {
            focusInput(inputRefs, nextKey);
        }
    }

    function updateCell(cellKey: string, rawValue: string) {
        const nextValue = rawValue.replace(/[^a-z]/gi, "").slice(-1).toUpperCase();
        const nextLetters = { ...letters, [cellKey]: nextValue };
        setLetters(nextLetters);

        if (!completedAt && isSolvedLetters(nextLetters)) {
            setCompletedAt(new Date().toISOString());
            setNotice("Puzzle complete. Submit your score to lock in your spot on the board.");
        }

        if (nextValue && activeEntry) {
            const currentIndex = activeEntry.cells.indexOf(cellKey);
            const nextKey = activeEntry.cells[currentIndex + 1];
            if (nextKey) {
                window.requestAnimationFrame(() => focusInput(inputRefs, nextKey));
            }
        }
    }

    function handleCellClick(cell: CrosswordCell) {
        if (!cell.answer) return;
        const entryIds = ENTRY_IDS_BY_CELL.get(cell.key) ?? [];
        if (entryIds.length === 2) {
            const nextId = activeEntryId === entryIds[0] ? entryIds[1] : entryIds[0];
            setActiveEntryId(nextId);
            return;
        }

        const entry = getEntryForCell(cell.key, activeEntry?.direction);
        if (entry) setActiveEntryId(entry.id);
    }

    function handleRevealEntry() {
        if (!activeEntry) return;

        const nextLetters = { ...letters };
        activeEntry.cells.forEach((cellKey, index) => {
            nextLetters[cellKey] = activeEntry.answer[index] ?? "";
        });
        setLetters(nextLetters);
        setRevealedEntryIds((current) => (current.includes(activeEntry.id) ? current : [...current, activeEntry.id]));

        if (!completedAt && isSolvedLetters(nextLetters)) {
            setCompletedAt(new Date().toISOString());
            setNotice("Puzzle complete. Submit your score to lock in your spot on the board.");
            return;
        }

        setNotice(`Revealed ${activeEntry.number} ${activeEntry.direction}.`);
    }

    function handleResetPuzzle() {
        const shouldReset = window.confirm("Reset the crossword and clear your saved progress on this browser?");
        if (!shouldReset) return;

        const freshLetters = getEmptyLetters();
        setLetters(freshLetters);
        setActiveEntryId(PUZZLE.entries[0]?.id ?? "");
        setRevealedEntryIds([]);
        setStartedAt(new Date().toISOString());
        setCompletedAt(null);
        setScoreSubmitted(false);
        setFocusedCellKey(null);
        setNotice("Puzzle reset. Start with any clue.");
        window.localStorage.removeItem(STORAGE_KEY);
    }

    function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>, cell: CrosswordCell) {
        if (!cell.answer) return;

        if (event.key === "Backspace") {
            event.preventDefault();
            if (letters[cell.key]) {
                setLetters((current) => ({ ...current, [cell.key]: "" }));
                return;
            }

            moveWithinEntry(activeEntry, cell.key, -1);
            return;
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            const nextEntry = getEntryForCell(cell.key, "across");
            if (nextEntry) {
                setActiveEntryId(nextEntry.id);
                moveWithinEntry(nextEntry, cell.key, 1);
            }
            return;
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            const nextEntry = getEntryForCell(cell.key, "across");
            if (nextEntry) {
                setActiveEntryId(nextEntry.id);
                moveWithinEntry(nextEntry, cell.key, -1);
            }
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            const nextEntry = getEntryForCell(cell.key, "down");
            if (nextEntry) {
                setActiveEntryId(nextEntry.id);
                moveWithinEntry(nextEntry, cell.key, 1);
            }
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            const nextEntry = getEntryForCell(cell.key, "down");
            if (nextEntry) {
                setActiveEntryId(nextEntry.id);
                moveWithinEntry(nextEntry, cell.key, -1);
            }
        }
    }

    return (
        <div className="overflow-hidden rounded-[2.2rem] border border-primary/12 bg-[linear-gradient(160deg,#fffdf8_0%,#f4efe6_100%)] shadow-[0_24px_80px_rgba(20,42,68,0.10)]">

            {/* ── Header ── */}
            <div className="border-b border-primary/8 px-5 py-6 md:px-8 md:py-7">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-text-secondary">Daily Puzzle</p>
                        <h2 className="mt-2 font-heading text-4xl text-primary">Mini Crossword</h2>
                        <p className="mt-2 leading-relaxed text-text-secondary">
                            Six clues built around Ashlyn and Jeffrey. Tap a square or clue to begin.
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2.5 pt-1">
                        {/* Stats */}
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                            <span>{fillCount}&thinsp;/&thinsp;{totalFillableCells}</span>
                            <span className="opacity-30">·</span>
                            <span className="font-semibold text-primary">{score}&thinsp;pts</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1.5">
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={handleRevealEntry}
                                    disabled={!activeEntry || isSolved}
                                    className="rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-amber-700 transition-colors hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Reveal
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setAutoCheck((v) => !v)}
                                className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors ${
                                    autoCheck
                                        ? "border-accent/40 bg-accent/15 text-accent hover:bg-accent/25"
                                        : "border-primary/15 bg-primary/5 text-text-secondary hover:bg-primary/10 hover:text-primary"
                                }`}
                            >
                                {autoCheck ? "Check ✓" : "Check"}
                            </button>
                            <button
                                type="button"
                                onClick={handleResetPuzzle}
                                className="rounded-full border border-secondary/15 bg-secondary/6 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-secondary transition-colors hover:bg-secondary hover:text-white"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Notice bar ── */}
            <div className="border-b border-primary/6 bg-white/30 px-5 py-2 text-xs text-text-secondary md:px-6">
                {notice}
            </div>

            {/* ── Main 2-col: grid left, clues right ── */}
            <div className="grid md:grid-cols-2">

                {/* Left: grid panel — self-start so it doesn't stretch when right col grows */}
                <div className="self-start bg-[linear-gradient(155deg,#173756_0%,#214467_100%)] p-4 md:p-5">
                    {/* Active entry badge above the grid */}
                    <div className="mb-2.5 flex items-center justify-between text-[11px]">
                        <span className="uppercase tracking-[0.22em] text-white/55">
                            {activeEntry ? `${activeEntry.number} ${activeEntry.direction}` : "tap a square"}
                        </span>
                        <span className="hidden text-white/35 sm:block">tap twice to switch direction</span>
                    </div>

                    {/* Grid fills column width */}
                    <div
                        className="grid w-full gap-1.5"
                        style={{ gridTemplateColumns: `repeat(${PUZZLE.cols}, minmax(0, 1fr))` }}
                    >
                        {PUZZLE.cells.map((cell) => {
                            if (!cell.answer) {
                                return <div key={cell.key} className="aspect-square rounded-[0.35rem] bg-[#0f2033]" />;
                            }

                            const isFocused = focusedCellKey === cell.key;
                            const isInActiveEntry = activeCells.includes(cell.key);
                            const isIncorrect = incorrectKeys.includes(cell.key);

                            return (
                                <label
                                    key={cell.key}
                                    className={`relative flex aspect-square items-stretch overflow-hidden rounded-[0.4rem] border transition-colors ${
                                        isIncorrect
                                            ? "border-secondary bg-secondary/30"
                                            : isFocused
                                                ? "border-accent bg-white shadow-[inset_0_-2.5px_0_0_#7c1f28]"
                                                : isInActiveEntry
                                                    ? "border-accent bg-white"
                                                    : "border-white/20 bg-white/80"
                                    }`}
                                >
                                    {cell.number ? (
                                        <span className="pointer-events-none absolute left-0.5 top-0.5 text-[8px] font-semibold leading-none text-primary/65">
                                            {cell.number}
                                        </span>
                                    ) : null}
                                    <input
                                        ref={(element) => {
                                            inputRefs.current[cell.key] = element;
                                        }}
                                        value={letters[cell.key] ?? ""}
                                        onChange={(event) => updateCell(cell.key, event.target.value)}
                                        onFocus={(event) => {
                                            event.target.select();
                                            const entry = getEntryForCell(cell.key, activeEntry?.direction);
                                            if (entry) setActiveEntryId(entry.id);
                                            setFocusedCellKey(cell.key);
                                        }}
                                        onBlur={() => setFocusedCellKey(null)}
                                        onClick={() => handleCellClick(cell)}
                                        onKeyDown={(event) => handleInputKeyDown(event, cell)}
                                        maxLength={1}
                                        inputMode="text"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="characters"
                                        spellCheck={false}
                                        data-form-type="other"
                                        aria-label={`Crossword cell ${cell.row + 1}, ${cell.col + 1}`}
                                        disabled={isSolved}
                                        className="h-full w-full cursor-default bg-transparent px-0 pb-0 pt-3 text-center text-xl font-semibold uppercase tracking-[0.05em] text-primary outline-none [caret-color:transparent] selection:bg-transparent"
                                    />
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Right: active clue + clue lists */}
                <div className="flex flex-col divide-y divide-primary/8 bg-white/60">

                    {/* Active clue */}
                    <div className="px-5 py-5 md:px-6">
                        <div className="flex items-baseline gap-2">
                            <span className="font-heading text-4xl leading-none text-primary">
                                {activeEntry ? activeEntry.number : "—"}
                            </span>
                            <span className="text-[11px] uppercase tracking-[0.24em] text-text-secondary">
                                {activeEntry?.direction ?? ""}
                            </span>
                            {activeEntry && revealedEntryIds.includes(activeEntry.id) ? (
                                <span className="ml-auto shrink-0 rounded-full border border-secondary/25 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-secondary">
                                    Revealed
                                </span>
                            ) : null}
                        </div>
                        <p className="mt-3 text-[15px] leading-snug text-primary">
                            {activeEntry?.clue ?? "Select a clue or tap a square to begin."}
                        </p>
                    </div>

                    {/* Across · Down side-by-side */}
                    <div className="grid flex-1 grid-cols-2 divide-x divide-primary/8">
                        <div className="px-4 py-4 md:px-5">
                            <p className="mb-2.5 text-[10px] uppercase tracking-[0.28em] text-text-secondary">Across</p>
                            <div className="space-y-1.5">
                                {PUZZLE.across.map((entry) => (
                                    <button
                                        key={entry.id}
                                        type="button"
                                        onClick={() => selectEntry(entry)}
                                        className={`w-full rounded-xl border px-3 py-3 text-left text-sm leading-snug transition-colors ${
                                            activeEntryId === entry.id
                                                ? "border-primary bg-primary text-white"
                                                : "border-primary/8 bg-[#f9f6f1] text-primary hover:border-primary/22 hover:bg-white"
                                        }`}
                                    >
                                        <span className={`mr-1.5 text-[10px] font-bold ${activeEntryId === entry.id ? "opacity-70" : "text-text-secondary"}`}>
                                            {entry.number}
                                        </span>
                                        {entry.clue}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="px-4 py-4 md:px-5">
                            <p className="mb-2.5 text-[10px] uppercase tracking-[0.28em] text-text-secondary">Down</p>
                            <div className="space-y-1.5">
                                {PUZZLE.down.map((entry) => (
                                    <button
                                        key={entry.id}
                                        type="button"
                                        onClick={() => selectEntry(entry)}
                                        className={`w-full rounded-xl border px-3 py-3 text-left text-sm leading-snug transition-colors ${
                                            activeEntryId === entry.id
                                                ? "border-primary bg-primary text-white"
                                                : "border-primary/8 bg-[#f9f6f1] text-primary hover:border-primary/22 hover:bg-white"
                                        }`}
                                    >
                                        <span className={`mr-1.5 text-[10px] font-bold ${activeEntryId === entry.id ? "opacity-70" : "text-text-secondary"}`}>
                                            {entry.number}
                                        </span>
                                        {entry.clue}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Completion / score submission */}
                    {isSolved ? (
                        <div className="px-5 py-5 md:px-6 space-y-4">
                            {/* Congratulations banner */}
                            <div className="rounded-[1.5rem] border border-accent/25 bg-[linear-gradient(160deg,#fffbf0_0%,#fdf3d8_100%)] px-5 py-4 text-center">
                                <p className="text-2xl">🎉</p>
                                <p className="mt-1.5 font-heading text-xl text-primary">You solved it!</p>
                                <p className="mt-1 text-sm text-text-secondary">
                                    Finished in {Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, "0")}
                                    {revealedEntryIds.length > 0 ? ` · ${revealedEntryIds.length} reveal${revealedEntryIds.length > 1 ? "s" : ""}` : " · clean solve"}
                                    {" · "}<span className="font-semibold text-primary">{score} pts</span>
                                </p>
                            </div>
                            {scoreSubmitted ? (
                                <div className="rounded-[1.5rem] border border-emerald-200/70 bg-[linear-gradient(160deg,#f2faf5_0%,#e8f5ed_100%)] px-5 py-4">
                                    <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Score Locked In</p>
                                    <p className="mt-2 text-sm text-text-secondary">You're on the leaderboard. Check back to see how others do.</p>
                                </div>
                            ) : (
                                <ScoreSubmissionForm
                                    game="crossword"
                                    score={score}
                                    maxScore={100}
                                    attempts={revealedEntryIds.length}
                                    solved={true}
                                    puzzleKey={PUZZLE.id}
                                    metadata={metadata}
                                    buttonLabel="Submit Crossword Score"
                                    successMessage="Crossword score submitted."
                                    onSubmitted={() => setScoreSubmitted(true)}
                                />
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
