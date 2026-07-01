export const dynamic = "force-dynamic";

import Section from "@/components/ui/Section";
import { buildPageMetadata } from "@/lib/seo";
import { getScheduleUser, getPublicTier, getEventsForTier, getAllEvents } from "@/lib/schedule/queries";
import { getServiceClient } from "@/lib/server/supabase-admin";
import { isAdminAuthenticated } from "@/lib/page-visibility";
import ScheduleClient from "@/components/schedule/ScheduleClient";

export const metadata = buildPageMetadata({
    path: "/schedule",
    title: "Wedding Day Schedule",
    description: "The timeline for Ashlyn and Jeffrey's wedding day — ceremony, cocktail hour, dinner, and dancing.",
});

export default async function SchedulePage() {
    // Resolve visitor state in parallel — schedule auth (per-person login) and
    // admin auth (the cookie set by /admin) are independent.
    const [authUser, isAdmin] = await Promise.all([
        getScheduleUser(),
        isAdminAuthenticated(),
    ]);

    // Admins see every event across every tier when they haven't explicitly
    // signed in as a schedule user. This lets them sanity-check the full
    // timeline without having to log in as Carly or Jeff.
    if (isAdmin && !authUser) {
        const events = await getAllEvents();
        return (
            <div>
                <Section background="surface" className="text-center pb-14 pt-12 md:pb-16 md:pt-16 print:py-4">
                    <h1 className="font-heading text-5xl md:text-6xl mb-6 print:text-4xl">Wedding Day</h1>
                    <p className="max-w-xl mx-auto text-text-secondary tracking-wide print:text-sm">
                        Saturday, September 26, 2026 · Davis &amp; Grey Farms
                    </p>
                </Section>
                <Section background="surface" className="py-10 md:py-16 print:py-0">
                    <div className="max-w-3xl mx-auto">
                        <ScheduleClient
                            initialEvents={events}
                            initialTierSlug="admin"
                            initialAuth={{ displayName: "Admin", tierLabel: "All Tiers", roleLabel: "Site Admin" }}
                        />
                    </div>
                </Section>
            </div>
        );
    }

    // Otherwise: schedule-user-signed-in flow or anonymous public view.
    let tierId: string | null = null;
    let initialAuth = null;

    if (authUser) {
        const sb = getServiceClient();
        const { data: tier } = await sb
            .from("schedule_tiers")
            .select("id")
            .eq("slug", authUser.tierSlug)
            .maybeSingle();
        tierId = tier?.id ?? null;
        initialAuth = {
            displayName: authUser.displayName,
            tierLabel: authUser.tierLabel,
            roleLabel: authUser.roleLabel,
        };
    }

    if (!tierId) {
        const publicTier = await getPublicTier();
        tierId = publicTier?.id ?? null;
    }

    const events = tierId ? await getEventsForTier(tierId) : [];
    const tierSlug = authUser?.tierSlug ?? "public";

    return (
        <div>
            <Section background="surface" className="text-center pb-14 pt-12 md:pb-16 md:pt-16 print:py-4">
                <h1 className="font-heading text-5xl md:text-6xl mb-6 print:text-4xl">Wedding Day</h1>
                <p className="max-w-xl mx-auto text-text-secondary tracking-wide print:text-sm">
                    Saturday, September 26, 2026 · Davis &amp; Grey Farms
                </p>
            </Section>

            <Section background="surface" className="py-10 md:py-16 print:py-0">
                <div className="max-w-3xl mx-auto">
                    <ScheduleClient
                        initialEvents={events}
                        initialTierSlug={tierSlug}
                        initialAuth={initialAuth}
                    />
                </div>
            </Section>
        </div>
    );
}
