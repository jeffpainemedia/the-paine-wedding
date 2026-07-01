// Server-only crossword module. Exposes the daily-puzzle lookup, override
// application, and admin helpers. The puzzle answer key only lives here and
// in /api/games/crossword/* endpoints.
import "server-only";
import { RAW_PUZZLES, type RawPuzzleData } from "@/lib/games/crossword-data";
import {
    PUZZLE_ROTATION_START,
    getCentralDateKey,
    type BuiltCrossword,
    type CrosswordCatalogItem,
    type CrosswordEntry,
    type CrosswordEntryOverride,
    type CrosswordNumberedEntry,
    type CrosswordOverrideMap,
    type CrosswordPuzzle,
    type PublicBuiltCrossword,
    type PublicCrosswordEntry,
} from "@/lib/games/crossword-types";

// Re-export everything client code might want to import from "@/lib/games/crossword".
export {
    PUZZLE_ROTATION_START,
    getCentralDateKey,
    getCrosswordStorageKey,
    computeCrosswordScore,
    parseCrosswordOverrides,
} from "@/lib/games/crossword-types";
export type {
    BuiltCrossword,
    CrosswordCatalogItem,
    CrosswordCell,
    CrosswordDirection,
    CrosswordEntry,
    CrosswordEntryOverride,
    CrosswordMetadata,
    CrosswordNumberedEntry,
    CrosswordOverrideMap,
    CrosswordPuzzle,
    PublicBuiltCrossword,
    PublicCrosswordCell,
    PublicCrosswordEntry,
} from "@/lib/games/crossword-types";

// Internal helpers (kept private to this module).

function buildPuzzle(raw: RawPuzzleData): CrosswordPuzzle {
    let aCount = 0;
    let dCount = 0;
    const entries: CrosswordEntry[] = raw.words.map((w) => ({
        id: w.dir === "A" ? `a${++aCount}` : `d${++dCount}`,
        answer: w.word.toUpperCase(),
        clue: w.clue,
        direction: w.dir === "A" ? "across" : "down",
        row: w.row,
        col: w.col,
    }));

    // Validate intersections
    const grid: Record<string, string> = {};
    for (const e of entries) {
        for (let i = 0; i < e.answer.length; i++) {
            const r = e.row + (e.direction === "down" ? i : 0);
            const c = e.col + (e.direction === "across" ? i : 0);
            const key = `${r}:${c}`;
            if (grid[key] && grid[key] !== e.answer[i]) {
                throw new Error(`Crossword intersection mismatch at ${key} in ${raw.id}`);
            }
            grid[key] = e.answer[i];
        }
    }

    return {
        id: raw.id,
        title: "Ashlyn & Jeffrey Crossing Paths",
        subtitle: "Fill in the blanks — all answers are drawn from their story, their words, and their world.",
        rows: raw.rows,
        cols: raw.cols,
        entries,
    };
}

function normalizeCrosswordAnswer(value: string) {
    return value.trim().toUpperCase().replace(/[^A-Z]/g, "");
}

function normalizeCrosswordClue(value: string) {
    return value.trim();
}

function createEmptyCells(rows: number, cols: number) {
    return Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => ({
            row,
            col,
            key: `${row}:${col}`,
            answer: null as string | null,
            number: null as number | null,
            entryIds: [] as string[],
        }))
    );
}

