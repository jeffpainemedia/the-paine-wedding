import type { MetadataRoute } from "next";
import { isPageHidden } from "@/lib/page-visibility";
import { SITE_URL } from "@/lib/seo";

const PUBLIC_ROUTES = [
    { path: "/", priority: 1, changeFrequency: "weekly" as const },
    { path: "/our-story", slug: "our-story", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/bridal-party", slug: "bridal-party", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/travel", slug: "travel", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/explore", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/attire", slug: "attire", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/registry", slug: "registry", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/faq", slug: "faq", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/schedule", slug: "schedule", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/wedding-details", slug: "wedding-details", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/rsvp", slug: "rsvp", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/feedback", priority: 0.4, changeFrequency: "monthly" as const },
    { path: "/games", slug: "games", priority: 0.7, changeFrequency: "daily" as const },
    { path: "/games/painedle", slug: "games", priority: 0.6, changeFrequency: "daily" as const },
    { path: "/games/crossword", slug: "games", priority: 0.6, changeFrequency: "daily" as const },
    { path: "/games/connections", slug: "games", priority: 0.6, changeFrequency: "daily" as const },
    { path: "/games/trivia", slug: "games", priority: 0.5, changeFrequency: "weekly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const lastModified = new Date();
    const entries = await Promise.all(
        PUBLIC_ROUTES.map(async (route) => {
            if (route.slug && await isPageHidden(route.slug)) {
                return null;
            }

            return {
                url: route.path === "/" ? SITE_URL : `${SITE_URL}${route.path}`,
                lastModified,
                changeFrequency: route.changeFrequency,
                priority: route.priority,
            };
        })
    );

    return entries.filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}
