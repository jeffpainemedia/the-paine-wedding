import Section from "@/components/ui/Section";
import CoupleTriviaGame from "@/components/games/CoupleTriviaGame";
import GameAccountPanel from "@/components/games/GameAccountPanel";
import TriviaGate from "@/components/games/TriviaGate";
import TriviaLeaderboardGate from "@/components/games/TriviaLeaderboardGate";
import CollapsibleLeaderboard from "@/components/games/CollapsibleLeaderboard";
import GameSuggestions from "@/components/games/GameSuggestions";

export default function TriviaPage() {
    return (
        <div className="bg-[linear-gradient(180deg,#f7f2eb_0%,#f5f3ef_40%,#ffffff_100%)]">
            <Section background="surface" className="pb-10 pt-12 text-center md:pb-12 md:pt-16">
                <div className="mb-5 flex items-center justify-center gap-4">
                    <span className="h-px w-12 bg-accent" />
                    <span className="text-xs font-medium uppercase tracking-[0.3em] text-accent">Wedding Day Game</span>
                    <span className="h-px w-12 bg-accent" />
                </div>
                <h1 className="mb-4 font-heading text-5xl text-primary md:text-6xl">Trivia</h1>
                <p className="mx-auto max-w-xl text-text-secondary leading-relaxed">
                    How well do you know Ashlyn & Jeffrey? Test your knowledge when trivia unlocks on the wedding day.
                </p>
            </Section>
            <Section className="pb-16 pt-8 md:pt-10 md:pb-18">
                <div className="mb-6">
                    <GameAccountPanel />
                </div>
                <div className="mb-10">
                    <TriviaGate>
                        <CoupleTriviaGame />
                    </TriviaGate>
                </div>
                <TriviaLeaderboardGate>
                    <CollapsibleLeaderboard
                        game="trivia"
                        title="Trivia Leaders"
                        subtitle="Highest scores rise to the top once trivia opens on wedding day."
                        puzzleKey="wedding-day-trivia"
                    />
                </TriviaLeaderboardGate>
                <GameSuggestions current="trivia" />
            </Section>
        </div>
    );
}
