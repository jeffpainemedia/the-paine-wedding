import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
    path: "/games/painedle",
    title: "Painedle",
    description: "Play Painedle, the daily word game inspired by Ashlyn and Jeffrey's story.",
    keywords: ["Painedle", "daily word game", "wedding word game"],
});

export default function PainedleLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}

