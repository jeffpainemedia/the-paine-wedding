import "server-only";
import { CONNECTIONS_PUZZLES } from "@/lib/games/connections-puzzles";
import {
    PUZZLE_ROTATION_START,
    type ConnectionsGroup,
    type ConnectionsPuzzle,
    type PublicConnectionsPuzzle,
} from "@/lib/games/connections";

function parseDateKeyAsUtc(dateKey: string): Date {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

export function getPuzzleIndex(dateKey: string): number {
    const startUtc = parseDateKeyAsUtc(PUZZLE_ROTATION_START);
    const targetUtc = parseDateKeyAsUtc(dateKey);
    const dayOffset = Math.floor((targetUtc.getTime() - startUtc.getTime()) / 86400000);
    return Math.min(Math.max(0, dayOffset), CONNECTIONS_PUZZLES.length - 1);
}

export function getDailyConnectionsPuzzle(dateKey: string): ConnectionsPuzzle {
    return CONNECTIONS_PUZZLES[getPuzzleIndex(dateKey)];
}

export function getConnectionsPuzzleById(id: number): ConnectionsPuzzle | null {
    return CONNECTIONS_PUZZLES.find((p) => p.id === id) ?? null;
}

// Strip group/category info — what clients see.
export function toPublicPuzzle(puzzle: ConnectionsPuzzle): PublicConnectionsPuzzle {
    return { id: puzzle.id, words: puzzle.words };
}

// Validate a 4-word selection against a puzzle's groups.
export function checkSelection(
    puzzle: ConnectionsPuzzle,
    selected: string[]
): { result: "match"; group: ConnectionsGroup }
   | { result: "one_away" }
   | { result: "wrong" }
   | { result: "invalid" } {
    if (selected.length !== 4) return { result: "invalid" };

    // Validate every word is part of the puzzle's pool
    for (const w of selected) {
        if (!puzzle.words.includes(w)) return { result: "invalid" };
    }

    // Match: all 4 selected belong to the same group
    for (const group of puzzle.groups) {
        const allMatch = selected.every((w) => group.words.includes(w));
        if (allMatch) return { result: "match", group };
    }

    // One away: 3 of the 4 selected belong to the same group
    for (const group of puzzle.groups) {
        const overlap = selected.filter((w) => group.words.includes(w)).length;
        if (overlap === 3) return { result: "one_away" };
    }

    return { result: "wrong" };
}
