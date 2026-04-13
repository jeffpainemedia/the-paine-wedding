"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ScoreSubmissionForm from "@/components/games/ScoreSubmissionForm";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
    computeCrosswordScore,
    getCentralDateKey,
    getCrosswordStorageKey,
    type BuiltCrossword,
    type CrosswordCell,
    type CrosswordDirection,
    type CrosswordMetadata,
    type CrosswordNumberedEntry,
} from "@/lib/games/crossword";

function getTodayKey(): string {
    return getCentralDateKey();
}

function cellKey(row: number, col: number) {
    return `${row}:${col}`;
}

type SavedState = {
    letters: Record<string, string>;
    activeEntryId: string;
    revealedEntryIds: string[];
    durationSeconds: number | null;
    scoreSubmitted: boolean;
};

function emptyLetters(puzzle: BuiltCrossword): Record<string, string> {
    return Object.fromEntries(puzzle.cells.filter((c) => c.answer).map((c) => [c.key, ""]));
}

function defaultState(puzzle: BuiltCrossword): SavedState {
    return {
        letters: emptyLetters(puzzle),
        activeEntryId: puzzle.entries[0]?.id ?? "",
        revealedEntryIds: [],
        durationSeconds: null,
        scoreSubmitted: false,
    };
}

function loadState(puzzle: BuiltCrossword, storageKey: string): SavedState {
    if (typeof window === "undefined") return defaultState(puzzle);

    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return defaultState(puzzle);

        const parsed = JSON.parse(raw) as Partial<SavedState & { startedAt?: string; completedAt?: string }>;
        return {
            letters: parsed.letters ? { ...emptyLetters(puzzle), ...parsed.letters } : emptyLetters(puzzle),
            activeEntryId:
                parsed.activeEntryId && puzzle.entries.some((entry) => entry.id === parsed.activeEntryId)
                    ? parsed.activeEntryId
                    : (puzzle.entries[0]?.id ?? ""),
            revealedEntryIds: Array.isArray(parsed.revealedEntryIds)
                ? parsed.revealedEntryIds.filter((id) => puzzle.entries.some((entry) => entry.id === id))
                : [],
            durationSeconds:
                typeof parsed.durationSeconds === "number"
                    ? parsed.durationSeconds
                    : parsed.startedAt && parsed.completedAt
                        ? Math.round((new Date(parsed.completedAt).getTime() - new Date(parsed.startedAt).getTime()) / 1000)
                        : null,
            scoreSubmitted: typeof parsed.scoreSubmitted === "boolean" ? parsed.scoreSubmitted : false,
        };
    } catch {
        window.localStorage.removeItem(storageKey);
        return defaultState(puzzle);
    }
}

function isSolved(puzzle: BuiltCrossword, letters: Record<string, string>) {
    return puzzle.cells.every((cell) => !cell.answer || letters[cell.key] === cell.answer);
}

function fmtTime(secs: number) {
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}

type MiniCrosswordGameProps = {
    puzzle: BuiltCrossword;
    dateKey?: string;
};

