/**
 * export-crossword-words.mjs
 * Extracts all unique word+clue pairs from the crossword puzzle data.
 * Run: node scripts/export-crossword-words.mjs
 *
 * Output: JSON array of { word, clue } sorted alphabetically.
 * Paste this into ChatGPT to review and improve clue quality.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dir, "../src/lib/games/crossword.ts"), "utf8");

// Extract all word:clue pairs from RawPuzzleData entries
// Pattern: a1: "word", clue_a1: "clue text",
const wordClueRe = /\b(?:a1|a2|a3|d1|d2|d3):\s*"([^"]+)",\s*clue_(?:a1|a2|a3|d1|d2|d3):\s*"([^"]+)"/g;

const map = new Map(); // word → clue (last seen wins)
let match;
while ((match = wordClueRe.exec(src)) !== null) {
    const word = match[1].toUpperCase().trim();
    const clue = match[2].trim();
    if (!map.has(word)) {
        map.set(word, clue);
    }
}

const entries = Array.from(map.entries())
    .map(([word, clue]) => ({ word, clue }))
    .sort((a, b) => a.word.localeCompare(b.word));

console.log(JSON.stringify(entries, null, 2));
console.error(`\n✓ ${entries.length} unique words extracted`);
