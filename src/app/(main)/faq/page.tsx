import React from "react";
import Section from "@/components/ui/Section";
import { getWeddingData } from "@/lib/site-settings";
import { requirePageVisible } from "@/lib/page-visibility";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
    path: "/faq",
    title: "FAQ",
    description: "Read frequently asked questions about the wedding day, RSVP timing, venue details, and guest logistics.",
    keywords: ["wedding FAQ", "guest questions", "RSVP questions"],
});

export default async function FAQ() {
    await requirePageVisible("faq");
    const { wedding } = await getWeddingData();
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: wedding.faq
            .filter((faq) => faq.q !== "TBD" && faq.a !== "TBD")
            .map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: faq.a,
                },
            })),
    };

    return (
        <div>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <Section background="surface" className="text-center pb-14 pt-12 md:pb-16 md:pt-16">
                <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-accent md:text-xs">
                    Questions
                </p>
                <h1 className="font-heading text-4xl md:text-5xl mb-6">F.A.Q.</h1>
                <p className="max-w-xl mx-auto text-text-secondary tracking-wide">
                    Some common questions regarding our wedding day.
                </p>
            </Section>

            <Section background="surface" spacing="tight">
                <div className="max-w-3xl mx-auto space-y-8">
                    {wedding.faq.map((faq, idx) => (
                        <div key={idx} className="surface-panel rounded-[4px] border-primary/10 p-6 shadow-none md:p-10">
                            <h3
                                className="font-heading text-2xl text-primary mb-4"
                                data-admin-key={`faq.${idx}.q`}
                                data-admin-type="text"
                                data-admin-current-text={faq.q}
                                data-admin-label={`FAQ #${idx + 1} — Question`}
                            >
                                {faq.q}
                            </h3>
                            <p
                                className="text-text-secondary leading-relaxed"
                                data-admin-key={`faq.${idx}.a`}
                                data-admin-type="rich-text"
                                data-admin-current-text={faq.a === "TBD" ? "Details coming soon — check back as we get closer to the date!" : faq.a}
                                data-admin-label={`FAQ #${idx + 1} — Answer`}
                            >
                                {faq.a === "TBD" ? "Details coming soon — check back as we get closer to the date!" : faq.a}
                            </p>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    );
}
