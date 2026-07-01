#!/usr/bin/env node
/**
 * Removes puzzle entries from RAW_PUZZLES that contain any word on the
 * wedding-inappropriate blocklist. Rotation auto-reindexes to the remaining
 * puzzles.
 *
 * Run: node scripts/remove-banned-puzzles.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, "..", "src/lib/games/crossword.ts");

const BANNED = [
    "RAPE", "STAB", "EVIL", "ROT", "DECAY", "DEAD", "WIDOW",
    "BUST", "PEE", "SCAR", "SORE",
];

const src = fs.readFileSync(FILE, "utf8");

// Match a puzzle block: leading comment + puzzle object + trailing comma + newline
const blockRe = /  \/\/ p\d+ — [^\n]+\n  \{ id: "p\d+", rows: \d+, cols: \d+, words: \[\n(?:    \{ word: "[A-Z]+", clue: "[^"]+", row: \d+, col: \d+, dir: "[AD]" \},\n)+  \] \},\n/g;

const removedIds = [];
let kept = 0;

const updated = src.replace(blockRe, (match) => {
    for (const banned of BANNED) {
        if (match.includes(`word: "${banned}"`)) {
            const idMatch = match.match(/id: "(p\d+)"/);
            if (idMatch) removedIds.push(idMatch[1]);
            return "";
        }
    }
    kept++;
    return match;
});

if (removedIds.length === 0) {
    console.log("No banned-word puzzles found — nothing to remove.");
    process.exit(0);
}

// Update the header comment that states the puzzle count
const newCount = kept;
const out = updated
    .replace(/\/\/ \d+ daily puzzles — /g, `// ${newCount} daily puzzles — `)
    .replace(/\/\/ AUTO-GENERATED — \d+\/\d+ puzzles,/g, `// AUTO-GENERATED — ${newCount}/${newCount} puzzles,`);

fs.writeFileSync(FILE, out);

console.log(`Removed ${removedIds.length} puzzle(s): ${removedIds.join(", ")}`);
console.log(`Remaining pool: ${kept} puzzles.`);
