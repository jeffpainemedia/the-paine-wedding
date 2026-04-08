import { requirePageVisible } from "@/lib/page-visibility";

export default async function GamesLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    await requirePageVisible("games");
    return children;
}
