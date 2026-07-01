#!/usr/bin/env node
/**
 * Validates src/lib/games/crossword.ts before build.
 * Fails the build if:
 *   - any clue matches the placeholder pattern ("N letters" / "N letter")
 *   - any clue is empty
 *   - any word appears on the wedding-inappropriate blocklist
 *
 * Run: node scripts/validate-crosswords.mjs
 * Wired into the build via package.json "prebuild".
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Puzzle data lives in crossword-data.ts (server-only). The validator
// scans the data file for entries with placeholder clues / blocked words.
const FILE = path.resolve(__dirname, "..", "src/lib/games/crossword-data.ts");

// Words that must never appear in any puzzle. Expand as needed.
const BLOCKLIST = new Set([
    // Violence / morbid
    "RAPE", "STAB", "KILL", "MURDER", "DEAD", "DIE", "DIES", "DIED", "DYING",
    "DEATH", "CORPSE", "BLOOD", "BLEED", "WOUND", "STAB", "SHOT", "SHOOT",
    "DECAY", "ROT", "ROTS", "ROTTING", "EVIL", "SATAN", "DEMON", "HELL",
    "CURSE", "CURSED",
    // Wedding-inappropriate associations
    "WIDOW", "WIDOWER", "ORPHAN", "DIVORCE", "DIVORCED", "AFFAIR",
    // Crude / body-part jokes
    "BUST", "BUSTS", "PEE", "POOP", "FART", "BOOB", "TIT", "BUTT",
    "SCAR", "SORE",
    // Slurs and vulgarity — obvious-but-necessary safety net
    "FUCK", "SHIT", "CUNT", "TWAT", "DICK", "COCK", "PISS", "ASS",
    "SLUT", "WHORE", "BITCH", "HOE",
]);

const PLACEHOLDER_RE = /^\d+ letters?$/i;

const src = fs.readFileSync(FILE, "utf8");
const entryRe = /\{ word: "([A-Z]+)", clue: "([^"]*)", row: \d+, col: \d+, dir: "[AD]" \}/g;

const errors = [];
let totalEntries = 0;
let m;

while ((m = entryRe.exec(src))) {
    totalEntries++;
    const [, word, clue] = m;

    // Find puzzle ID for this entry by scanning backwards for the nearest "id:"
    const upToHere = src.slice(0, m.index);
    const idMatch = upToHere.match(/id: "(p\d+)"[^}]*$/);
    const puzzleId = idMatch ? idMatch[1] : "?";

    if (BLOCKLIST.has(word)) {
        errors.push(`[${puzzleId}] blocked word: "${word}"`);
    }
    if (!clue.trim()) {
        errors.push(`[${puzzleId}] empty clue for "${word}"`);
    }
    if (PLACEHOLDER_RE.test(clue.trim())) {
        errors.push(`[${puzzleId}] placeholder clue for "${word}": "${clue}"`);
    }
    if (clue.trim().toUpperCase() === word) {
        errors.push(`[${puzzleId}] clue is the word itself: "${word}"`);
    }
}

if (errors.length > 0) {
    console.error(`\n✖ Crossword validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"} across ${totalEntries} entries):\n`);
    for (const err of errors) console.error(`  ${err}`);
    console.error("\nFix these in src/lib/games/crossword.ts or update the blocklist in scripts/validate-crosswords.mjs.\n");
    process.exit(1);
}

console.log(`✓ Crossword validation passed (${totalEntries} entries checked).`);