export default function MiniCrosswordGame({ puzzle, dateKey = getTodayKey() }: MiniCrosswordGameProps) {
    const storageKey = useMemo(() => getCrosswordStorageKey(puzzle.id, dateKey), [puzzle.id, dateKey]);
    const entryMap = useMemo(() => new Map<string, CrosswordNumberedEntry>(puzzle.entries.map((entry) => [entry.id, entry])), [puzzle.entries]);
    const entryIdsByCell = useMemo(
        () => new Map<string, string[]>(puzzle.cells.filter((cell) => cell.answer).map((cell) => [cell.key, cell.entryIds])),
        [puzzle.cells]
    );
    const cellMap = useMemo(() => new Map<string, CrosswordCell>(puzzle.cells.map((cell) => [cell.key, cell])), [puzzle.cells]);
    const tabOrder = useMemo(() => [...puzzle.across.map((entry) => entry.id), ...puzzle.down.map((entry) => entry.id)], [puzzle.across, puzzle.down]);
    const [init] = useState(() => loadState(puzzle, storageKey));
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const clueRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const startTimestamp = useRef<number>(0);
    const pausedSinceRef = useRef<number | null>(null);

    const [letters, setLetters] = useState(init.letters);
    const [activeEntryId, setActiveEntryId] = useState(init.activeEntryId);
    const [revealedEntryIds, setRevealedEntryIds] = useState(init.revealedEntryIds);
    const [durationSeconds, setDurationSeconds] = useState<number | null>(init.durationSeconds);
    const [scoreSubmitted, setScoreSubmitted] = useState(init.scoreSubmitted);
    const [focusedKey, setFocusedKey] = useState<string | null>(null);
    const [autoCheck, setAutoCheck] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [solved, setSolved] = useState(() => isSolved(puzzle, init.letters));
    const [gameStarted, setGameStarted] = useState(() => init.durationSeconds !== null || isSolved(puzzle, init.letters));
    const [isPaused, setIsPaused] = useState(false);
    const [pausedMs, setPausedMs] = useState(0);

    const { isAdmin } = useAdminSession();

    useEffect(() => {
        if (!gameStarted || durationSeconds !== null || isPaused) return;
        const id = window.setInterval(() => {
            setElapsed(Math.round((Date.now() - startTimestamp.current - pausedMs) / 1000));
        }, 1000);
        return () => window.clearInterval(id);
    }, [gameStarted, durationSeconds, isPaused, pausedMs]);

    const displayTime = durationSeconds !== null ? durationSeconds : elapsed;

    useEffect(() => {
        window.localStorage.setItem(
            storageKey,
            JSON.stringify({ letters, activeEntryId, revealedEntryIds, durationSeconds, scoreSubmitted })
        );
    }, [letters, activeEntryId, revealedEntryIds, durationSeconds, scoreSubmitted, storageKey]);

    useEffect(() => {
        clueRefs.current[activeEntryId]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [activeEntryId]);

    const activeEntry = entryMap.get(activeEntryId) ?? null;
    const activeWordKeys = new Set(activeEntry?.cells ?? []);

    const incorrectKeys = useMemo(
        () =>
            autoCheck
                ? new Set(
                    puzzle.cells
                        .filter((cell) => cell.answer && letters[cell.key] && letters[cell.key] !== cell.answer)
                        .map((cell) => cell.key)
                )
                : new Set<string>(),
        [puzzle.cells, letters, autoCheck]
    );

    function handleStartGame() {
        startTimestamp.current = Date.now();
        setGameStarted(true);
    }

    function handlePause() {
        if (isPaused) {
            const now = Date.now();
            if (pausedSinceRef.current !== null) {
                const pausedSince = pausedSinceRef.current;
                setPausedMs((prev) => prev + (now - pausedSince));
                pausedSinceRef.current = null;
            }
            setIsPaused(false);
        } else {
            pausedSinceRef.current = Date.now();
            setIsPaused(true);
        }
    }

    function completePuzzle(finalLetters: Record<string, string>) {
        const finalDuration = Math.round((Date.now() - startTimestamp.current - pausedMs) / 1000);
        setDurationSeconds(finalDuration);
        setElapsed(finalDuration);
        setSolved(true);
        setLetters(finalLetters);
    }

    const score = computeCrosswordScore(displayTime, 0, revealedEntryIds.length);
    const metadata: CrosswordMetadata = {
        duration_seconds: displayTime,
        checks_used: 0,
        reveals_used: revealedEntryIds.length,
        completed_at: new Date().toISOString(),
    };

    function entryForCell(key: string, prefer?: CrosswordDirection): CrosswordNumberedEntry | null {
        const ids = entryIdsByCell.get(key) ?? [];
        if (ids.length === 0) return null;
        if (prefer) {
            const match = ids.find((id) => entryMap.get(id)?.direction === prefer);
            if (match) return entryMap.get(match) ?? null;
        }
        return entryMap.get(ids[0]) ?? null;
    }

    function focusCell(key: string) {
        window.requestAnimationFrame(() => inputRefs.current[key]?.focus());
    }

    function focusAndSelectCell(key: string) {
        window.requestAnimationFrame(() => {
            const input = inputRefs.current[key];
            if (!input) return;
            input.focus();
            input.setSelectionRange(0, input.value.length);
        });
    }

    function selectEntry(entry: CrosswordNumberedEntry, focusFirst = true) {
        setActiveEntryId(entry.id);
        if (focusFirst) {
            const target = entry.cells.find((key) => !letters[key]) ?? entry.cells[0];
            if (target) focusCell(target);
        }
    }

    function nextEntry(currentId: string, reverse = false): CrosswordNumberedEntry | null {
        const idx = tabOrder.indexOf(currentId);
        if (idx === -1) return null;
        const next = reverse
            ? tabOrder[(idx - 1 + tabOrder.length) % tabOrder.length]
            : tabOrder[(idx + 1) % tabOrder.length];
        return entryMap.get(next) ?? null;
    }

    function nextEmptyCellInEntry(entry: CrosswordNumberedEntry, startIndex: number, nextLetters: Record<string, string>) {
        for (let i = startIndex + 1; i < entry.cells.length; i += 1) {
            const key = entry.cells[i];
            if (!nextLetters[key]) return key;
        }
        return null;
    }

    function writeLetter(cell: CrosswordCell, rawLetter: string) {
        if (durationSeconds !== null) return;

        const letter = rawLetter.replace(/[^a-zA-Z]/g, "").slice(-1).toUpperCase();
        const entry = activeEntry && activeEntry.cells.includes(cell.key)
            ? activeEntry
            : entryForCell(cell.key, activeEntry?.direction);

        const next = { ...letters, [cell.key]: letter };

        if (isSolved(puzzle, next)) {
            completePuzzle(next);
            return;
        }

        setLetters(next);

        if (!letter || !entry) return;

        const idx = entry.cells.indexOf(cell.key);
        const nextKey = nextEmptyCellInEntry(entry, idx, next);
        if (nextKey) {
            focusAndSelectCell(nextKey);
            return;
        }

        const nextEntryItem = nextEntry(entry.id);
        if (nextEntryItem) {
            const target = nextEntryItem.cells.find((key) => !next[key]) ?? nextEntryItem.cells[0];
            setActiveEntryId(nextEntryItem.id);
            if (target) focusAndSelectCell(target);
        }
    }

    function handleCellFocus(cell: CrosswordCell) {
        const entry = entryForCell(cell.key, activeEntry?.direction);
        if (entry) setActiveEntryId(entry.id);
        setFocusedKey(cell.key);
        window.requestAnimationFrame(() => {
            const input = inputRefs.current[cell.key];
            if (!input) return;
            input.setSelectionRange(0, input.value.length);
        });
    }

    function handleCellClick(cell: CrosswordCell) {
        if (!cell.answer) return;
        const ids = entryIdsByCell.get(cell.key) ?? [];
        if (ids.length === 2 && focusedKey === cell.key) {
            const other = ids.find((id) => id !== activeEntryId);
            if (other) setActiveEntryId(other);
            return;
        }
        const entry = entryForCell(cell.key, activeEntry?.direction);
        if (entry) setActiveEntryId(entry.id);
    }

    function handleType(cell: CrosswordCell, raw: string) {
        if (!raw) {
            setLetters((prev) => ({ ...prev, [cell.key]: "" }));
            return;
        }

        writeLetter(cell, raw);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, cell: CrosswordCell) {
        if (!cell.answer) return;

        if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
            e.preventDefault();
            writeLetter(cell, e.key);
            return;
        }

        if (e.key === "Tab") {
            e.preventDefault();
            const nextEntryItem = nextEntry(activeEntryId, e.shiftKey);
            if (nextEntryItem) selectEntry(nextEntryItem);
            return;
        }

        if (e.key === "Backspace") {
            e.preventDefault();
            if (letters[cell.key]) {
                setLetters((prev) => ({ ...prev, [cell.key]: "" }));
                return;
            }
            if (activeEntry) {
                const idx = activeEntry.cells.indexOf(cell.key);
                const prev = activeEntry.cells[idx - 1];
                if (prev) {
                    focusAndSelectCell(prev);
                    setLetters((currentLetters) => ({ ...currentLetters, [prev]: "" }));
                }
            }
            return;
        }

        if (e.key === "ArrowRight") {
            e.preventDefault();
            const target = cellMap.get(cellKey(cell.row, cell.col + 1));
            if (target?.answer) {
                const entry = entryForCell(target.key, "across");
                if (entry) setActiveEntryId(entry.id);
                focusCell(target.key);
            }
            return;
        }

        if (e.key === "ArrowLeft") {
            e.preventDefault();
            const target = cellMap.get(cellKey(cell.row, cell.col - 1));
            if (target?.answer) {
                const entry = entryForCell(target.key, "across");
                if (entry) setActiveEntryId(entry.id);
                focusCell(target.key);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const target = cellMap.get(cellKey(cell.row + 1, cell.col));
            if (target?.answer) {
                const entry = entryForCell(target.key, "down");
                if (entry) setActiveEntryId(entry.id);
                focusCell(target.key);
            }
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            const target = cellMap.get(cellKey(cell.row - 1, cell.col));
            if (target?.answer) {
                const entry = entryForCell(target.key, "down");
                if (entry) setActiveEntryId(entry.id);
                focusCell(target.key);
            }
            return;
        }
    }

    function handleReveal() {
        if (!activeEntry || durationSeconds !== null) return;
        const next = { ...letters };
        activeEntry.cells.forEach((key, index) => {
            next[key] = activeEntry.answer[index] ?? "";
        });
        setRevealedEntryIds((current) => (current.includes(activeEntry.id) ? current : [...current, activeEntry.id]));
        if (isSolved(puzzle, next)) {
            completePuzzle(next);
        } else {
            setLetters(next);
        }
    }

    function handleReset() {
        if (!window.confirm("Reset the puzzle and clear your progress?")) return;
        setLetters(emptyLetters(puzzle));
        setActiveEntryId(puzzle.entries[0]?.id ?? "");
        setRevealedEntryIds([]);
        setDurationSeconds(null);
        setElapsed(0);
        setScoreSubmitted(false);
        setSolved(false);
        setFocusedKey(null);
        setGameStarted(false);
        setIsPaused(false);
        setPausedMs(0);
        startTimestamp.current = 0;
        pausedSinceRef.current = null;
        window.localStorage.removeItem(storageKey);
    }

    return (
        <div className="overflow-hidden rounded-[2.2rem] border border-primary/12 bg-white shadow-[0_24px_80px_rgba(20,42,68,0.10)]">
            <div className="border-b border-primary/8 bg-[#fbf8f3] px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Daily Puzzle</p>
                        <h2 className="font-heading text-2xl text-primary">Crossing Paths</h2>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="font-mono text-3xl font-semibold tabular-nums text-primary">{fmtTime(displayTime)}</span>
                        {solved && <span className="text-[10px] uppercase tracking-widest text-accent">solved!</span>}
                    </div>

                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                        {gameStarted && !solved && (
                            <button
                                type="button"
                                onClick={handlePause}
                                className="rounded-full border border-primary/20 px-3 py-1.5 text-[10px] uppercase tracking-widest text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
                            >
                                {isPaused ? "Resume" : "Pause"}
                            </button>
                        )}
                        <button
                            onClick={() => setAutoCheck((value) => !value)}
                            className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
                                autoCheck
                                    ? "border-primary bg-primary text-white"
                                    : "border-primary/20 text-text-secondary hover:border-primary/40 hover:text-primary"
                            }`}
                        >
                            Autocheck
                        </button>
                        {isAdmin && (
                            <button
                                onClick={handleReveal}
                                disabled={!activeEntry || solved}
                                className="rounded-full border border-amber-400/40 bg-amber-50 px-3 py-1.5 text-[10px] uppercase tracking-widest text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Reveal
                            </button>
                        )}
                        <button
                            onClick={handleReset}
                            className="rounded-full border border-primary/15 px-3 py-1.5 text-[10px] uppercase tracking-widest text-text-secondary transition-colors hover:border-primary/30 hover:text-primary"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative">
                <div
                    className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-[rgba(23,55,86,0.52)] px-8 text-center backdrop-blur-sm transition-opacity duration-300 ${
                        !gameStarted ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                >
                    <p className="text-xs uppercase tracking-[0.35em] text-white/55">Ready to play?</p>
                    <p className="max-w-xs text-sm leading-relaxed text-white/70">
                        Ten clues built around Ashlyn &amp; Jeffrey. The timer starts when you do.
                    </p>
                    <button
                        type="button"
                        onClick={handleStartGame}
                        className="rounded-full bg-accent px-10 py-3.5 text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                        Start
                    </button>
                </div>

                <div
                    className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[rgba(23,55,86,0.52)] backdrop-blur-sm transition-opacity duration-300 ${
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

                <div className="flex min-h-[44px] items-center border-b border-primary/8 bg-white px-5 py-3">
                    {activeEntry ? (
                        <p className="text-sm leading-snug text-primary">
                            <span className="mr-1.5 font-semibold">
                                {activeEntry.number}
                                {activeEntry.direction === "across" ? "A" : "D"}
                            </span>
                            {activeEntry.clue}
                            {revealedEntryIds.includes(activeEntry.id) && (
                                <span className="ml-2 text-[10px] uppercase tracking-widest text-secondary opacity-70">· revealed</span>
                            )}
                        </p>
                    ) : (
                        <p className="text-sm text-text-secondary">Tap a square or clue to begin</p>
                    )}
                </div>

                <div className="flex flex-col md:flex-row">
                    <div className="flex items-center justify-center bg-[#fbf8f3] p-5 md:p-8">
                        <div
                            className="rounded-sm bg-gray-400"
                            style={{
                                display: "grid",
                                gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
                                gap: "1px",
                                padding: "1px",
                            }}
                        >
                            {puzzle.cells.map((cell) => {
                                if (!cell.answer) {
                                    return <div key={cell.key} className="bg-primary" style={{ width: 56, height: 56 }} />;
                                }

                                const isFocused = focusedKey === cell.key;
                                const inWord = activeWordKeys.has(cell.key);
                                const wrong = incorrectKeys.has(cell.key);

                                return (
                                    <label
                                        key={cell.key}
                                        className={`relative cursor-pointer select-none transition-colors ${
                                            wrong ? "bg-red-100" : isFocused ? "bg-amber-200" : inWord ? "bg-sky-100" : "bg-white"
                                        }`}
                                        style={{ width: 56, height: 56 }}
                                    >
                                        {cell.number ? (
                                            <span className="pointer-events-none absolute left-[3px] top-[2px] text-[10px] font-semibold leading-none text-primary/70">
                                                {cell.number}
                                            </span>
                                        ) : null}
                                        {wrong && (
                                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 56 56">
                                                    <line x1="4" y1="4" x2="52" y2="52" stroke="#991b1b" strokeWidth="2" />
                                                </svg>
                                            </span>
                                        )}
                                        <input
                                            ref={(el) => {
                                                inputRefs.current[cell.key] = el;
                                            }}
                                            value={letters[cell.key] ?? ""}
                                            onChange={(e) => handleType(cell, e.target.value)}
                                            onFocus={() => handleCellFocus(cell)}
                                            onBlur={() => setFocusedKey(null)}
                                            onClick={() => handleCellClick(cell)}
                                            onKeyDown={(e) => handleKeyDown(e, cell)}
                                            onMouseUp={(e) => e.preventDefault()}
                                            maxLength={1}
                                            inputMode="text"
                                            autoComplete="off"
                                            autoCorrect="off"
                                            autoCapitalize="characters"
                                            spellCheck={false}
                                            data-form-type="other"
                                            aria-label={`Cell ${cell.row + 1}-${cell.col + 1}`}
                                            disabled={solved}
                                            className={`h-full w-full cursor-default bg-transparent pb-0 pt-3 text-center text-[22px] font-bold uppercase outline-none [caret-color:transparent] selection:bg-transparent ${
                                                wrong ? "text-red-700" : "text-primary"
                                            }`}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col border-t border-primary/8 md:border-l md:border-t-0">
                        <div className="grid flex-1 grid-cols-2 divide-x divide-primary/8">
                            <div className="p-4">
                                <p className="mb-2.5 text-[10px] uppercase tracking-[0.28em] text-text-secondary">Across</p>
                                <div className="space-y-0.5">
                                    {puzzle.across.map((entry) => {
                                        const isActive = activeEntryId === entry.id;
                                        const isRevealed = revealedEntryIds.includes(entry.id);
                                        return (
                                            <button
                                                key={entry.id}
                                                ref={(el) => {
                                                    clueRefs.current[entry.id] = el;
                                                }}
                                                onClick={() => selectEntry(entry)}
                                                className={`w-full rounded-lg px-2.5 py-2.5 text-left text-[13px] leading-snug transition-colors ${
                                                    isActive ? "bg-primary text-white" : "text-primary hover:bg-primary/5"
                                                }`}
                                            >
                                                <span className={`mr-1.5 text-[10px] font-bold ${isActive ? "opacity-60" : "text-text-secondary"}`}>
                                                    {entry.number}
                                                </span>
                                                {entry.clue}
                                                {isRevealed && !isActive && (
                                                    <span className="ml-1 text-[9px] uppercase tracking-widest opacity-40">✓</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-4">
                                <p className="mb-2.5 text-[10px] uppercase tracking-[0.28em] text-text-secondary">Down</p>
                                <div className="space-y-0.5">
                                    {puzzle.down.map((entry) => {
                                        const isActive = activeEntryId === entry.id;
                                        const isRevealed = revealedEntryIds.includes(entry.id);
                                        return (
                                            <button
                                                key={entry.id}
                                                ref={(el) => {
                                                    clueRefs.current[entry.id] = el;
                                                }}
                                                onClick={() => selectEntry(entry)}
                                                className={`w-full rounded-lg px-2.5 py-2.5 text-left text-[13px] leading-snug transition-colors ${
                                                    isActive ? "bg-primary text-white" : "text-primary hover:bg-primary/5"
                                                }`}
                                            >
                                                <span className={`mr-1.5 text-[10px] font-bold ${isActive ? "opacity-60" : "text-text-secondary"}`}>
                                                    {entry.number}
                                                </span>
                                                {entry.clue}
                                                {isRevealed && !isActive && (
                                                    <span className="ml-1 text-[9px] uppercase tracking-widest opacity-40">✓</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {solved && (
                <div className="border-t border-primary/8">
                    <div className="bg-[linear-gradient(160deg,#173756_0%,#214467_100%)] px-6 py-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M16 3l2.5 8h8.5l-7 5 2.5 8L16 19l-6.5 5 2.5-8-7-5h8.5z" fill="#c9a96e" />
                            </svg>
                        </div>
                        <h3 className="font-heading text-3xl text-white">Congratulations!</h3>
                        <p className="mt-2 text-base text-white/70">You solved Crossing Paths</p>
                        <p className="mt-4 font-mono text-5xl font-bold tabular-nums text-accent">{fmtTime(displayTime)}</p>
                        {revealedEntryIds.length > 0 ? (
                            <p className="mt-2 text-sm text-white/50">
                                {revealedEntryIds.length} reveal{revealedEntryIds.length > 1 ? "s" : ""} used
                            </p>
                        ) : (
                            <p className="mt-2 text-sm text-white/50">Clean solve ✨</p>
                        )}
                        <p className="mt-1 text-sm font-semibold text-accent">{score} pts</p>
                    </div>

                    <div className="bg-white px-6 py-6">
                        {scoreSubmitted ? (
                            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
                                <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Score Locked In</p>
                                <p className="mt-2 text-sm text-text-secondary">
                                    You&apos;re on the leaderboard — check back to see how others do!
                                </p>
                            </div>
                        ) : (
                            <ScoreSubmissionForm
                                game="crossword"
                                score={score}
                                maxScore={100}
                                attempts={revealedEntryIds.length}
                                solved={true}
                                puzzleKey={puzzle.id}
                                metadata={metadata}
                                buttonLabel="Submit Score to Leaderboard"
                                successMessage="Crossword score submitted."
                                onSubmitted={() => setScoreSubmitted(true)}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
