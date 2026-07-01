// Client-safe crossword types and pure utilities. Everything that depends
// on the puzzle answer key lives in crossword.ts (server-only) and reaches
// the browser through /api/games/crossword/* endpoints.

export type CrosswordDirection = "across" | "down";

// Internal "answer included" types — used server-side and by admin tooling
// that legitimately needs the answer key. Not for client consumption.
export type CrosswordEntry = {
    id: string;
    answer: string;
    clue: string;
    direction: CrosswordDirection;
    row: number;
    col: number;
};

export type CrosswordCell = {
    row: number;
    col: number;
    key: string;
    answer: string | null;
    number: number | null;
    entryIds: string[];
};

export type CrosswordNumberedEntry = CrosswordEntry & {
    number: number;
    cells: string[];
};

export type CrosswordPuzzle = {
    id: string;
    title: string;
    subtitle: string;
    rows: number;
    cols: number;
    entries: CrosswordEntry[];
};

export type BuiltCrossword = Omit<CrosswordPuzzle, "entries"> & {
    cells: CrosswordCell[];
    entries: CrosswordNumberedEntry[];
    across: CrosswordNumberedEntry[];
    down: CrosswordNumberedEntry[];
};

export type CrosswordMetadata = {
    duration_seconds: number;
    checks_used: number;
    reveals_used: number;
    completed_at: string;
};

export type CrosswordEntryOverride = {
    id: string;
    answer: string;
    clue: string;
};

export type CrosswordOverrideMap = Record<string, CrosswordEntryOverride[]>;

export type CrosswordCatalogItem = {
    id: string;
    dateKey: string;
    title: string;
    subtitle: string;
    rows: number;
    cols: number;
    entryCount: number;
};

// ─── Public types — these are what the client receives. No `answer` field
// anywhere. The server gates correctness checks behind API endpoints.

export type PublicCrosswordCell = {
    row: number;
    col: number;
    key: string;
    isFillable: boolean;
    number: number | null;
    entryIds: string[];
};

export type PublicCrosswordEntry = {
    id: string;
    number: number;
    direction: CrosswordDirection;
    row: number;
    col: number;
    clue: string;
    length: number;
    cells: string[];
};

export type PublicBuiltCrossword = {
    id: string;
    title: string;
    subtitle: string;
    rows: number;
    cols: number;
    cells: PublicCrosswordCell[];
    entries: PublicCrosswordEntry[];
    across: PublicCrosswordEntry[];
    down: PublicCrosswordEntry[];
};

// ─── Constants

export const PUZZLE_ROTATION_START = "2026-03-17";

// ─── Pure utilities — safe everywhere

function normalizeCrosswordAnswer(value: string) {
    return value.trim().toUpperCase().replace(/[^A-Z]/g, "");
}

function normalizeCrosswordClue(value: string) {
    return value.trim();
}

export function parseCrosswordOverrides(value: unknown): CrosswordOverrideMap {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }

    const result: CrosswordOverrideMap = {};

    for (const [puzzleId, rawEntries] of Object.entries(value as Record<string, unknown>)) {
        if (!Array.isArray(rawEntries)) continue;

        const parsedEntries = rawEntries
            .map((rawEntry) => {
                if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) {
                    return null;
                }

                const record = rawEntry as Record<string, unknown>;
                const id = typeof record.id === "string" ? record.id.trim() : "";
                const answer = typeof record.answer === "string" ? normalizeCrosswordAnswer(record.answer) : "";
                const clue = typeof record.clue === "string" ? normalizeCrosswordClue(record.clue) : "";

                if (!id || !answer || !clue) {
                    return null;
                }

                return { id, answer, clue };
            })
            .filter((entry): entry is CrosswordEntryOverride => Boolean(entry));

        if (parsedEntries.length > 0) {
            result[puzzleId] = parsedEntries;
        }
    }

    return result;
}

export function getCentralDateKey(date = new Date()) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    return formatter.format(date);
}

export function getCrosswordStorageKey(puzzleId: string, dateKey: string): string {
    return `wedding-crossword-state:${puzzleId}:${dateKey}`;
}

export function computeCrosswordScore(
    durationSeconds: number,
    checksUsed: number,
    revealsUsed: number
): number {
    const timePenalty = Math.floor(durationSeconds / 30);
    return Math.max(20, 100 - timePenalty - checksUsed * 4 - revealsUsed * 10);
}
