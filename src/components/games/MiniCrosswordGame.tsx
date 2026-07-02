"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ScoreSubmissionForm from "@/components/games/ScoreSubmissionForm";
import { useAdminSession } from "@/hooks/useAdminSession";
import { GAME_LEADERBOARD_REFRESH_EVENT, fetchPlayerGameScore, fetchPlayerRank, getStoredGamePlayer, saveStoredGamePlayer, submitCrosswordScore } from "@/lib/games/leaderboard";
import {
    computeCrosswordScore,
    getCentralDateKey,
    getCrosswordStorageKey,
    type CrosswordDirection,
    type CrosswordMetadata,
    type PublicBuiltCrossword,
    type PublicCrosswordCell,
    type PublicCrosswordEntry,
} from "@/lib/games/crossword-types";

// Server validates the entire grid. Returns wrong-cell list + completion flag.
async function checkGridServer(
    puzzleId: string,
    letters: Record<string, string>
): Promise<{ wrongCells: string[]; allCorrect: boolean }> {
    const res = await fetch("/api/games/crossword/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId, letters }),
    });
    if (!res.ok) throw new Error("check failed");
    return res.json();
}

// Server reveals the letters of one entry — used by the Reveal action.
async function revealEntryServer(
    puzzleId: string,
    entryId: string
): Promise<Record<string, string>> {
    const res = await fetch("/api/games/crossword/reveal-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId, entryId }),
    });
    if (!res.ok) throw new Error("reveal failed");
    const data = await res.json() as { letters: Record<string, string> };
    return data.letters;
}

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
    // Elapsed-ms snapshot at save time, plus whether the game was paused when
    // saved. Optional/backward-compatible: older saved states without these
    // fields fall back to the previous (wall-clock-derived) behavior.
    elapsedMsAtSave?: number;
    pausedAtSave?: boolean;
};

function emptyLetters(puzzle: PublicBuiltCrossword): Record<string, string> {
    return Object.fromEntries(puzzle.cells.filter((c) => c.isFillable).map((c) => [c.key, ""]));
}

function defaultState(puzzle: PublicBuiltCrossword): SavedState {
    return {
        letters: emptyLetters(puzzle),
        activeEntryId: puzzle.entries[0]?.id ?? "",
        revealedEntryIds: [],
        durationSeconds: null,
        scoreSubmitted: false,
        elapsedMsAtSave: undefined,
        pausedAtSave: undefined,
    };
}

function loadState(puzzle: PublicBuiltCrossword, storageKey: string): SavedState {
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
            elapsedMsAtSave: typeof parsed.elapsedMsAtSave === "number" ? parsed.elapsedMsAtSave : undefined,
            pausedAtSave: typeof parsed.pausedAtSave === "boolean" ? parsed.pausedAtSave : undefined,
        };
    } catch {
        window.localStorage.removeItem(storageKey);
        return defaultState(puzzle);
    }
}

// Client-side fast check: are all fillable cells filled in? Doesn't validate
// correctness — that's a server call. Used to gate when we ask the server.
function allCellsFilled(puzzle: PublicBuiltCrossword, letters: Record<string, string>) {
    return puzzle.cells.every((cell) => !cell.isFillable || (letters[cell.key] ?? "").length > 0);
}

function fmtTime(secs: number) {
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}


type MiniCrosswordGameProps = {
    puzzle: PublicBuiltCrossword;
    dateKey?: string;
};

