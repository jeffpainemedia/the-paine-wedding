#!/usr/bin/env node
// scripts/preview-crosswords.mjs
// Prints crossword puzzles as ASCII art so you can preview them in the terminal.
// Usage:
//   node scripts/preview-crosswords.mjs            # First 5 puzzles
//   node scripts/preview-crosswords.mjs 10         # First 10 puzzles
//   node scripts/preview-crosswords.mjs p023       # Specific puzzle by id
//   node scripts/preview-crosswords.mjs 50 60      # Range (inclusive)

import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync("src/lib/games/crossword.ts", "utf8");
const match = source.match(/const RAW_PUZZLES: RawPuzzleData\[] = (\[[\s\S]*?\n\]);/);
if (!match) {
  console.error("Could not find RAW_PUZZLES in crossword.ts");
  process.exit(1);
}
const puzzles = vm.runInNewContext(match[1]);

function renderPuzzle(puzzle) {
  const { id, rows, cols, words } = puzzle;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  let ok = true;
  const mismatches = [];

  for (const w of words) {
    for (let i = 0; i < w.word.length; i++) {
      const r = w.row + (w.dir === "D" ? i : 0);
      const c = w.col + (w.dir === "A" ? i : 0);
      const letter = w.word[i];
      if (grid[r]?.[c] && grid[r][c] !== letter) {
        ok = false;
        mismatches.push(`  (${r},${c}): was ${grid[r][c]}, ${w.word} wants ${letter}`);
      } else if (grid[r]) {
        grid[r][c] = letter;
      }
    }
  }

  const across = words.filter(w => w.dir === "A");
  const down = words.filter(w => w.dir === "D");

  console.log(`\n╔════════════ ${id} ${ok ? "✓" : "✗ INTERSECTION ERRORS"} ════════════╗`);
  for (let r = 0; r < rows; r++) {
    let line = "║ ";
    for (let c = 0; c < cols; c++) {
      line += (grid[r][c] ?? "■") + " ";
    }
    line += "║";
    console.log(line);
  }
  console.log("╚═════════════════════════════════╝");

  if (!ok) {
    console.log("  MISMATCHES:");
    mismatches.forEach(m => console.log(m));
  }

  console.log("  ACROSS:");
  across.forEach(w => console.log(`    ${w.word.padEnd(6)} — ${w.clue}`));
  console.log("  DOWN:");
  down.forEach(w => console.log(`    ${w.word.padEnd(6)} — ${w.clue}`));
}

const args = process.argv.slice(2);
let selection = puzzles.slice(0, 5);

if (args.length === 1) {
  if (args[0].startsWith("p")) {
    selection = puzzles.filter(p => p.id === args[0]);
  } else {
    selection = puzzles.slice(0, parseInt(args[0], 10));
  }
} else if (args.length === 2) {
  const [from, to] = args.map(n => parseInt(n, 10));
  selection = puzzles.slice(from - 1, to);
}

console.log(`Showing ${selection.length} puzzle(s) out of ${puzzles.length} total.\n`);

let validCount = 0;
for (const p of selection) {
  renderPuzzle(p);
  const grid = Array.from({ length: p.rows }, () => Array(p.cols).fill(null));
  let ok = true;
  for (const w of p.words) {
    for (let i = 0; i < w.word.length; i++) {
      const r = w.row + (w.dir === "D" ? i : 0);
      const c = w.col + (w.dir === "A" ? i : 0);
      if (grid[r]?.[c] && grid[r][c] !== w.word[i]) ok = false;
      else if (grid[r]) grid[r][c] = w.word[i];
    }
  }
  if (ok) validCount++;
}

console.log(`\nSummary: ${validCount}/${selection.length} puzzles render cleanly.`);
