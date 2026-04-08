export function normalizeNamePart(value: string) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[’'`]/g, "")
        .replace(/[^a-zA-Z0-9\s-]/g, " ")
        .replace(/[-\s]+/g, " ")
        .trim()
        .toLowerCase();
}

export function compactNamePart(value: string) {
    return normalizeNamePart(value).replace(/\s+/g, "");
}

function levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= m; i += 1) {
        for (let j = 1; j <= n; j += 1) {
            dp[i][j] =
                a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

export function nameSimilarity(input: string, candidate: string): number {
    const a = compactNamePart(input);
    const b = compactNamePart(candidate);
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (b.startsWith(a) || a.startsWith(b)) return 0.92;
    if (a.length >= 3 && b.includes(a)) return 0.82;
    const dist = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : 1 - dist / maxLen;
}
