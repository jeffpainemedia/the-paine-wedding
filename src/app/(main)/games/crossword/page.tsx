import Section from "@/components/ui/Section";
import CrosswordGate from "@/components/games/CrosswordGate";
import GameAccountPanel from "@/components/games/GameAccountPanel";
import CollapsibleLeaderboard from "@/components/games/CollapsibleLeaderboard";
import MiniCrosswordGame from "@/components/games/MiniCrosswordGame";
import { getCentralDateKey, getDailyCrosswordPuzzle, parseCrosswordOverrides, toPublicCrossword } from "@/lib/games/crossword";
import GameSuggestions from "@/components/games/GameSuggestions";
import { getSettingsMap } from "@/lib/site-settings";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
    path: "/games/crossword",
    title: "Crossing Paths",
    description: "Play the daily mini crossword built around Ashlyn and Jeffrey, with fresh clues and leaderboard competition.",
    keywords: ["mini crossword", "daily crossword", "wedding crossword"],
});


export default async function CrosswordPage() {
    const todayKey = getCentralDateKey();
    const settingsMap = await getSettingsMap();
    const overrides = parseCrosswordOverrides(settingsMap["games.crossword.overrides"]);
    // Strip the answer key before sending to the client. Validation flows
    // through /api/games/crossword/check.
    const todayPuzzle = toPublicCrossword(getDailyCrosswordPuzzle(todayKey, overrides));

    return (
        <div className="bg-[linear-gradient(180deg,#f8f3ec_0%,#eff1f4_34%,#ffffff_100%)]">
            <Section background="surface" className="pb-10 pt-12 text-center md:pb-12 md:pt-16">
                <div className="mb-5 flex items-center justify-center gap-4">
                    <span className="h-px w-12 bg-accent" />
                    <span className="text-xs font-medium uppercase tracking-[0.3em] text-accent">Daily Puzzle</span>
                    <span className="h-px w-12 bg-accent" />
                </div>
                <h1 className="mb-4 font-heading text-5xl text-primary md:text-6xl">Crossing Paths</h1>
                <p className="mx-auto max-w-xl text-text-secondary leading-relaxed">
                    Ten clues built around Ashlyn & Jeffrey. A fresh puzzle every day — solve it fast for the top spot.
                </p>
            </Section>
            <Section className="pb-16 pt-8 md:pb-18 md:pt-10">
                <div className="mb-6">
                    <GameAccountPanel />
                </div>
                <div className="mb-10">
                    <CrosswordGate>
                        <MiniCrosswordGame puzzle={todayPuzzle} dateKey={todayKey} />
                    </CrosswordGate>
                </div>
                <CollapsibleLeaderboard
                    game="crossword"
                    title="Crossword Leaders"
                    subtitle="Fastest solves rise to the top."
                    puzzleKey={todayPuzzle.id}
                />
                <GameSuggestions current="crossword" />
            </Section>
        </div>
    );
}
