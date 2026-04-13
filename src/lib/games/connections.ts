import { getCentralDateKey } from "@/lib/games/crossword";
import { CONNECTIONS_PUZZLES } from "@/lib/games/connections-puzzles";

function parseDateKeyAsUtc(dateKey: string): Date {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

export type ConnectionsDifficulty = 1 | 2 | 3 | 4;

export type ConnectionsGroup = {
    category: string;
    words: [string, string, string, string];
    difficulty: ConnectionsDifficulty;
};

export type ConnectionsPuzzle = {
    id: number;
    words: string[]; // 16 words, shuffled
    groups: [ConnectionsGroup, ConnectionsGroup, ConnectionsGroup, ConnectionsGroup];
};

export type ConnectionsMetadata = {
    duration_seconds: number;
    mistakes: number;
    solve_order: number[];
    completed_at: string;
};

export const PUZZLE_ROTATION_START = "2026-04-12";
export const MAX_MISTAKES = 4;

export const DIFFICULTY_COLORS: Record<ConnectionsDifficulty, string> = {
    1: "yellow",
    2: "green",
    3: "blue",
    4: "purple",
};

export const DIFFICULTY_LABELS: Record<ConnectionsDifficulty, string> = {
    1: "Easiest",
    2: "Easy",
    3: "Medium",
    4: "Hardest",
};

export const DIFFICULTY_BG: Record<ConnectionsDifficulty, string> = {
    1: "bg-yellow-300 text-yellow-900",
    2: "bg-emerald-400 text-emerald-900",
    3: "bg-blue-400 text-blue-900",
    4: "bg-purple-400 text-purple-900",
};

export function getPuzzleIndex(dateKey: string): number {
    const startUtc = parseDateKeyAsUtc(PUZZLE_ROTATION_START);
    const targetUtc = parseDateKeyAsUtc(dateKey);
    const dayOffset = Math.floor((targetUtc.getTime() - startUtc.getTime()) / 86400000);
    return Math.min(Math.max(0, dayOffset), CONNECTIONS_PUZZLES.length - 1);
}


export function getDailyConnectionsPuzzle(dateKey: string): ConnectionsPuzzle {
    return CONNECTIONS_PUZZLES[getPuzzleIndex(dateKey)];
}

export function getConnectionsStorageKey(puzzleId: number, dateKey: string): string {
    return `wedding-connections-state:${puzzleId}:${dateKey}`;
}

export function computeConnectionsScore(mistakes: number, durationSeconds: number): number {
    return Math.max(20, 100 - mistakes * 15 - Math.floor(durationSeconds / 30));
}

export function checkOneAway(selected: string[], unsolvedGroups: ConnectionsGroup[]): boolean {
    for (const group of unsolvedGroups) {
        const count = selected.filter((w) => group.words.includes(w)).length;
        if (count === 3) return true;
    }
    return false;
}

export function findMatchingGroup(
    selected: string[],
    unsolvedGroups: ConnectionsGroup[]
): ConnectionsGroup | null {
    for (const group of unsolvedGroups) {
        const allMatch = selected.every((w) => group.words.includes(w));
        if (allMatch && selected.length === 4) return group;
    }
    return null;
}

// Re-export getCentralDateKey for use in page.tsx
export { getCentralDateKey };
