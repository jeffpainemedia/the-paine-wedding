import Section from "@/components/ui/Section";
import GamesHubClient from "@/components/games/GamesHubClient";
import { requirePageVisible } from "@/lib/page-visibility";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
    path: "/games",
    title: "Paine Games",
    description: "Play Painedle, the mini crossword, and couple trivia on Ashlyn and Jeffrey's wedding website.",
    keywords: ["Painedle", "wedding games", "mini crossword", "couple trivia"],
});

export default async function GamesPage() {
    await requirePageVisible("games");
    return (
        <div className="bg-[linear-gradient(180deg,#fbf7f1_0%,#f4f1eb_30%,#ffffff_100%)]">
            <Section background="surface" className="text-center pb-14 pt-12 md:pb-16 md:pt-16">
                <h1 className="font-heading text-5xl md:text-6xl mb-6">Paine Games</h1>
                <p className="max-w-2xl mx-auto text-text-secondary tracking-wide leading-relaxed">
                    A little fun before the big day — test your knowledge, solve the puzzle, and see how well you know the happy couple.
                </p>
            </Section>
            <Section className="pb-10 pt-8 md:pb-12 md:pt-10">
                <GamesHubClient />
            </Section>
        </div>
    );
}
