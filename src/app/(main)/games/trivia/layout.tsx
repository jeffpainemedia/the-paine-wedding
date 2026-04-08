import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
    path: "/games/trivia",
    title: "Couple Trivia",
    description: "Test how well you know Ashlyn and Jeffrey with wedding-day couple trivia.",
    keywords: ["wedding trivia", "couple trivia", "wedding day game"],
});

export default function TriviaLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}