function buildCrossword(puzzle: CrosswordPuzzle): BuiltCrossword {
    const grid = createEmptyCells(puzzle.rows, puzzle.cols);

    // Pass 1: populate every cell's answer letter + the entries that pass
    // through it. We'll number cells separately in pass 2.
    for (const entry of puzzle.entries) {
        const isAcross = entry.direction === "across";
        entry.answer.split("").forEach((letter, index) => {
            const row = entry.row + (isAcross ? 0 : index);
            const col = entry.col + (isAcross ? index : 0);
            const cell = grid[row]?.[col];

            if (!cell) {
                throw new Error(`Crossword entry "${entry.id}" falls outside the grid.`);
            }

            if (cell.answer && cell.answer !== letter) {
                throw new Error(
                    `Crossword entry "${entry.id}" conflicts at ${row},${col}: expected ${cell.answer}, got ${letter}`
                );
            }

            cell.answer = letter;
            cell.entryIds.push(entry.id);
        });
    }

    // Pass 2: number cells in standard crossword order — scan left-to-right,
    // top-to-bottom, and assign the next number to any cell that's the start
    // of an across or down word. This matches what crossword players expect.
    const startKeys = new Set(puzzle.entries.map((e) => `${e.row}:${e.col}`));
    const startNumbers = new Map<string, number>();
    let nextNumber = 1;
    for (let r = 0; r < puzzle.rows; r++) {
        for (let c = 0; c < puzzle.cols; c++) {
            const key = `${r}:${c}`;
            if (startKeys.has(key)) {
                startNumbers.set(key, nextNumber);
                grid[r][c].number = nextNumber;
                nextNumber += 1;
            }
        }
    }

    const numberedEntries: CrosswordNumberedEntry[] = puzzle.entries
        .map((entry) => ({
            ...entry,
            number: startNumbers.get(`${entry.row}:${entry.col}`) ?? 0,
            cells: entry.answer.split("").map((_, index) => {
                const row = entry.row + (entry.direction === "across" ? 0 : index);
                const col = entry.col + (entry.direction === "across" ? index : 0);
                return `${row}:${col}`;
            }),
        }))
        .sort((a, b) => a.number - b.number || a.direction.localeCompare(b.direction));

    return {
        ...puzzle,
        cells: grid.flat(),
        entries: numberedEntries,
        across: numberedEntries.filter((e) => e.direction === "across"),
        down: numberedEntries.filter((e) => e.direction === "down"),
    };
}

const PUZZLE_POOL = RAW_PUZZLES.map((raw) => buildCrossword(buildPuzzle(raw)));

function parseDateKeyAsUtc(dateKey: string) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
}

function getPuzzleDateByIndex(index: number) {
    const startUtc = parseDateKeyAsUtc(PUZZLE_ROTATION_START);
    return new Date(startUtc + index * 86400000);
}

export function getCrosswordCatalog(overrides?: CrosswordOverrideMap): CrosswordCatalogItem[] {
    return PUZZLE_POOL.map((puzzle, index) => {
        const effective = applyCrosswordEntryOverrides(puzzle, overrides?.[puzzle.id]);
        return {
            id: effective.id,
            dateKey: getCentralDateKey(getPuzzleDateByIndex(index)),
            title: effective.title,
            subtitle: effective.subtitle,
            rows: effective.rows,
            cols: effective.cols,
            entryCount: effective.entries.length,
        };
    });
}

export function getCrosswordPuzzleById(puzzleId: string, overrides?: CrosswordOverrideMap): BuiltCrossword | null {
    const puzzle = PUZZLE_POOL.find((entry) => entry.id === puzzleId);
    if (!puzzle) return null;
    return applyCrosswordEntryOverrides(puzzle, overrides?.[puzzleId]);
}

