#!/usr/bin/env node

import { readFileSync } from "node:fs";
import vm from "node:vm";

function extractObjectKeys(source, objectName) {
  const match = source.match(new RegExp(`const ${objectName} = \\{([\\s\\S]*?)\\n\\};`));
  if (!match) {
    throw new Error(`Could not find object ${objectName}`);
  }
  return [...match[1].matchAll(/([A-Z]+):/g)].map((m) => m[1]);
}

function extractSetValues(source, setName) {
  const match = source.match(new RegExp(`const ${setName} = new Set\\(\\[([\\s\\S]*?)\\n\\]\\);`));
  if (!match) {
    throw new Error(`Could not find set ${setName}`);
  }
  return [...match[1].matchAll(/'([A-Z]+)'/g)].map((m) => m[1]);
}

function extractArrayValues(source, arrayName) {
  const match = source.match(new RegExp(`const ${arrayName} = \\[([\\s\\S]*?)\\n\\];`));
  if (!match) {
    throw new Error(`Could not find array ${arrayName}`);
  }
  return [...match[1].matchAll(/'([A-Z]+)'/g)].map((m) => m[1]);
}

function extractDeleteArrays(source) {
  const arrays = [];
  const regex = /for \(const word of (\[[\s\S]*?\])\) \{\s*BLOCKED_WORDS\.delete\(word\);\s*\}/g;
  for (const match of source.matchAll(regex)) {
    arrays.push(...JSON.parse(match[1]));
  }
  return arrays;
}

function extractRawPuzzles(source) {
  const match = source.match(/const RAW_PUZZLES: RawPuzzleData\[] = (\[[\s\S]*?\n\]);/);
  if (!match) {
    throw new Error("Could not find RAW_PUZZLES");
  }
  return vm.runInNewContext(match[1]);
}

function checkIntersections(puzzle) {
  const grid = new Map();
  const mismatches = [];

  for (const entry of puzzle.words) {
    for (let i = 0; i < entry.word.length; i++) {
      const row = entry.row + (entry.dir === "D" ? i : 0);
      const col = entry.col + (entry.dir === "A" ? i : 0);
      const key = `${row}:${col}`;
      const letter = entry.word[i];
      const current = grid.get(key);
      if (current && current !== letter) {
        mismatches.push({ key, current, letter, word: entry.word });
      } else {
        grid.set(key, letter);
      }
    }
  }

  return mismatches;
}

const generatorSource = readFileSync("scripts/generate-crosswords.mjs", "utf8");
const crosswordSource = readFileSync("src/lib/games/crossword.ts", "utf8");

const explicitClueWords = new Set([
  ...extractObjectKeys(generatorSource, "WORD_CLUES"),
  ...extractObjectKeys(generatorSource, "FILL_CLUES"),
  ...extractObjectKeys(generatorSource, "EXTRA_FILL"),
]);

const blockedWords = new Set([
  ...extractSetValues(generatorSource, "BLOCKED_WORDS"),
  ...extractArrayValues(generatorSource, "AUTO_BLOCKED_WORDS"),
]);
for (const word of extractDeleteArrays(generatorSource)) {
  blockedWords.delete(word);
}
const rawPuzzles = extractRawPuzzles(crosswordSource);

const genericCluePattern = /dictionary word|English word|Four-letter word|Short word|Brief term/i;
const issues = {
  genericClues: [],
  uncuedWords: [],
  blockedWords: [],
  intersectionMismatches: [],
  wrongEntryCount: [],
};

for (const puzzle of rawPuzzles) {
  if (!puzzle || !Array.isArray(puzzle.words)) continue;

  if (puzzle.words.length !== 10) {
    issues.wrongEntryCount.push({ id: puzzle.id, count: puzzle.words.length });
  }

  for (const entry of puzzle.words) {
    if (genericCluePattern.test(entry.clue)) {
      issues.genericClues.push({ id: puzzle.id, word: entry.word, clue: entry.clue });
    }
    if (!explicitClueWords.has(entry.word)) {
      issues.uncuedWords.push({ id: puzzle.id, word: entry.word, clue: entry.clue });
    }
    if (blockedWords.has(entry.word)) {
      issues.blockedWords.push({ id: puzzle.id, word: entry.word, clue: entry.clue });
    }
  }

  const mismatches = checkIntersections(puzzle);
  if (mismatches.length) {
    issues.intersectionMismatches.push({ id: puzzle.id, mismatches });
  }
}

const summary = {
  puzzleCount: rawPuzzles.length,
  explicitClueWords: explicitClueWords.size,
  blockedWordCount: blockedWords.size,
  genericClues: issues.genericClues.length,
  uncuedWords: issues.uncuedWords.length,
  blockedWordHits: issues.blockedWords.length,
  intersectionMismatchPuzzles: issues.intersectionMismatches.length,
  wrongEntryCountPuzzles: issues.wrongEntryCount.length,
};

console.log(JSON.stringify(summary, null, 2));

const hasIssues = Object.values(issues).some((arr) => arr.length > 0);
if (hasIssues) {
  console.log("\nSample issues:");
  for (const [key, arr] of Object.entries(issues)) {
    if (arr.length > 0) {
      console.log(`- ${key}:`);
      console.log(JSON.stringify(arr.slice(0, 10), null, 2));
    }
  }
  process.exit(1);
}
