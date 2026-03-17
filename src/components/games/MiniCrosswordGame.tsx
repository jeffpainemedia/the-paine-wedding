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

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TODAY_KEY = getTodayKey();
const PUZZLE = getDailyCrosswordPuzzle(TODAY_KEY);
const STORAGE_KEY = getCrosswordStorageKey(PUZZLE.id, TODAY_KEY);

// The puzzle grid is 5×7 but cols 0 and 6 are always black (structural border
// columns). We render only the 5 inner columns (cols 1–5) for a clean grid.
const GRID_COL_MIN = 1;
const GRID_COL_MAX = 5;
const GRID_COLS = GRID_COL_MAX - GRID_COL_MIN + 1; // 5
const GRID_CELLS = PUZZLE.cells.filter(
    (c) => c.col >= GRID_COL_MIN && c.col <= GRID_COL_MAX
);

// Build fast lookup maps once
const ENTRY_MAP = new Map<string, CrosswordNumberedEntry>(
    PUZZLE.entries.map((entry) => [entry.id, entry])
);
const ENTRY_IDS_BY_CELL = new Map<string, string[]>(
    PUZZLE.cells.filter((c) => c.answer).map((c) => [c.key, c.entryIds])
);
const CELL_MAP = new Map<string, CrosswordCell>(PUZZLE.cells.map((c) => [c.key, c]));

function cellKey(row: number, col: number) { return `${row}:${col}`; }

// All entries in tab order (across by number, then down by number)
const TAB_ORDER: string[] = [
    ...PUZZLE.across.map((e) => e.id),
    ...PUZZLE.down.map((e) => e.id),
];

// ── State shape ───────────────────────────────────────────────────────────────
// Timer is NOT restored from storage — it resets every page load.
// When the puzzle is completed, we store `durationSeconds` so the final time
// is shown consistently on return visits.

type SavedState = {
    letters: Record<string, string>;
    activeEntryId: string;
    revealedEntryIds: string[];
    durationSeconds: number | null; // null = not yet completed
    scoreSubmitted: boolean;
};

function emptyLetters(): Record<string, string> {
    return Object.fromEntries(
        PUZZLE.cells.filter((c) => c.answer).map((c) => [c.key, ""])
    );
}

function defaultState(): SavedState {
    return {
        letters: emptyLetters(),
        activeEntryId: PUZZLE.entries[0]?.id ?? "",
        revealedEntryIds: [],
        durationSeconds: null,
        scoreSubmitted: false,
    };
}

function loadState(): SavedState {
    if (typeof window === "undefined") return defaultState();
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultState();
        const p = JSON.parse(raw) as Partial<SavedState & { startedAt?: string; completedAt?: string }>;
        return {
            letters: p.letters ? { ...emptyLetters(), ...p.letters } : emptyLetters(),
            activeEntryId: p.activeEntryId && ENTRY_MAP.has(p.activeEntryId)
                ? p.activeEntryId
                : (PUZZLE.entries[0]?.id ?? ""),
            revealedEntryIds: Array.isArray(p.revealedEntryIds)
                ? p.revealedEntryIds.filter((id) => ENTRY_MAP.has(id))
                : [],
            // Support old format that stored startedAt/completedAt
            durationSeconds: typeof p.durationSeconds === "number"
                ? p.durationSeconds
                : (p.startedAt && p.completedAt
                    ? Math.round((new Date(p.completedAt).getTime() - new Date(p.startedAt).getTime()) / 1000)
                    : null),
            scoreSubmitted: typeof p.scoreSubmitted === "boolean" ? p.scoreSubmitted : false,
        };
    } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        return defaultState();
    }
}

function isSolved(letters: Record<string, string>) {
    return PUZZLE.cells.every((c) => !c.answer || letters[c.key] === c.answer);
}

