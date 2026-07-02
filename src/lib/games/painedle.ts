// Client-safe Painedle utilities. NO word list or daily-word logic — those
// live in painedle-server.ts (server-only) and are reached through
// /api/games/painedle/* endpoints.

import { getCentralDateKey } from "@/lib/games/crossword-types";

export const MAX_GUESSES = 6;
export const WORD_LENGTH = 5;
export const KEYBOARD_ROWS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["BACK", "Z", "X", "C", "V", "B", "N", "M", "ENTER"],
] as const;

export type LetterStatus = "correct" | "present" | "absent";

export function getTodayKey(date = new Date()) {
    // Wedding day rollover is tied to Central time, not the guest's browser
    // timezone — matches Crossword/Connections so all daily games flip at
    // the same moment. Format is still YYYY-MM-DD, so existing localStorage
    // state keyed by date stays compatible.
    return getCentralDateKey(date);
}

export function getStorageKey(dateKey: string) {
    return `painedle:${dateKey}`;
}

// Pure function: given a guess and a solution, return per-letter status.
// Used server-side to compute statuses; never called client-side now that
// solutions stay on the server.
export function evaluateGuess(guess: string, solution: string): LetterStatus[] {
    const statuses: LetterStatus[] = Array.from({ length: solution.length }, () => "absent");
    const solutionLetters = solution.split("");
    const guessLetters = guess.split("");

    guessLetters.forEach((letter, index) => {
        if (letter === solutionLetters[index]) {
            statuses[index] = "correct";
            solutionLetters[index] = "*";
            guessLetters[index] = "_";
        }
    });

    guessLetters.forEach((letter, index) => {
        if (letter === "_") return;

        const solutionIndex = solutionLetters.indexOf(letter);
        if (solutionIndex !== -1) {
            statuses[index] = "present";
            solutionLetters[solutionIndex] = "*";
        }
    });

    return statuses;
}

// Build keyboard color map from accumulated per-guess statuses. Pure logic
// — operates on the statuses returned by /api/games/painedle/guess, so the
// client can run this without ever knowing the solution.
export function getKeyboardStatusesFromHistory(
    guesses: string[],
    statusHistory: LetterStatus[][]
): Record<string, LetterStatus | undefined> {
    const statusMap: Record<string, LetterStatus | undefined> = {};
    const priority: Record<LetterStatus, number> = {
        absent: 0,
        present: 1,
        correct: 2,
    };

    guesses.forEach((guess, gIdx) => {
        const statuses = statusHistory[gIdx];
        if (!statuses) return;
        for (let i = 0; i < guess.length; i++) {
            const letter = guess[i].toLowerCase();
            const status = statuses[i];
            const current = statusMap[letter];
            if (!current || priority[status] > priority[current]) {
                statusMap[letter] = status;
            }
        }
    });

    return statusMap;
}
