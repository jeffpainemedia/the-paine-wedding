/**
 * page-visibility.ts — Server-side only
 *
 * Utilities for admin-controlled page visibility. Pages that are marked
 * "hidden" in site_settings return a 404 to non-admin visitors.
 *
 * Usage in server components:
 *   await requirePageVisible("schedule");  // notFound() if hidden + not admin
 */

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "./admin/session";

// All pages that can be toggled in the admin dashboard
export const MANAGED_PAGES = [
    { slug: "our-story",       label: "Our Story" },
    { slug: "bridal-party",    label: "Bridal Party" },
    { slug: "wedding-details", label: "Details" },
    { slug: "schedule",        label: "Schedule" },
    { slug: "travel",          label: "Travel" },
    { slug: "attire",          label: "Attire" },
    { slug: "registry",        label: "Registry" },
    { slug: "faq",             label: "FAQ" },
    { slug: "games",           label: "Games" },
    { slug: "rsvp",            label: "RSVP" },
] as const;

type ManagedPageSlug = (typeof MANAGED_PAGES)[number]["slug"];

export const PUBLIC_NAV_LINKS = [
    { name: "Our Story", href: "/our-story", managedSlug: "our-story" as ManagedPageSlug },
    { name: "Bridal Party", href: "/bridal-party", managedSlug: "bridal-party" as ManagedPageSlug },
    { name: "Travel", href: "/travel", managedSlug: "travel" as ManagedPageSlug },
    { name: "Explore", href: "/explore" },
    { name: "Attire", href: "/attire", managedSlug: "attire" as ManagedPageSlug },
    { name: "Registry", href: "/registry", managedSlug: "registry" as ManagedPageSlug },
    { name: "Games", href: "/games", managedSlug: "games" as ManagedPageSlug },
    { name: "RSVP", href: "/rsvp", managedSlug: "rsvp" as ManagedPageSlug },
] as const;

export const PUBLIC_FOOTER_LINKS = [
    { label: "Our Story", href: "/our-story", managedSlug: "our-story" as ManagedPageSlug },
    { label: "Travel", href: "/travel", managedSlug: "travel" as ManagedPageSlug },
    { label: "Attire", href: "/attire", managedSlug: "attire" as ManagedPageSlug },
    { label: "FAQ", href: "/faq", managedSlug: "faq" as ManagedPageSlug },
    { label: "Registry", href: "/registry", managedSlug: "registry" as ManagedPageSlug },
    { label: "Games", href: "/games", managedSlug: "games" as ManagedPageSlug },
    { label: "RSVP", href: "/rsvp", managedSlug: "rsvp" as ManagedPageSlug },
    { label: "Feedback", href: "/feedback" },
] as const;

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/** Returns true if the page is currently set to hidden in site_settings. */
export async function isPageHidden(slug: string): Promise<boolean> {
    try {
        const sb = getServiceClient();
        const { data } = await sb
            .from("site_settings")
            .select("value")
            .eq("key", `page.${slug}.hidden`)
            .maybeSingle();
        return data?.value === "true";
    } catch {
        return false; // safe default: show the page
    }
}

async function getHiddenManagedSlugs(): Promise<Set<ManagedPageSlug>> {
    try {
        const sb = getServiceClient();
        const { data } = await sb
            .from("site_settings")
            .select("key, value")
            .like("key", "page.%.hidden");

        const hiddenSlugs = new Set<ManagedPageSlug>();
        for (const row of data ?? []) {
            if (row.value !== "true" || typeof row.key !== "string") continue;
            const [, slug] = row.key.match(/^page\.(.+)\.hidden$/) ?? [];
            if (slug && MANAGED_PAGES.some((page) => page.slug === slug)) {
                hiddenSlugs.add(slug as ManagedPageSlug);
            }
        }
        return hiddenSlugs;
    } catch {
        return new Set<ManagedPageSlug>();
    }
}

/** Returns true if the current request has a valid admin session cookie. */
export async function isAdminAuthenticated(): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
        return verifyAdminSessionToken(token) !== null;
    } catch {
        return false;
    }
}

/**
 * Call at the top of any server-component page to enforce visibility.
 * If the page is hidden AND the visitor is not an admin, returns a 404.
 */
export async function requirePageVisible(slug: string): Promise<void> {
    const [hidden, isAdmin] = await Promise.all([
        isPageHidden(slug),
        isAdminAuthenticated(),
    ]);
    if (hidden && !isAdmin) {
        notFound();
    }
}

export async function getVisiblePublicLinks<T extends Record<string, unknown>>(links: readonly T[]): Promise<T[]> {
    const [hiddenSlugs, isAdmin] = await Promise.all([
        getHiddenManagedSlugs(),
        isAdminAuthenticated(),
    ]);

    if (isAdmin) {
        return [...links];
    }

    return links.filter((link) => {
        const managedSlug = link.managedSlug;
        return typeof managedSlug !== "string" || !hiddenSlugs.has(managedSlug as ManagedPageSlug);
    });
}
