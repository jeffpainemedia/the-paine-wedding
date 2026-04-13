import Section from "@/components/ui/Section";
import ConnectionsGate from "@/components/games/ConnectionsGate";
import GameAccountPanel from "@/components/games/GameAccountPanel";
import CollapsibleLeaderboard from "@/components/games/CollapsibleLeaderboard";
import ConnectionsGame from "@/components/games/ConnectionsGame";
import { getCentralDateKey } from "@/lib/games/crossword";
import { getDailyConnectionsPuzzle } from "@/lib/games/connections";
import GameSuggestions from "@/components/games/GameSuggestions";

export const dynamic = "force-dynamic";

export default async function ConnectionsPage() {
    const todayKey = getCentralDateKey();
    const todayPuzzle = getDailyConnectionsPuzzle(todayKey);

    return (
        <div className="bg-[linear-gradient(180deg,#f8f3ec_0%,#eff1f4_34%,#ffffff_100%)]">
            <Section background="surface" className="pb-10 pt-12 text-center md:pb-12 md:pt-16">
                <div className="mb-5 flex items-center justify-center gap-4">
                    <span className="h-px w-12 bg-accent" />
                    <span className="text-xs font-medium uppercase tracking-[0.3em] text-accent">Daily Puzzle</span>
                    <span className="h-px w-12 bg-accent" />
                </div>
                <h1 className="mb-4 font-heading text-5xl text-primary md:text-6xl">Connected</h1>
                <p className="mx-auto max-w-xl text-text-secondary leading-relaxed">
                    Find four groups of four words that share something in common. A new puzzle every day — solve it with the fewest mistakes for the top spot.
                </p>
            </Section>
            <Section className="pb-16 pt-8 md:pb-18 md:pt-10">
                <div className="mb-6">
                    <GameAccountPanel />
                </div>
                <div className="mb-10">
                    <ConnectionsGate>
                        <ConnectionsGame puzzle={todayPuzzle} dateKey={todayKey} />
                    </ConnectionsGate>
                </div>
                <CollapsibleLeaderboard
                    game="connections"
                    title="Connected Leaders"
                    subtitle="Fewest mistakes and fastest times rise to the top."
                    puzzleKey={`connections-${todayPuzzle.id}`}
                />
                <GameSuggestions current="connections" />
            </Section>
        </div>
    );
}
