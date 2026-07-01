// Client-safe connections types + utilities. NO puzzle data is imported here
// — that lives in connections-puzzles.ts (server-only) and is read via the
// /api/games/connections/* endpoints.
import { getCentralDateKey } from "@/lib/games/crossword-types";

export type ConnectionsDifficulty = 1 | 2 | 3 | 4;

export type ConnectionsGroup = {
    category: string;
    words: [string, string, string, string];
    difficulty: ConnectionsDifficulty;
};

// Full puzzle (server-only). Kept here as a type so server modules can use it.
export type ConnectionsPuzzle = {
    id: number;
    words: string[]; // 16 words, shuffled
    groups: [ConnectionsGroup, ConnectionsGroup, ConnectionsGroup, ConnectionsGroup];
};

// What clients see. Group/category info is intentionally excluded.
export type PublicConnectionsPuzzle = {
    id: number;
    words: string[];
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
    1: "gold",
    2: "navy-light",
    3: "navy",
    4: "burgundy",
};

export const DIFFICULTY_LABELS: Record<ConnectionsDifficulty, string> = {
    1: "Easiest",
    2: "Easy",
    3: "Medium",
    4: "Hardest",
};

// Solid pastel colors from the site palette — each pairs with dark high-contrast text
export const DIFFICULTY_BG: Record<ConnectionsDifficulty, string> = {
    1: "bg-[#E8D5BC] text-[#6B4A25]",
    2: "bg-[#BDC9D9] text-[#1A3F6F]",
    3: "bg-[#8FA5C0] text-[#0C2242]",
    4: "bg-[#C4A6AB] text-[#5A1018]",
};

export function getConnectionsStorageKey(puzzleId: number, dateKey: string): string {
    return `wedding-connections-state:${puzzleId}:${dateKey}`;
}

export function computeConnectionsScore(mistakes: number, durationSeconds: number): number {
    return Math.max(20, 100 - mistakes * 15 - Math.floor(durationSeconds / 30));
}

// Re-export getCentralDateKey for use in page.tsx
export { getCentralDateKey };
