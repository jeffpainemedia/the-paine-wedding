import React from "react";
import Section from "@/components/ui/Section";
import StoryItem from "@/components/ui/StoryItem";
import { getWeddingData } from "@/lib/site-settings";
import { requirePageVisible } from "@/lib/page-visibility";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
    path: "/our-story",
    title: "Our Story",
    description: "Read Ashlyn and Jeffrey's story, from how they met to the moments that led to their wedding day.",
    keywords: ["our story", "how they met", "Ashlyn and Jeffrey story"],
});

export default async function OurStory() {
    await requirePageVisible("our-story");
    const { wedding, content } = await getWeddingData();

    return (
        <div>
            {/* Page header */}
            <Section background="surface" className="text-center pb-10 pt-12 md:pb-12 md:pt-16">
                <div className="flex items-center justify-center gap-4 mb-5">
                    <span className="h-px w-12 bg-accent" />
                    <span className="uppercase tracking-[0.3em] text-xs text-accent font-medium">
                        Our Story
                    </span>
                    <span className="h-px w-12 bg-accent" />
                </div>
                <h1 className="font-heading text-5xl md:text-7xl mb-6 text-primary">
                    {wedding.couple.names}
                </h1>
                <p
                    className="max-w-xl mx-auto text-text-secondary leading-relaxed"
                    data-admin-key="story.subtitle"
                    data-admin-type="rich-text"
                    data-admin-current-text={content.storySubtitle}
                    data-admin-label="Story Page Subtitle"
                >
                    {content.storySubtitle}
                </p>
            </Section>

            {/* Thin rule */}
            <div className="flex items-center justify-center mb-16 px-6">
                <span className="h-px flex-1 max-w-xs bg-surface" />
                <span className="mx-4 text-secondary text-xs">&#10022;</span>
                <span className="h-px flex-1 max-w-xs bg-surface" />
            </div>

            {/* Timeline items — each item has inline edit attributes */}
            <div className="max-w-6xl mx-auto px-6 pb-20 md:pb-24 space-y-24 md:space-y-28">
                {wedding.story.map((item, index) => (
                    <div key={item.title} className="relative">
                        {/* Image target for edit mode */}
                        <StoryItem
                            item={item}
                            index={index}
                            adminImageKey={`story.item.${index}.image`}
                            adminTitleKey={`story.item.${index}.title`}
                            adminDescKey={`story.item.${index}.description`}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