function fmtTime(secs: number) {
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MiniCrosswordGame() {
    const [init] = useState(loadState);
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const clueRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    // Timer: starts only when player clicks Start, not on page load.
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
    const [solved, setSolved] = useState(() => isSolved(init.letters));
    const [gameStarted, setGameStarted] = useState(() => init.durationSeconds !== null || isSolved(init.letters));
    const [isPaused, setIsPaused] = useState(false);
    const [pausedMs, setPausedMs] = useState(0);

    const { isAdmin } = useAdminSession();

    // Timer: count up from 0 only after Start is clicked. Stops when completed or paused.
    useEffect(() => {
        if (!gameStarted || durationSeconds !== null || isPaused) return;
        const id = window.setInterval(() => {
            setElapsed(Math.round((Date.now() - startTimestamp.current - pausedMs) / 1000));
        }, 1000);
        return () => window.clearInterval(id);
    }, [gameStarted, durationSeconds, isPaused, pausedMs]);

    // Display time: final stored time if completed, live elapsed if playing
    const displayTime = durationSeconds !== null ? durationSeconds : elapsed;

    // Persist
    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
            letters, activeEntryId, revealedEntryIds, durationSeconds, scoreSubmitted,
        }));
    }, [letters, activeEntryId, revealedEntryIds, durationSeconds, scoreSubmitted]);

    // Scroll active clue into view
    useEffect(() => {
        clueRefs.current[activeEntryId]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [activeEntryId]);

    const activeEntry = ENTRY_MAP.get(activeEntryId) ?? null;
    const activeWordKeys = new Set(activeEntry?.cells ?? []);

    const incorrectKeys = useMemo(() =>
        autoCheck
            ? new Set(PUZZLE.cells
                .filter((c) => c.answer && letters[c.key] && letters[c.key] !== c.answer)
                .map((c) => c.key))
            : new Set<string>(),
        [letters, autoCheck]
    );

    function handleStartGame() {
        startTimestamp.current = Date.now();
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

    // ── Entry helpers ────────────────────────────────────────────────────────

    function entryForCell(key: string, prefer?: CrosswordDirection): CrosswordNumberedEntry | null {
        const ids = ENTRY_IDS_BY_CELL.get(key) ?? [];
        if (ids.length === 0) return null;
        if (prefer) {
            const match = ids.find((id) => ENTRY_MAP.get(id)?.direction === prefer);
            if (match) return ENTRY_MAP.get(match) ?? null;
        }
        return ENTRY_MAP.get(ids[0]) ?? null;
    }

    function focusCell(key: string) {
        window.requestAnimationFrame(() => inputRefs.current[key]?.focus());
    }

    function selectEntry(entry: CrosswordNumberedEntry, focusFirst = true) {
        setActiveEntryId(entry.id);
        if (focusFirst) {
            const target = entry.cells.find((k) => !letters[k]) ?? entry.cells[0];
            if (target) focusCell(target);
        }
    }

    function nextEntry(currentId: string, reverse = false): CrosswordNumberedEntry | null {
        const idx = TAB_ORDER.indexOf(currentId);
        if (idx === -1) return null;
        const next = reverse
            ? TAB_ORDER[(idx - 1 + TAB_ORDER.length) % TAB_ORDER.length]
            : TAB_ORDER[(idx + 1) % TAB_ORDER.length];
        return ENTRY_MAP.get(next) ?? null;
    }

    // ── Input handlers ───────────────────────────────────────────────────────

    function handleCellFocus(cell: CrosswordCell) {
        const entry = entryForCell(cell.key, activeEntry?.direction);
        if (entry) setActiveEntryId(entry.id);
        setFocusedKey(cell.key);
    }

    function handleCellClick(cell: CrosswordCell) {
        if (!cell.answer) return;
        const ids = ENTRY_IDS_BY_CELL.get(cell.key) ?? [];
        if (ids.length === 2 && focusedKey === cell.key) {
            const other = ids.find((id) => id !== activeEntryId);
            if (other) setActiveEntryId(other);
            return;
        }
        const entry = entryForCell(cell.key, activeEntry?.direction);
        if (entry) setActiveEntryId(entry.id);
    }

    function handleType(cell: CrosswordCell, raw: string) {
        if (durationSeconds !== null) return; // already solved
        const letter = raw.replace(/[^a-zA-Z]/g, "").slice(-1).toUpperCase();
        const next = { ...letters, [cell.key]: letter };

        if (isSolved(next)) {
            completePuzzle(next);
            return;
        }

        setLetters(next);

        // Auto-advance within word
        if (letter && activeEntry) {
            const idx = activeEntry.cells.indexOf(cell.key);
            const nextKey = activeEntry.cells[idx + 1];
            if (nextKey) {
                focusCell(nextKey);
            } else {
                const ne = nextEntry(activeEntryId);
                if (ne) {
                    const target = ne.cells.find((k) => !next[k]) ?? ne.cells[0];
                    setActiveEntryId(ne.id);
                    if (target) focusCell(target);
                }
            }
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, cell: CrosswordCell) {
        if (!cell.answer) return;

        if (e.key === "Tab") {
            e.preventDefault();
            const ne = nextEntry(activeEntryId, e.shiftKey);
            if (ne) selectEntry(ne);
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
                    focusCell(prev);
                    setLetters((l) => ({ ...l, [prev]: "" }));
                }
            }
            return;
        }

        if (e.key === "ArrowRight") {
            e.preventDefault();
            const target = CELL_MAP.get(cellKey(cell.row, cell.col + 1));
            if (target?.answer) {
                const entry = entryForCell(target.key, "across");
                if (entry) setActiveEntryId(entry.id);
                focusCell(target.key);
            }
            return;
        }

        if (e.key === "ArrowLeft") {
            e.preventDefault();
            const target = CELL_MAP.get(cellKey(cell.row, cell.col - 1));
            if (target?.answer) {
                const entry = entryForCell(target.key, "across");
                if (entry) setActiveEntryId(entry.id);
                focusCell(target.key);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const target = CELL_MAP.get(cellKey(cell.row + 1, cell.col));
            if (target?.answer) {
                const entry = entryForCell(target.key, "down");
                if (entry) setActiveEntryId(entry.id);
                focusCell(target.key);
            }
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            const target = CELL_MAP.get(cellKey(cell.row - 1, cell.col));
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
        activeEntry.cells.forEach((k, i) => { next[k] = activeEntry.answer[i] ?? ""; });
        setRevealedEntryIds((r) => r.includes(activeEntry.id) ? r : [...r, activeEntry.id]);
        if (isSolved(next)) {
            completePuzzle(next);
        } else {
            setLetters(next);
        }
    }

    function handleReset() {
        if (!window.confirm("Reset the puzzle and clear your progress?")) return;
        setLetters(emptyLetters());
        setActiveEntryId(PUZZLE.entries[0]?.id ?? "");
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
        window.localStorage.removeItem(STORAGE_KEY);
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="overflow-hidden rounded-[2.2rem] border border-primary/12 bg-white shadow-[0_24px_80px_rgba(20,42,68,0.10)]">

            {/* ── Header bar ── */}
            <div className="border-b border-primary/8 bg-[#fbf8f3] px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                    {/* Title */}
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Daily Puzzle</p>
                        <h2 className="font-heading text-2xl text-primary">Mini Crossword</h2>
                    </div>

                    {/* Timer — center */}
                    <div className="flex flex-col items-center">
                        <span className="font-mono text-3xl font-semibold tabular-nums text-primary">
                            {fmtTime(displayTime)}
                        </span>
                        {solved && (
                            <span className="text-[10px] uppercase tracking-widest text-accent">solved!</span>
                        )}
                    </div>

                    {/* Controls */}
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
                            onClick={() => setAutoCheck((v) => !v)}
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

            {/* ── Clue bar + Grid + Clues wrapper (overlays live here) ── */}
            <div className="relative">

                {/* Start overlay — fades in, covers clue bar + grid + clues; header stays visible */}
                <div
                    className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-[rgba(23,55,86,0.52)] px-8 text-center backdrop-blur-sm transition-opacity duration-300 ${
                        !gameStarted ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                >
                    <p className="text-xs uppercase tracking-[0.35em] text-white/55">Ready to play?</p>
                    <p className="max-w-xs text-sm leading-relaxed text-white/70">
                        Six clues built around Ashlyn &amp; Jeffrey. The timer starts when you do.
                    </p>
                    <button
                        type="button"
                        onClick={handleStartGame}
                        className="rounded-full bg-accent px-10 py-3.5 text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                        Start
                    </button>
                </div>

                {/* Pause overlay — same style, covers same area */}
                <div
                    className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[rgba(23,55,86,0.52)] backdrop-blur-sm transition-opacity duration-300 ${
                        isPaused ? "opacity-100" : "opacity-0 pointer-events-none"
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

                {/* ── Active clue bar ── */}
                <div className="flex min-h-[44px] items-center border-b border-primary/8 bg-white px-5 py-3">
                    {activeEntry ? (
                        <p className="text-sm leading-snug text-primary">
                            <span className="mr-1.5 font-semibold">
                                {activeEntry.number}{activeEntry.direction === "across" ? "A" : "D"}
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

                {/* ── Grid + Clues ── */}
                <div className="flex flex-col md:flex-row">

                {/* Grid */}
                <div className="flex items-center justify-center bg-[#fbf8f3] p-5 md:p-8">
                    {/*
                        The puzzle is 5×7 but cols 0 and 6 are always black structural
                        borders — we skip them so the rendered grid is a clean 5×5.
                        Grid lines: 1px gap on a dark bg wrapper.
                    */}
                    <div
                        className="rounded-sm bg-gray-400"
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                            gap: "1px",
                            padding: "1px",
                        }}
                    >
                        {GRID_CELLS.map((cell) => {
                            if (!cell.answer) {
                                return (
                                    <div
                                        key={cell.key}
                                        className="bg-primary"
                                        style={{ width: 56, height: 56 }}
                                    />
                                );
                            }

                            const isFocused = focusedKey === cell.key;
                            const inWord = activeWordKeys.has(cell.key);
                            const wrong = incorrectKeys.has(cell.key);

                            return (
                                <label
                                    key={cell.key}
                                    className={`relative cursor-pointer select-none transition-colors ${
                                        wrong
                                            ? "bg-red-100"
                                            : isFocused
                                                ? "bg-amber-200"
                                                : inWord
                                                    ? "bg-sky-100"
                                                    : "bg-white"
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
                                        ref={(el) => { inputRefs.current[cell.key] = el; }}
                                        value={letters[cell.key] ?? ""}
                                        onChange={(e) => handleType(cell, e.target.value)}
                                        onFocus={() => handleCellFocus(cell)}
                                        onBlur={() => setFocusedKey(null)}
                                        onClick={() => handleCellClick(cell)}
                                        onKeyDown={(e) => handleKeyDown(e, cell)}
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

                {/* Clue lists */}
                <div className="flex flex-1 flex-col border-t border-primary/8 md:border-l md:border-t-0">
                    <div className="grid flex-1 grid-cols-2 divide-x divide-primary/8">
                        {/* Across */}
                        <div className="p-4">
                            <p className="mb-2.5 text-[10px] uppercase tracking-[0.28em] text-text-secondary">Across</p>
                            <div className="space-y-0.5">
                                {PUZZLE.across.map((entry) => {
                                    const isActive = activeEntryId === entry.id;
                                    const isRevealed = revealedEntryIds.includes(entry.id);
                                    return (
                                        <button
                                            key={entry.id}
                                            ref={(el) => { clueRefs.current[entry.id] = el; }}
                                            onClick={() => selectEntry(entry)}
                                            className={`w-full rounded-lg px-2.5 py-2.5 text-left text-[13px] leading-snug transition-colors ${
                                                isActive
                                                    ? "bg-primary text-white"
                                                    : "text-primary hover:bg-primary/5"
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

                        {/* Down */}
                        <div className="p-4">
                            <p className="mb-2.5 text-[10px] uppercase tracking-[0.28em] text-text-secondary">Down</p>
                            <div className="space-y-0.5">
                                {PUZZLE.down.map((entry) => {
                                    const isActive = activeEntryId === entry.id;
                                    const isRevealed = revealedEntryIds.includes(entry.id);
                                    return (
                                        <button
                                            key={entry.id}
                                            ref={(el) => { clueRefs.current[entry.id] = el; }}
                                            onClick={() => selectEntry(entry)}
                                            className={`w-full rounded-lg px-2.5 py-2.5 text-left text-[13px] leading-snug transition-colors ${
                                                isActive
                                                    ? "bg-primary text-white"
                                                    : "text-primary hover:bg-primary/5"
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

            </div>{/* end clue bar + grid + clues wrapper */}

            {/* ── Completion screen ── */}
            {solved && (
                <div className="border-t border-primary/8">
                    <div className="bg-[linear-gradient(160deg,#173756_0%,#214467_100%)] px-6 py-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M16 3l2.5 8h8.5l-7 5 2.5 8L16 19l-6.5 5 2.5-8-7-5h8.5z" fill="#c9a96e" />
                            </svg>
                        </div>
                        <h3 className="font-heading text-3xl text-white">Congratulations!</h3>
                        <p className="mt-2 text-base text-white/70">
                            You solved the Mini Crossword
                        </p>
                        <p className="mt-4 font-mono text-5xl font-bold tabular-nums text-accent">
                            {fmtTime(displayTime)}
                        </p>
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
                                puzzleKey={PUZZLE.id}
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
