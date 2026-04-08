import type { Metadata } from "next";

export const SITE_URL = "https://www.thepainewedding.com";
export const SITE_NAME = "The Paine Wedding";
export const DEFAULT_OG_IMAGE = "/opengraph-image";

const DEFAULT_KEYWORDS = [
    "Ashlyn Bimmerle",
    "Jeff Paine",
    "Jeffrey Paine",
    "Ashlyn and Jeffrey wedding",
    "The Paine Wedding",
    "thepainewedding",
    "Davis & Grey Farms wedding",
    "Celeste Texas wedding",
    "September 26 2026 wedding",
];

type PageMetadataOptions = {
    path: string;
    description: string;
    title?: string;
    absoluteTitle?: string;
    keywords?: string[];
};

export function buildPageMetadata({
    path,
    description,
    title,
    absoluteTitle,
    keywords = [],
}: PageMetadataOptions): Metadata {
    const canonical = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
    const resolvedTitle = absoluteTitle ?? title ?? SITE_NAME;

    return {
        title: absoluteTitle ? { absolute: absoluteTitle } : title,
        description,
        keywords: [...DEFAULT_KEYWORDS, ...keywords],
        alternates: {
            canonical,
        },
        openGraph: {
            type: "website",
            url: canonical,
            siteName: SITE_NAME,
            title: resolvedTitle,
            description,
            images: [
                {
                    url: DEFAULT_OG_IMAGE,
                    width: 1200,
                    height: 630,
                    alt: "Ashlyn and Jeffrey wedding website preview",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: resolvedTitle,
            description,
            images: [DEFAULT_OG_IMAGE],
        },
    };
}

