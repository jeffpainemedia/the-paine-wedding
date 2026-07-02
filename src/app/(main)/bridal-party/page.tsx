import React from "react";
import Section from "@/components/ui/Section";
import { PersonPortrait } from "@/components/ui/PersonPortrait";
import { getWeddingData } from "@/lib/site-settings";
import { requirePageVisible } from "@/lib/page-visibility";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
    path: "/bridal-party",
    title: "Bridal Party",
    description: "Meet the friends and family standing with Ashlyn and Jeff on their wedding day.",
    keywords: ["bridal party", "bridesmaids", "groomsmen"],
});

export default async function BridalParty() {
    await requirePageVisible("bridal-party");
    const { wedding } = await getWeddingData();
    const { bridesmaids, groomsmen } = wedding.bridalParty;
    const hasParty = bridesmaids.length > 0 || groomsmen.length > 0;

    const fallback =
        "/images/hero/JeffAshlyn-7977_2.jpg";

    return (
        <div>
            <Section background="surface" className="text-center pb-14 pt-12 md:pb-16 md:pt-16">
                <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-accent md:text-xs">
                    Our People
                </p>
                <h1 className="font-heading text-4xl md:text-6xl mb-6">Bridal Party</h1>
                <p className="max-w-xl mx-auto text-text-secondary tracking-wide">
                    The friends and family standing by our side on our special day.
                </p>
            </Section>

            <Section background="surface" className="pb-14 pt-16 md:pb-16 md:pt-20">
                {!hasParty ? (
                    <div className="max-w-xl mx-auto text-center py-20 space-y-5">
                        <div className="w-16 h-px bg-primary/30 mx-auto" />
                        <h2 className="font-heading text-3xl text-primary">Coming Soon</h2>
                        <p className="text-text-secondary leading-relaxed">
                            We can&apos;t wait to introduce you to the incredible people standing by our
                            side. Check back as we get closer to the date!
                        </p>
                        <div className="w-16 h-px bg-primary/30 mx-auto" />
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto space-y-24 md:space-y-28">
                        {bridesmaids.length > 0 && (
                            <div>
                                <h2 className="font-heading text-4xl text-center mb-16 text-primary">
                                    The Ladies
                                </h2>
                                <div className="flex flex-wrap justify-center gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-12">
                                    {bridesmaids.map((person, idx) => (
                                        <div
                                            key={idx}
                                            className={`${bridesmaids.length > 3
                                                ? "w-[calc(50%-0.5rem)] md:w-[calc(25%-1.5rem)]"
                                                : "w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1.333rem)]"
                                                }`}
                                        >
                                            <PersonPortrait
                                                src={person.image}
                                                fallback={fallback}
                                                name={person.name}
                                                role={person.role}
                                                relationship={person.relationship}
                                                adminKey={`bridal-party.bridesmaids.${idx}.image`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {groomsmen.length > 0 && (
                            <div>
                                <h2 className="font-heading text-4xl text-center mb-16 text-primary">
                                    The Gentlemen
                                </h2>
                                <div className="flex flex-wrap justify-center gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-12">
                                    {groomsmen.map((person, idx) => (
                                        <div
                                            key={idx}
                                            className={`${groomsmen.length > 3
                                                ? "w-[calc(50%-0.5rem)] md:w-[calc(25%-1.5rem)]"
                                                : "w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1.333rem)]"
                                                }`}
                                        >
                                            <PersonPortrait
                                                src={person.image}
                                                fallback={fallback}
                                                name={person.name}
                                                role={person.role}
                                                relationship={person.relationship}
                                                adminKey={`bridal-party.groomsmen.${idx}.image`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Section>
        </div>
    );
}
