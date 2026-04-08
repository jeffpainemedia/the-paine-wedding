import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "The Paine Wedding",
        short_name: "Paine Wedding",
        description: "Wedding website for Ashlyn Bimmerle and Jeffrey Paine.",
        start_url: "/",
        display: "standalone",
        background_color: "#f5f1eb",
        theme_color: "#163865",
        icons: [
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
            },
            {
                src: "/apple-icon",
                sizes: "180x180",
                type: "image/png",
            },
        ],
    };
}

