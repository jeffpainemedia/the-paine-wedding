import React from "react";
import Link from "next/link";
import Section from "@/components/ui/Section";
import AttireTabs from "@/components/ui/AttireTabs";
import { getWeddingData } from "@/lib/site-settings";
import { requirePageVisible } from "@/lib/page-visibility";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
    path: "/attire",
    title: "Attire",
    description: "See the dress code and outfit inspiration for Ashlyn and Jeffrey's semi-formal wedding celebration.",
    keywords: ["dress code", "wedding attire", "semi-formal wedding attire"],
});

export default async function Attire() {
    await requirePageVisible("attire");
    const { wedding, images, overlays } = await getWeddingData();
    const dresscodeReady = wedding.dresscode.short !== "TBD";

    const ladiesImages = images.attire.ladies.map((src, i) => ({
            src,
            fallback: images.attire.ladiesFallbacks[i],
            label: `Ladies Attire ${i + 1}`,
            adminKey: `images.attire.ladies.${i}`,
            overlay: overlays.attireLadies[i],
        }));
    const gentlemenImages = images.attire.gents.map((src, i) => ({
            src,
            fallback: images.attire.gentsFallbacks[i],
            label: `Gentlemen Attire ${i + 1}`,
            adminKey: `images.attire.gents.${i}`,
            overlay: overlays.attireGents[i],
        }));

    return (
        <div>
            <Section background="surface" className="text-center pb-14 pt-12 md:pb-16 md:pt-16">
                <h1 className="font-heading text-5xl md:text-6xl mb-6">Attire</h1>
                <p className="max-w-2xl mx-auto text-text-secondary tracking-wide leading-relaxed">
                    {dresscodeReady
                        ? `We respectfully request ${wedding.dresscode.short.toLowerCase()} attire for our celebration.`
                        : "Dress code details coming soon — we can\u2019t wait to celebrate with you in style."}
                </p>
            </Section>

            <Section background="white" className="pb-14 pt-10 md:pb-18 md:pt-14">
                <div className="mx-auto max-w-6xl">
                    <AttireTabs
                        ladiesText={
                            wedding.dresscode.ladies === "TBD"
                                ? "Dressy cocktail inspiration for the ladies is coming soon."
                                : wedding.dresscode.ladies
                        }
                        gentlemenText={
                            wedding.dresscode.gentlemen === "TBD"
                                ? "Dressy tailored inspiration for the gentlemen is coming soon."
                                : wedding.dresscode.gentlemen
                        }
                        ladiesImages={ladiesImages}
                        gentlemenImages={gentlemenImages}
                        ladiesAdminKey="dresscode.ladies"
                        gentlemenAdminKey="dresscode.gentlemen"
                    />
                </div>
            </Section>

            <Section background="surface" className="pb-6 pt-3 text-center md:pb-8 md:pt-4">
                <p className="text-sm text-text-secondary">
                    Questions about dress code?{" "}
                    <Link href="/faq" className="text-primary underline underline-offset-2">See our FAQ</Link>
                </p>
            </Section>
        </div>
    );
}