export default function MiniCrosswordGame({ puzzle, dateKey = getTodayKey() }: MiniCrosswordGameProps) {
    const storageKey = useMemo(() => getCrosswordStorageKey(puzzle.id, dateKey), [puzzle.id, dateKey]);
    const entryMap = useMemo(() => new Map<string, PublicCrosswordEntry>(puzzle.entries.map((entry) => [entry.id, entry])), [puzzle.entries]);
    const entryIdsByCell = useMemo(
        () => new Map<string, string[]>(puzzle.cells.filter((cell) => cell.isFillable).map((cell) => [cell.key, cell.entryIds])),
        [puzzle.cells]
    );
    const cellMap = useMemo(() => new Map<string, PublicCrosswordCell>(puzzle.cells.map((cell) => [cell.key, cell])), [puzzle.cells]);
    const tabOrder = useMemo(() => [...puzzle.across.map((entry) => entry.id), ...puzzle.down.map((entry) => entry.id)], [puzzle.across, puzzle.down]);
    const [init] = useState(() => loadState(puzzle, storageKey));
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const clueRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const clueBarRef = useRef<HTMLDivElement | null>(null);
    // Seeded from the persisted elapsed-ms snapshot (if any) so that
    // Date.now() - startTimestamp reproduces the truthful elapsed time
    // immediately on load, without counting any reload gap as play time.
    const startTimestamp = useRef<number>(
        typeof init.elapsedMsAtSave === "number" ? Date.now() - init.elapsedMsAtSave : 0
    );
    const pausedSinceRef = useRef<number | null>(null);
    const repeatClickCellKeyRef = useRef<string | null>(null);
    const mobileViewportAdjustRef = useRef<number | null>(null);
    const programmaticFocusRef = useRef(false);

    const [letters, setLetters] = useState(init.letters);
    const [activeEntryId, setActiveEntryId] = useState(init.activeEntryId);
    const [revealedEntryIds, setRevealedEntryIds] = useState(init.revealedEntryIds);
    const [durationSeconds, setDurationSeconds] = useState<number | null>(init.durationSeconds);
    const [scoreSubmitted, setScoreSubmitted] = useState(init.scoreSubmitted);
    const [focusedKey, setFocusedKey] = useState<string | null>(null);
    const [autoCheck, setAutoCheck] = useState(false);
    // Server-supplied "wrong cell" set. Refreshed via /api/games/crossword/check.
    const [incorrectKeys, setIncorrectKeys] = useState<Set<string>>(new Set());
    // Restore elapsed time truthfully across reloads. We persist a frozen
    // elapsed-ms snapshot (+ whether the game was paused) at save time rather
    // than an absolute start timestamp, so a reload can never count the
    // reload-to-resume gap — paused or otherwise — as play time.
    const hasElapsedSnapshot = typeof init.elapsedMsAtSave === "number";
    const [elapsed, setElapsed] = useState(() => (hasElapsedSnapshot ? Math.round(init.elapsedMsAtSave! / 1000) : 0));
    // Solved is set when the server confirms all cells correct. The initial
    // state is whatever localStorage said — we re-verify if it claimed solved.
    const [solved, setSolved] = useState(() => init.durationSeconds !== null);
    const [gameStarted, setGameStarted] = useState(() => init.durationSeconds !== null || hasElapsedSnapshot);
    const [isPaused, setIsPaused] = useState(() => hasElapsedSnapshot && init.pausedAtSave === true);
    const [pausedMs, setPausedMs] = useState(0);
    const [autoSubmitStatus, setAutoSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [playerRank, setPlayerRank] = useState<{ rank: number; total: number } | null>(null);
    const [shareCopied, setShareCopied] = useState(false);
    const [postGameUnlocked, setPostGameUnlocked] = useState(false);
    // True when a returning player's solve was found via server lookup (their
    // localStorage was cleared) — the grid/clues have no letters to show, so
    // the board UI is replaced with a compact note instead of an empty grid.
    const [solvedWithoutLocalBoard, setSolvedWithoutLocalBoard] = useState(false);
    const autoSubmitAttempted = useRef(false);
    const rankFetchAttempted = useRef(false);

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
        // Freeze the current elapsed time as an ms snapshot at every save so a
        // reload can restore truthful elapsed time in both paused and
        // unpaused cases (see startTimestamp/elapsed init above). While
        // paused, `elapsed` state is already frozen (the ticking interval is
        // suspended), so we reuse it directly rather than recomputing from
        // Date.now() — pausedMs itself isn't updated until resume, so
        // recomputing here would leak paused wall-clock time into the
        // snapshot, which is the exact bug this fix addresses.
        const elapsedMsAtSave = gameStarted && durationSeconds === null
            ? (isPaused ? elapsed * 1000 : Date.now() - startTimestamp.current - pausedMs)
            : undefined;
        window.localStorage.setItem(
            storageKey,
            JSON.stringify({
                letters,
                activeEntryId,
                revealedEntryIds,
                durationSeconds,
                scoreSubmitted,
                elapsedMsAtSave,
                pausedAtSave: elapsedMsAtSave !== undefined ? isPaused : undefined,
            })
        );
    }, [letters, activeEntryId, revealedEntryIds, durationSeconds, scoreSubmitted, storageKey, gameStarted, isPaused, pausedMs, elapsed]);

    useEffect(() => {
        if (typeof window === "undefined" || window.matchMedia("(max-width: 767px)").matches) {
            return;
        }

        clueRefs.current[activeEntryId]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [activeEntryId]);

    useEffect(() => {
        return () => {
            if (mobileViewportAdjustRef.current !== null) {
                window.clearTimeout(mobileViewportAdjustRef.current);
            }
        };
    }, []);

    // Auto-submit score on solve if player is stored
    useEffect(() => {
        if (!solved || autoSubmitAttempted.current) return;
        if (isAdmin) return; // Admin play doesn't record scores
        const player = getStoredGamePlayer();
        if (!player) return;

        autoSubmitAttempted.current = true;
        setAutoSubmitStatus("submitting");

        const fullName = player.firstName && player.lastName
            ? `${player.firstName} ${player.lastName}`
            : player.username ?? "";
        // Validated submission: server re-checks every cell of `letters`
        // against the puzzle's answer key and computes the score from the
        // verified completion + reveals.
        submitCrosswordScore({
            puzzleId: puzzle.id,
            letters,
            revealedEntryIds,
            durationSeconds: displayTime,
            player: { email: player.email ?? "", username: fullName },
        })
            .then(() => {
                saveStoredGamePlayer({ ...player, username: fullName });
                setAutoSubmitStatus("success");
                setScoreSubmitted(true);
                window.dispatchEvent(new CustomEvent(GAME_LEADERBOARD_REFRESH_EVENT));
            })
            .catch(() => {
                setAutoSubmitStatus("error");
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [solved]);

    // Fetch the player's rank once per submission success (covers both the
    // auto-submit path and the "already solved on this puzzle" lookup path,
    // since both set scoreSubmitted). Guarded by rankFetchAttempted so it
    // only runs once — not on every render.
    useEffect(() => {
        if (!scoreSubmitted || rankFetchAttempted.current) return;
        const storedPlayer = getStoredGamePlayer();
        if (!storedPlayer) return;

        rankFetchAttempted.current = true;
        void fetchPlayerRank("crossword", puzzle.id, {
            email: storedPlayer.email,
            username: storedPlayer.username,
        }).then(setPlayerRank);
    }, [scoreSubmitted, puzzle.id]);

    useEffect(() => {
        const storedPlayer = getStoredGamePlayer();
        if (!storedPlayer || solved) {
            return;
        }
        const lookupPlayer = {
            email: storedPlayer.email,
            username: storedPlayer.username,
        };

        let isActive = true;

        async function loadExistingScore() {
            try {
                const existingScore = await fetchPlayerGameScore("crossword", puzzle.id, lookupPlayer);
                if (!isActive || !existingScore?.solved) {
                    return;
                }

                autoSubmitAttempted.current = true;
                const existingDuration =
                    typeof existingScore.metadata?.duration_seconds === "number"
                        ? existingScore.metadata.duration_seconds
                        : 0;
                // Mark solved without trying to refill the grid — the answer
                // key is server-only now. Players who cleared their local
                // storage will see the "solved" celebration without the
                // pre-filled grid.
                setActiveEntryId(puzzle.entries[0]?.id ?? "");
                setDurationSeconds(existingDuration);
                setElapsed(existingDuration);
                setSolved(true);
                setScoreSubmitted(true);
                setGameStarted(true);
                setFocusedKey(null);
                setSolvedWithoutLocalBoard(true);
            } catch {
                // Keep local play available if the lookup fails.
            }
        }

        void loadExistingScore();

        return () => {
            isActive = false;
        };
    }, [puzzle, solved]);

    function handleShare() {
        const timeStr = fmtTime(displayTime);
        const text = `Crossing Paths — ${timeStr}\nthepainewedding.com/games/crossword`;
        if (typeof navigator !== "undefined" && navigator.share) {
            navigator.share({ text }).catch(() => {});
        } else {
            navigator.clipboard.writeText(text).then(() => {
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
            }).catch(() => {});
        }
    }

    const activeEntry = entryMap.get(activeEntryId) ?? null;
    const activeWordKeys = new Set(activeEntry?.cells ?? []);

    // When auto-check is on, query the server after each batch of changes
    // (debounced) and update the wrong-cells set. When off, clear wrongs.
    useEffect(() => {
        if (!autoCheck) {
            setIncorrectKeys(new Set());
            return;
        }
        const handle = window.setTimeout(() => {
            void checkGridServer(puzzle.id, letters)
                .then((result) => setIncorrectKeys(new Set(result.wrongCells)))
                .catch(() => { /* leave the set as-is on error */ });
        }, 300);
        return () => window.clearTimeout(handle);
    }, [autoCheck, letters, puzzle.id]);

    // When the player has filled in every cell, check the grid server-side to
    // confirm a solve. This replaces the old client-side answer comparison.
    useEffect(() => {
        if (solved || !gameStarted || isPaused) return;
        if (!allCellsFilled(puzzle, letters)) return;
        let cancelled = false;
        void checkGridServer(puzzle.id, letters)
            .then((result) => {
                if (cancelled) return;
                if (result.allCorrect) {
                    completePuzzleFromCheck();
                } else if (autoCheck) {
                    setIncorrectKeys(new Set(result.wrongCells));
                }
            })
            .catch(() => { /* try again on next change */ });
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [letters, gameStarted, solved, puzzle.id, autoCheck, isPaused]);

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
        setPostGameUnlocked(false);
    }

    // Called after the server confirms the grid is fully correct. We don't
    // overwrite letters because the player already entered the correct values.
    function completePuzzleFromCheck() {
        const finalDuration = Math.round((Date.now() - startTimestamp.current - pausedMs) / 1000);
        setDurationSeconds(finalDuration);
        setElapsed(finalDuration);
        setSolved(true);
        setPostGameUnlocked(false);
    }

    const score = computeCrosswordScore(displayTime, 0, revealedEntryIds.length);
    const metadata: CrosswordMetadata = {
        duration_seconds: displayTime,
        checks_used: 0,
        reveals_used: revealedEntryIds.length,
        completed_at: new Date().toISOString(),
    };

    function entryForCell(key: string, prefer?: CrosswordDirection): PublicCrosswordEntry | null {
        const ids = entryIdsByCell.get(key) ?? [];
        if (ids.length === 0) return null;
        if (prefer) {
            const match = ids.find((id) => entryMap.get(id)?.direction === prefer);
            if (match) return entryMap.get(match) ?? null;
        }
        return entryMap.get(ids[0]) ?? null;
    }

    function isMobileViewport() {
        return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    }

    function scheduleMobileViewportAdjustment() {
        if (!isMobileViewport()) {
            return;
        }

        if (mobileViewportAdjustRef.current !== null) {
            window.clearTimeout(mobileViewportAdjustRef.current);
        }

        mobileViewportAdjustRef.current = window.setTimeout(() => {
            const clueBar = clueBarRef.current;
            if (!clueBar) return;

            const rect = clueBar.getBoundingClientRect();
            const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
            const desiredTop = 88;
            const maxBottom = Math.max(desiredTop + 44, Math.min(viewportHeight * 0.28, 176));

            let delta = 0;
            if (rect.top < desiredTop) {
                delta = rect.top - desiredTop;
            } else if (rect.bottom > maxBottom) {
                delta = rect.bottom - maxBottom;
            }

            if (Math.abs(delta) > 4) {
                window.scrollBy({ top: delta, behavior: "auto" });
            }
        }, 90);
    }

    function focusCell(key: string) {
        programmaticFocusRef.current = true;
        window.requestAnimationFrame(() => {
            inputRefs.current[key]?.focus({ preventScroll: true });
        });
    }

    function focusAndSelectCell(key: string) {
        programmaticFocusRef.current = true;
        window.requestAnimationFrame(() => {
            const input = inputRefs.current[key];
            if (!input) return;
            input.focus({ preventScroll: true });
            input.setSelectionRange(0, input.value.length);
        });
    }

    function selectEntry(entry: PublicCrosswordEntry, focusFirst = true) {
        setActiveEntryId(entry.id);
        if (focusFirst) {
            const target = entry.cells.find((key) => !letters[key]) ?? entry.cells[0];
            if (target) focusCell(target);
        }
    }

    function nextEntry(currentId: string, reverse = false): PublicCrosswordEntry | null {
        const idx = tabOrder.indexOf(currentId);
        if (idx === -1) return null;
        const next = reverse
            ? tabOrder[(idx - 1 + tabOrder.length) % tabOrder.length]
            : tabOrder[(idx + 1) % tabOrder.length];
        return entryMap.get(next) ?? null;
    }

    function nextEmptyCellInEntry(entry: PublicCrosswordEntry, startIndex: number, nextLetters: Record<string, string>) {
        for (let i = startIndex + 1; i < entry.cells.length; i += 1) {
            const key = entry.cells[i];
            if (!nextLetters[key]) return key;
        }
        return null;
    }

    function writeLetter(cell: PublicCrosswordCell, rawLetter: string) {
        if (durationSeconds !== null || isPaused) return;

        const letter = rawLetter.replace(/[^a-zA-Z]/g, "").slice(-1).toUpperCase();
        const entry = activeEntry && activeEntry.cells.includes(cell.key)
            ? activeEntry
            : entryForCell(cell.key, activeEntry?.direction);

        const next = { ...letters, [cell.key]: letter };
        setLetters(next);
        // The "all cells filled?" effect on `letters` will fire and call the
        // server to confirm the solve.

        if (!letter || !entry) return;

        const idx = entry.cells.indexOf(cell.key);
        const nextKey = nextEmptyCellInEntry(entry, idx, next);
        if (nextKey) {
            focusAndSelectCell(nextKey);
            return;
        }

        // Walk forward through entries in tab order, skipping fully-filled ones
        let candidate = nextEntry(entry.id);
        const startId = entry.id;
        while (candidate && candidate.id !== startId) {
            const emptyCell = candidate.cells.find((key) => !next[key]);
            if (emptyCell) {
                setActiveEntryId(candidate.id);
                focusAndSelectCell(emptyCell);
                return;
            }
            candidate = nextEntry(candidate.id);
        }
        // Fallback: just move to first cell of next entry
        const fallback = nextEntry(entry.id);
        if (fallback) {
            setActiveEntryId(fallback.id);
            focusAndSelectCell(fallback.cells[0]);
        }
    }

    function handleCellFocus(cell: PublicCrosswordCell) {
        const entry = entryForCell(cell.key, activeEntry?.direction);
        if (entry) setActiveEntryId(entry.id);
        setFocusedKey(cell.key);
        const wasProgrammatic = programmaticFocusRef.current;
        programmaticFocusRef.current = false;
        window.requestAnimationFrame(() => {
            const input = inputRefs.current[cell.key];
            if (!input) return;
            input.setSelectionRange(0, input.value.length);
            if (!wasProgrammatic) {
                scheduleMobileViewportAdjustment();
            }
        });
    }

    function handleCellClick(cell: PublicCrosswordCell) {
        if (!cell.isFillable) return;
        const entry = entryForCell(cell.key, activeEntry?.direction);
        if (entry) setActiveEntryId(entry.id);
    }

    function handleCellPointerDown(cell: PublicCrosswordCell) {
        if (!cell.isFillable) return;
        // Toggle direction immediately on pointer-down for same cell (reliable on iOS)
        if (focusedKey === cell.key) {
            const ids = entryIdsByCell.get(cell.key) ?? [];
            if (ids.length === 2) {
                const other = ids.find((id) => id !== activeEntryId);
                if (other) setActiveEntryId(other);
            }
        }
    }

    function handleType(cell: PublicCrosswordCell, raw: string) {
        if (isPaused) return;

        if (!raw) {
            setLetters((prev) => ({ ...prev, [cell.key]: "" }));
            return;
        }

        writeLetter(cell, raw);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, cell: PublicCrosswordCell) {
        if (!cell.isFillable || isPaused) return;

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
            if (target?.isFillable) {
                const entry = entryForCell(target.key, "across");
                if (entry) setActiveEntryId(entry.id);
                focusCell(target.key);
            }
            return;
        }

        if (e.key === "ArrowLeft") {
            e.preventDefault();
            const target = cellMap.get(cellKey(cell.row, cell.col - 1));
            if (target?.isFillable) {
                const entry = entryForCell(target.key, "across");
                if (entry) setActiveEntryId(entry.id);
                focusCell(target.key);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const target = cellMap.get(cellKey(cell.row + 1, cell.col));
            if (target?.isFillable) {
                const entry = entryForCell(target.key, "down");
                if (entry) setActiveEntryId(entry.id);
                focusCell(target.key);
            }
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            const target = cellMap.get(cellKey(cell.row - 1, cell.col));
            if (target?.isFillable) {
                const entry = entryForCell(target.key, "down");
                if (entry) setActiveEntryId(entry.id);
                focusCell(target.key);
            }
            return;
        }
    }

    async function handleReveal() {
        if (!activeEntry || durationSeconds !== null) return;
        const entry = activeEntry;
        let revealed: Record<string, string>;
        try {
            revealed = await revealEntryServer(puzzle.id, entry.id);
        } catch {
            return;
        }
        const next = { ...letters, ...revealed };
        setRevealedEntryIds((current) => (current.includes(entry.id) ? current : [...current, entry.id]));
        setLetters(next);
        // The all-cells-filled effect will trigger a server check and mark
        // the puzzle solved if the reveal completed it.
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
        setPostGameUnlocked(false);
        setSolvedWithoutLocalBoard(false);
        startTimestamp.current = 0;
        pausedSinceRef.current = null;
        window.localStorage.removeItem(storageKey);
    }

    function unlockPostGame() {
        setPostGameUnlocked(true);
    }

    const finishLocked = solved && !postGameUnlocked;
    const showHeaderControls = !finishLocked;
    const compactSolvedHeader = solved;

    return (
        <div className="overflow-hidden rounded-[2.2rem] border border-primary/12 bg-white shadow-[0_24px_80px_rgba(20,42,68,0.10)]">
            <div className="border-b border-primary/8 bg-[#fbf8f3] px-5 py-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Daily Puzzle</p>
                            <h2 className="font-heading text-2xl text-primary">Crossing Paths</h2>
                            {solved && postGameUnlocked && (
                                <button
                                    type="button"
                                    onClick={() => setPostGameUnlocked(false)}
                                    className="mt-1.5 flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary transition-colors hover:text-primary/70"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                    Back to Results
                                </button>
                            )}
                        </div>
                        <div className="flex min-w-0 flex-col items-end text-right">
                            <span className={`font-mono font-semibold leading-none tabular-nums text-primary ${
                                compactSolvedHeader ? "text-[1.65rem] sm:text-[2.25rem]" : "text-[2rem] sm:text-4xl"
                            }`}>
                                {fmtTime(displayTime)}
                            </span>
                            {solved && <span className="mt-1 text-[10px] uppercase tracking-widest text-accent">solved!</span>}
                        </div>
                    </div>

                    <div className={`flex flex-wrap items-center justify-start gap-1.5 sm:justify-end ${showHeaderControls ? "" : "hidden"}`}>
                        {gameStarted && !solved && (
                            <button
                                type="button"
                                onClick={handlePause}
                                className="whitespace-nowrap rounded-full border border-primary/20 px-2.5 py-1.5 text-[9px] uppercase tracking-widest text-text-secondary transition-colors hover:border-primary/40 hover:text-primary sm:px-3 sm:text-[10px]"
                            >
                                {isPaused ? "Resume" : "Pause"}
                            </button>
                        )}
                        <button
                            onClick={() => setAutoCheck((value) => !value)}
                            disabled={finishLocked}
                            className={`whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[9px] uppercase tracking-widest transition-colors sm:px-3 sm:text-[10px] ${
                                autoCheck
                                    ? "border-primary bg-primary text-white"
                                    : "border-primary/20 text-text-secondary hover:border-primary/40 hover:text-primary"
                            } ${finishLocked ? "cursor-not-allowed opacity-40" : ""}`}
                        >
                            Autocheck
                        </button>
                        {isAdmin && (
                            <button
                                onClick={handleReveal}
                                disabled={!activeEntry || solved || finishLocked}
                                className="whitespace-nowrap rounded-full border border-amber-400/40 bg-amber-50 px-2.5 py-1.5 text-[9px] uppercase tracking-widest text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-[10px]"
                            >
                                Reveal
                            </button>
                        )}
                        <button
                            onClick={handleReset}
                            disabled={finishLocked}
                            className="whitespace-nowrap rounded-full border border-primary/15 px-2.5 py-1.5 text-[9px] uppercase tracking-widest text-text-secondary transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-[10px]"
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

                <div
                    className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[rgba(23,55,86,0.62)] px-8 text-center backdrop-blur-sm transition-opacity duration-300 ${
                        finishLocked ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M16 3l2.5 8h8.5l-7 5 2.5 8L16 19l-6.5 5 2.5-8-7-5h8.5z" fill="#c9a96e" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-heading text-3xl text-white">Congratulations!</h3>
                        <p className="mt-2 text-base text-white/70">You solved Crossing Paths</p>
                    </div>
                    <div>
                        <p className="font-mono text-5xl font-bold tabular-nums text-accent">{fmtTime(displayTime)}</p>
                        <p className="mt-2 text-sm text-white/50">Great solve</p>
                        <p className="mt-1 text-sm font-semibold text-accent">{score} pts</p>
                    </div>
                    {!solvedWithoutLocalBoard && (
                        <button
                            type="button"
                            onClick={unlockPostGame}
                            className="rounded-full border border-white/30 bg-white/10 px-7 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition-colors hover:bg-white/16"
                        >
                            View Board
                        </button>
                    )}
                </div>

                {solvedWithoutLocalBoard ? (
                    <div className="flex flex-col items-center justify-center gap-3 bg-[#fbf8f3] px-8 py-16 text-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary/30">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M3 9h18M9 21V9" />
                        </svg>
                        <p className="max-w-xs text-sm leading-relaxed text-text-secondary">
                            You solved this one on this device before, but the board isn&apos;t stored here.
                        </p>
                    </div>
                ) : (
                    <>
                        <div ref={clueBarRef} className="flex min-h-[44px] items-center border-b border-primary/8 bg-white px-5 py-3">
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
                                        if (!cell.isFillable) {
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
                                                    onPointerDown={() => handleCellPointerDown(cell)}
                                                    onClick={() => handleCellClick(cell)}
                                                    onKeyDown={(e) => handleKeyDown(e, cell)}
                                                    onMouseUp={(e) => e.preventDefault()}
                                                    onContextMenu={(e) => e.preventDefault()}
                                                    onSelect={(e) => e.preventDefault()}
                                                    maxLength={1}
                                                    inputMode="text"
                                                    autoComplete="off"
                                                    autoCorrect="off"
                                                    autoCapitalize="characters"
                                                    spellCheck={false}
                                                    data-form-type="other"
                                                    aria-label={`Cell ${cell.row + 1}-${cell.col + 1}`}
                                                    disabled={solved || isPaused}
                                                    className={`h-full w-full cursor-default bg-transparent pb-0 pt-3 text-center text-[22px] font-bold uppercase outline-none [caret-color:transparent] [-webkit-touch-callout:none] select-none selection:bg-transparent ${
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
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="ml-1 inline h-2.5 w-2.5 opacity-40">
                                                                <path d="M20 6L9 17l-5-5" />
                                                            </svg>
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
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="ml-1 inline h-2.5 w-2.5 opacity-40">
                                                                <path d="M20 6L9 17l-5-5" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
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
                            <p className="mt-2 text-sm text-white/50">Clean solve</p>
                        )}
                        <p className="mt-1 text-sm font-semibold text-accent">{score} pts</p>
                    </div>

                    <div className="bg-white px-6 py-6">
                        {isAdmin ? (
                            <div className="rounded-[1.5rem] border border-accent/20 bg-accent/8 px-5 py-4 text-center">
                                <p className="text-sm text-text-secondary">Admin mode — score not recorded</p>
                            </div>
                        ) : scoreSubmitted ? (
                            <div className="rounded-[1.5rem] border border-accent/30 bg-accent/10 px-5 py-4 text-center">
                                <p className="text-xs uppercase tracking-[0.3em] text-primary">Score Locked In</p>
                                <p className="mt-2 text-sm text-text-secondary">
                                    {playerRank
                                        ? `You're #${playerRank.rank} of ${playerRank.total} on the leaderboard.`
                                        : "You're on the leaderboard — check back to see how others do!"}
                                </p>
                            </div>
                        ) : autoSubmitStatus === "submitting" ? (
                            <div className="rounded-[1.5rem] border border-primary/8 bg-surface/40 px-5 py-4 text-center">
                                <p className="text-sm text-text-secondary/60">Submitting score…</p>
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
