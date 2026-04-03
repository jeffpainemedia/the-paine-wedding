import React from "react";
import Section from "@/components/ui/Section";
import ScheduleTimelineItem from "@/components/ui/ScheduleTimelineItem";
import { getWeddingData } from "@/lib/site-settings";
import { requirePageVisible } from "@/lib/page-visibility";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
    path: "/schedule",
    title: "Schedule of Events",
    description: "See the full timeline for Ashlyn and Jeffrey's wedding day, from guest arrival through the send-off.",
    keywords: ["wedding schedule", "wedding timeline", "ceremony time", "reception time"],
});

export default async function Schedule() {
    await requirePageVisible("schedule");
    const { wedding } = await getWeddingData();
    const hasSchedule = wedding.schedule.length > 0;

    return (
        <div>
            <Section background="surface" className="text-center pb-14 pt-12 md:pb-16 md:pt-16">
                <h1 className="font-heading text-5xl md:text-6xl mb-6">Schedule of Events</h1>
                <p className="max-w-xl mx-auto text-text-secondary tracking-wide">
                    A timeline of our wedding day. We can&apos;t wait to share these moments with you.
                </p>
            </Section>

            <Section background="surface" className="py-24">
                <div className="max-w-3xl mx-auto">
                    {hasSchedule ? (
                        <div className="relative border-l border-primary/20 pl-8 ml-4 md:pl-12 md:ml-12 space-y-16">
                            {wedding.schedule.map((item, index) => (
                                <ScheduleTimelineItem key={index}>
                                    <div className="relative">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[41px] md:-left-[57px] top-1.5 w-4 h-4 rounded-full bg-primary ring-4 ring-surface" />

                                        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2">
                                            <h2
                                                className="font-heading text-2xl text-primary"
                                                data-admin-key={`schedule.${index}.title`}
                                                data-admin-type="text"
                                                data-admin-current-text={item.title}
                                                data-admin-label={`Schedule #${index + 1} — Title`}
                                            >
                                                {item.title}
                                            </h2>
                                            <span
                                                className="text-sm font-medium tracking-[0.2em] text-accent mt-2 md:mt-0 uppercase"
                                                data-admin-key={`schedule.${index}.time`}
                                                data-admin-type="text"
                                                data-admin-current-text={item.time}
                                                data-admin-label={`Schedule #${index + 1} — Time`}
                                            >
                                                {item.time}
                                            </span>
                                        </div>
                                        <p
                                            className="text-text-secondary leading-relaxed"
                                            data-admin-key={`schedule.${index}.description`}
                                            data-admin-type="rich-text"
                                            data-admin-current-text={item.description}
                                            data-admin-label={`Schedule #${index + 1} — Description`}
                                        >
                                            {item.description}
                                        </p>
                                    </div>
                                </ScheduleTimelineItem>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 space-y-4">
                            <p className="font-heading text-2xl text-primary">Schedule Coming Soon</p>
                            <p className="text-text-secondary max-w-sm mx-auto leading-relaxed">
                                We&apos;re finalizing the details for {wedding.date.display}. Check back soon!
                            </p>
                        </div>
                    )}
                </div>
            </Section>
        </div>
    );
}
