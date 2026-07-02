import React from "react";
import Section from "@/components/ui/Section";
import { ExternalLink } from "lucide-react";
import { getWeddingData } from "@/lib/site-settings";
import { requirePageVisible } from "@/lib/page-visibility";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
    path: "/registry",
    title: "Registry",
    description: "View Ashlyn and Jeffrey's wedding registry and celebrate them with gifts for their home.",
    keywords: ["wedding registry", "Amazon registry", "Target registry"],
});

// Per-brand visual config — keeps the page data-driven while adding personality
const brandConfig: Record<string, {
    underline: string;
    wordmark: string;
    categories: string[];
    tagline: string;
}> = {
    Amazon: {
        underline: "bg-[#FF9900]",
        wordmark: "amazon",
        categories: ["Kitchen", "Bedroom", "Bath", "Entertaining", "Home Decor"],
        tagline: "Our full registry for the home — from everyday essentials to the special touches that make a house feel like ours.",
    },
    Target: {
        underline: "bg-[#CC0000]",
        wordmark: "Target",
        categories: ["Home Essentials", "Kitchen", "Storage", "Bedding"],
        tagline: "Everyday home essentials and quality basics — the kind of things you reach for every single day.",
    },
};

export default async function Registry() {
    await requirePageVisible("registry");
    const { wedding } = await getWeddingData();

    return (
        <div>
            {/* Hero */}
            <Section background="surface" className="text-center pb-14 pt-12 md:pb-16 md:pt-16">
                <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-accent md:text-xs">
                    With Gratitude
                </p>
                <h1 className="font-heading text-4xl md:text-6xl mb-6">Registry</h1>
                <p className="max-w-xl mx-auto text-text-secondary tracking-wide leading-relaxed">
                    Your presence at our wedding is the greatest gift of all. But if you&apos;d like to honor us
                    with something for the home, here&apos;s where we&apos;ve registered.
                </p>
            </Section>

            {/* Registry cards */}
            <Section background="white" className="pb-14 pt-10 md:pb-18 md:pt-14">
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                    {wedding.registry.map((reg, idx) => {
                        const brand = brandConfig[reg.name];
                        const isAmazon = reg.name === "Amazon";

                        return (
                            <a
                                key={idx}
                                href={reg.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col overflow-hidden rounded-[4px] border border-primary/10 bg-white transition-colors duration-300 hover:border-primary/25"
                            >
                                <div className="flex flex-col flex-1 p-8 md:p-9">
                                    {/* Wordmark */}
                                    <div className="mb-5">
                                        {isAmazon ? (
                                            <div>
                                                <span className="font-heading text-[1.85rem] leading-none tracking-tight text-[#232F3E]">
                                                    amazon
                                                </span>
                                                <div className={`mt-2 h-[2px] w-10 ${brand?.underline ?? "bg-primary"}`} />
                                            </div>
                                        ) : reg.name === "Target" ? (
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    {/* Simple bullseye */}
                                                    <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true" fill="none">
                                                        <circle cx="16" cy="16" r="14" stroke="#CC0000" strokeWidth="2.5" />
                                                        <circle cx="16" cy="16" r="8"  stroke="#CC0000" strokeWidth="2.5" />
                                                        <circle cx="16" cy="16" r="3"  fill="#CC0000" />
                                                    </svg>
                                                    <span className="font-heading text-[1.85rem] leading-none tracking-tight text-[#CC0000]">
                                                        Target
                                                    </span>
                                                </div>
                                                <div className={`mt-2 h-[2px] w-10 ${brand?.underline ?? "bg-primary"}`} />
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="font-heading text-2xl text-primary">{reg.name}</span>
                                                <div className="mt-2 h-[2px] w-10 bg-primary" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Tagline */}
                                    <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                        {brand?.tagline ?? reg.description}
                                    </p>

                                    {/* Category list */}
                                    {brand?.categories && brand.categories.length > 0 && (
                                        <div className="mb-8">
                                            <p className="text-xs text-text-secondary/60">
                                                {brand.categories.join(" · ")}
                                            </p>
                                        </div>
                                    )}

                                    {/* Push CTA to bottom */}
                                    <div className="flex-1" />

                                    {/* Footer CTA row */}
                                    <div className="mt-auto pt-6">
                                        <div className="flex w-full items-center justify-center gap-2 rounded-[4px] border border-primary py-3.5 text-sm font-semibold text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white">
                                            Browse {reg.name} Registry
                                            <ExternalLink size={14} strokeWidth={2} />
                                        </div>
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>

            </Section>
        </div>
    );
}
