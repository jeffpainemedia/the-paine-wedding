import { NextRequest, NextResponse } from "next/server";
import { evaluateGuess, WORD_LENGTH, type LetterStatus } from "@/lib/games/painedle";
import { getDailyWord } from "@/lib/games/painedle-server";
import { isValidDictionaryGuess } from "@/lib/games/dictionary";

// POST /api/games/painedle/guess
// Validates a single guess against today's word and returns per-letter
// statuses without revealing the solution. The full word list is never sent
// to the browser.
export async function POST(request: NextRequest) {
    let body: { dateKey?: unknown; guess?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    const dateKey = typeof body.dateKey === "string" ? body.dateKey : null;
    const rawGuess = typeof body.guess === "string" ? body.guess.trim().toLowerCase() : "";

    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return NextResponse.json({ error: "dateKey (YYYY-MM-DD) required." }, { status: 400 });
    }
    if (rawGuess.length !== WORD_LENGTH || !/^[a-z]+$/.test(rawGuess)) {
        return NextResponse.json({ error: `guess must be exactly ${WORD_LENGTH} letters.` }, { status: 400 });
    }

    if (!isValidDictionaryGuess(rawGuess)) {
        return NextResponse.json({ valid: false }, {
            status: 200,
            headers: { "Cache-Control": "no-store" },
        });
    }

    const solution = getDailyWord(dateKey);
    const statuses: LetterStatus[] = evaluateGuess(rawGuess, solution);
    const correct = rawGuess === solution;

    return NextResponse.json({ valid: true, statuses, correct }, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
    });
}
