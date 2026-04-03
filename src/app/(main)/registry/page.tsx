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
    gradientBar: string;
    pillBg: string;
    pillText: string;
    pillBorder: string;
    ctaText: string;
    wordmark: string;
    categories: string[];
    tagline: string;
}> = {
    Amazon: {
        gradientBar: "from-[#FF9900] to-[#FFB830]",
        pillBg: "bg-[#FFF8ED]",
        pillText: "text-[#9A5C00]",
        pillBorder: "border-[#FFD580]/50",
        ctaText: "text-[#B86A00]",
        wordmark: "amazon",
        categories: ["Kitchen", "Bedroom", "Bath", "Entertaining", "Home Decor"],
        tagline: "Our full registry for the home — from everyday essentials to the special touches that make a house feel like ours.",
    },
    Target: {
        gradientBar: "from-[#CC0000] to-[#E53935]",
        pillBg: "bg-[#FFF0F0]",
        pillText: "text-[#990000]",
        pillBorder: "border-[#FFCDD2]/60",
        ctaText: "text-[#CC0000]",
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
                <h1 className="font-heading text-5xl md:text-6xl mb-6">Registry</h1>
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
                                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.11)]"
                            >
                                {/* Brand color top bar */}
                                {brand && (
                                    <div className={`h-[5px] w-full bg-gradient-to-r ${brand.gradientBar}`} />
                                )}

                                <div className="flex flex-col flex-1 p-8 md:p-9">
                                    {/* Wordmark */}
                                    <div className="mb-5">
                                        {isAmazon ? (
                                            <div>
                                                <span className="font-heading text-[1.85rem] leading-none tracking-tight text-[#232F3E]">
                                                    amazon
                                                </span>
                                                <div className="mt-1.5 h-[3px] w-10 rounded-full bg-[#FF9900]" />
                                            </div>
                                        ) : reg.name === "Target" ? (
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
                                        ) : (
                                            <span className="font-heading text-2xl text-primary">{reg.name}</span>
                                        )}
                                    </div>

                                    {/* Tagline */}
                                    <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                        {brand?.tagline ?? reg.description}
                                    </p>

                                    {/* Category pills */}
                                    {brand?.categories && brand.categories.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-8">
                                            {brand.categories.map((cat) => (
                                                <span
                                                    key={cat}
                                                    className={`rounded-full border px-3 py-1 text-xs font-medium ${brand.pillBg} ${brand.pillText} ${brand.pillBorder}`}
                                                >
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Push CTA to bottom */}
                                    <div className="flex-1" />

                                    {/* Footer CTA row */}
                                    <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                                        <span className="text-xs uppercase tracking-[0.18em] text-text-secondary/55 font-medium">
                                            View Registry
                                        </span>
                                        <span className={`flex items-center gap-1.5 text-sm font-semibold transition-transform duration-200 group-hover:translate-x-0.5 ${brand?.ctaText ?? "text-primary"}`}>
                                            Browse <ExternalLink size={13} strokeWidth={2} />
                                        </span>
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
