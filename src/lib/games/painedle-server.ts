import "server-only";
import { PAINEDLE_WORDS } from "@/lib/games/word-list";

const PUZZLE_ROTATION_START = "2026-03-08";
const PUZZLE_ROTATION_START_WORD = "bride";
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseDateKeyAsUtc(dateKey: string) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
}

export function getPuzzleIndex(dateKey: string) {
    const startUtc = parseDateKeyAsUtc(PUZZLE_ROTATION_START);
    const targetUtc = parseDateKeyAsUtc(dateKey);
    const dayOffset = Math.floor((targetUtc - startUtc) / MS_PER_DAY);
    const startIndex = PAINEDLE_WORDS.indexOf(PUZZLE_ROTATION_START_WORD);

    if (startIndex === -1) {
        throw new Error(`Missing start word "${PUZZLE_ROTATION_START_WORD}" in PAINEDLE_WORDS.`);
    }

    return ((startIndex + dayOffset) % PAINEDLE_WORDS.length + PAINEDLE_WORDS.length) % PAINEDLE_WORDS.length;
}

export function getDailyWord(dateKey: string): string {
    return PAINEDLE_WORDS[getPuzzleIndex(dateKey)];
}