export function applyCrosswordEntryOverrides(
    puzzle: CrosswordPuzzle | BuiltCrossword,
    overrides?: CrosswordEntryOverride[]
): BuiltCrossword {
    if (!overrides || overrides.length === 0) {
        return buildCrossword({
            id: puzzle.id,
            title: puzzle.title,
            subtitle: puzzle.subtitle,
            rows: puzzle.rows,
            cols: puzzle.cols,
            entries: puzzle.entries.map((entry) => ({
                id: entry.id,
                answer: entry.answer.toUpperCase(),
                clue: entry.clue,
                direction: entry.direction,
                row: entry.row,
                col: entry.col,
            })),
        });
    }

    const overrideLookup = new Map(overrides.map((entry) => [entry.id, entry]));

    const nextEntries = puzzle.entries.map((entry) => {
        const override = overrideLookup.get(entry.id);
        if (!override) {
            return {
                id: entry.id,
                answer: entry.answer.toUpperCase(),
                clue: entry.clue,
                direction: entry.direction,
                row: entry.row,
                col: entry.col,
            };
        }

        return {
            id: entry.id,
            answer: normalizeCrosswordAnswer(override.answer),
            clue: normalizeCrosswordClue(override.clue),
            direction: entry.direction,
            row: entry.row,
            col: entry.col,
        };
    });

    for (const entry of nextEntries) {
        if (!entry.answer) {
            throw new Error(`Crossword entry "${entry.id}" is missing an answer.`);
        }

        const original = puzzle.entries.find((item) => item.id === entry.id);
        if (!original) {
            throw new Error(`Crossword entry "${entry.id}" does not exist in puzzle "${puzzle.id}".`);
        }

        if (entry.answer.length !== original.answer.length) {
            throw new Error(
                `Crossword entry "${entry.id}" must stay ${original.answer.length} letters (received ${entry.answer.length}).`
            );
        }

        if (!entry.clue) {
            throw new Error(`Crossword entry "${entry.id}" is missing clue text.`);
        }
    }

    return buildCrossword({
        id: puzzle.id,
        title: puzzle.title,
        subtitle: puzzle.subtitle,
        rows: puzzle.rows,
        cols: puzzle.cols,
        entries: nextEntries,
    });
}

export function getDailyCrosswordPuzzle(dateKey: string, overrides?: CrosswordOverrideMap): BuiltCrossword {
    const start = parseDateKeyAsUtc(PUZZLE_ROTATION_START);
    const target = parseDateKeyAsUtc(dateKey);
    const diffDays = Math.floor((target - start) / 86400000);
    // Cycle the pool instead of clamping so we never run out of puzzles if the
    // runway extends past the pool length.
    const safeDiff = Math.max(0, diffDays);
    const index = safeDiff % PUZZLE_POOL.length;
    const puzzle = PUZZLE_POOL[index];
    return applyCrosswordEntryOverrides(puzzle, overrides?.[puzzle.id]);
}

// Convert an answer-bearing crossword to the public shape the client sees.
// All `answer` fields are stripped; cells get an `isFillable` flag instead.
export function toPublicCrossword(puzzle: BuiltCrossword): PublicBuiltCrossword {
    const publicEntries: PublicCrosswordEntry[] = puzzle.entries.map((entry) => ({
        id: entry.id,
        number: entry.number,
        direction: entry.direction,
        row: entry.row,
        col: entry.col,
        clue: entry.clue,
        length: entry.answer.length,
        cells: entry.cells,
    }));

    return {
        id: puzzle.id,
        title: puzzle.title,
        subtitle: puzzle.subtitle,
        rows: puzzle.rows,
        cols: puzzle.cols,
        cells: puzzle.cells.map((cell) => ({
            row: cell.row,
            col: cell.col,
            key: cell.key,
            isFillable: cell.answer !== null,
            number: cell.number,
            entryIds: cell.entryIds,
        })),
        entries: publicEntries,
        across: publicEntries.filter((e) => e.direction === "across"),
        down: publicEntries.filter((e) => e.direction === "down"),
    };
}

// ── Legacy admin / test helpers — full puzzle data still available server-side.

export const CROSSWORD_PUZZLE = applyCrosswordEntryOverrides(PUZZLE_POOL[0]);
export const CROSSWORD_PUZZLE_KEY = CROSSWORD_PUZZLE.id;
export const CROSSWORD_STORAGE_KEY = `wedding-crossword-state:${CROSSWORD_PUZZLE.id}:${PUZZLE_ROTATION_START}`;

/** Returns all unique word+clue pairs across every puzzle, sorted alphabetically. */
export function getAllCrosswordWordClues(): { word: string; clue: string }[] {
    const map = new Map<string, string>();
    for (const puzzle of PUZZLE_POOL) {
        for (const entry of puzzle.entries) {
            if (!map.has(entry.answer)) {
                map.set(entry.answer, entry.clue);
            }
        }
    }
    return Array.from(map.entries())
        .map(([word, clue]) => ({ word, clue }))
        .sort((a, b) => a.word.localeCompare(b.word));
}
