import { requirePageVisible } from "@/lib/page-visibility";
import RSVPPageClient from "./RSVPPageClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
    path: "/rsvp",
    title: "RSVP",
    description: "RSVP for Ashlyn and Jeffrey's wedding, confirm who is attending, and share any guest details we should know.",
    keywords: ["RSVP", "wedding RSVP", "guest RSVP"],
});

export default async function RSVPPage() {
    await requirePageVisible("rsvp");
    return <RSVPPageClient />;
}
