"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { WEDDING } from "@/lib/wedding-data";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image-placeholder";

// ── Gallery images ────────────────────────────────────────────────────────────
const RSVP_GALLERY_IMAGES = [
    "/images/rsvp/JeffAshlyn-7611.jpg",
    "/images/rsvp/JeffAshlyn-7615.jpg",
    "/images/rsvp/JeffAshlyn-7617.jpg",
    "/images/rsvp/JeffAshlyn-7620.jpg",
    "/images/rsvp/JeffAshlyn-7625.jpg",
    "/images/rsvp/JeffAshlyn-7626.jpg",
    "/images/rsvp/JeffAshlyn-7631.jpg",
    "/images/rsvp/JeffAshlyn-7636.jpg",
    "/images/rsvp/JeffAshlyn-7640.jpg",
    "/images/rsvp/JeffAshlyn-7644.jpg",
    "/images/rsvp/JeffAshlyn-7650.jpg",
    "/images/rsvp/JeffAshlyn-7653.jpg",
    "/images/rsvp/JeffAshlyn-7654.jpg",
    "/images/rsvp/JeffAshlyn-7658.jpg",
    "/images/rsvp/JeffAshlyn-7663.jpg",
    "/images/rsvp/JeffAshlyn-7682.jpg",
    "/images/rsvp/JeffAshlyn-7697.jpg",
    "/images/rsvp/JeffAshlyn-7704.jpg",
    "/images/rsvp/JeffAshlyn-7708.jpg",
    "/images/rsvp/JeffAshlyn-7711.jpg",
    "/images/rsvp/JeffAshlyn-7714.jpg",
    "/images/rsvp/JeffAshlyn-7716.jpg",
    "/images/rsvp/JeffAshlyn-7718.jpg",
    "/images/rsvp/JeffAshlyn-7720.jpg",
    "/images/rsvp/JeffAshlyn-7723.jpg",
    "/images/rsvp/JeffAshlyn-7726.jpg",
    "/images/rsvp/JeffAshlyn-7733.jpg",
    "/images/rsvp/JeffAshlyn-7754.jpg",
    "/images/rsvp/JeffAshlyn-7757.jpg",
    "/images/rsvp/JeffAshlyn-7759.jpg",
    "/images/rsvp/JeffAshlyn-7764.jpg",
    "/images/rsvp/JeffAshlyn-7768.jpg",
    "/images/rsvp/JeffAshlyn-7775.jpg",
    "/images/rsvp/JeffAshlyn-7777.jpg",
    "/images/rsvp/JeffAshlyn-7791.jpg",
    "/images/rsvp/JeffAshlyn-7795.jpg",
    "/images/rsvp/JeffAshlyn-7796.jpg",
    "/images/rsvp/JeffAshlyn-7802.jpg",
    "/images/rsvp/JeffAshlyn-7808.jpg",
    "/images/rsvp/JeffAshlyn-7814.jpg",
    "/images/rsvp/JeffAshlyn-7818.jpg",
    "/images/rsvp/JeffAshlyn-7820.jpg",
    "/images/rsvp/JeffAshlyn-7840.jpg",
    "/images/rsvp/JeffAshlyn-7844.jpg",
    "/images/rsvp/JeffAshlyn-7847.jpg",
    "/images/rsvp/JeffAshlyn-7860.jpg",
    "/images/rsvp/JeffAshlyn-7863.jpg",
    "/images/rsvp/JeffAshlyn-7864.jpg",
    "/images/rsvp/JeffAshlyn-7869.jpg",
    "/images/rsvp/JeffAshlyn-7882.jpg",
    "/images/rsvp/JeffAshlyn-7887.jpg",
    "/images/rsvp/JeffAshlyn-7889.jpg",
    "/images/rsvp/JeffAshlyn-7892.jpg",
    "/images/rsvp/JeffAshlyn-7925.jpg",
    "/images/rsvp/JeffAshlyn-7942.jpg",
    "/images/rsvp/JeffAshlyn-7961.jpg",
    "/images/rsvp/JeffAshlyn-7964.jpg",
    "/images/rsvp/JeffAshlyn-7966.jpg",
    "/images/rsvp/JeffAshlyn-7967.jpg",
    "/images/rsvp/JeffAshlyn-7970.jpg",
    "/images/rsvp/JeffAshlyn-7975.jpg",
    "/images/rsvp/JeffAshlyn-7977.jpg",
    "/images/rsvp/JeffAshlyn-7979.jpg",
    "/images/rsvp/JeffAshlyn-7991.jpg",
    "/images/rsvp/JeffAshlyn-7994.jpg",
    "/images/rsvp/JeffAshlyn-7995.jpg",
    "/images/rsvp/JeffAshlyn-8001.jpg",
    "/images/rsvp/JeffAshlyn-8008.jpg",
    "/images/rsvp/JeffAshlyn-8016.jpg",
    "/images/rsvp/JeffAshlyn-8028.jpg",
    "/images/rsvp/JeffAshlyn-8032.jpg",
    "/images/rsvp/JeffAshlyn-8033.jpg",
    "/images/rsvp/JeffAshlyn-8046.jpg",
    "/images/rsvp/JeffAshlyn-8069.jpg",
    "/images/rsvp/JeffAshlyn-8080.jpg",
    "/images/rsvp/JeffAshlyn-8087.jpg",
    "/images/rsvp/JeffAshlyn-8093.jpg",
    "/images/rsvp/JeffAshlyn-8095.jpg",
    "/images/rsvp/JeffAshlyn-8100.jpg",
    "/images/rsvp/JeffAshlyn-8104.jpg",
    "/images/rsvp/JeffAshlyn-8106.jpg",
    "/images/rsvp/JeffAshlyn-8113.jpg",
    "/images/rsvp/JeffAshlyn-8117.jpg",
    "/images/rsvp/JeffAshlyn-8120.jpg",
    "/images/rsvp/JeffAshlyn-8129.jpg",
    "/images/rsvp/JeffAshlyn-8147.jpg",
    "/images/rsvp/JeffAshlyn-8152.jpg",
    "/images/rsvp/JeffAshlyn-8156.jpg",
    "/images/rsvp/JeffAshlyn-8157.jpg",
    "/images/rsvp/JeffAshlyn-8160.jpg",
    "/images/rsvp/JeffAshlyn-8166.jpg",
    "/images/rsvp/JeffAshlyn-8173.jpg",
    "/images/rsvp/JeffAshlyn-8174.jpg",
    "/images/rsvp/JeffAshlyn-8175.jpg",
    "/images/rsvp/JeffAshlyn-8176.jpg",
] as const;

const RSVP_BACKDROP_IMAGES = RSVP_GALLERY_IMAGES
    .filter((_, index) => index % 2 === 0)
    .map((src) => src.replace("/images/rsvp/", "/images/rsvp-optimized/"));

const RSVP_MASONRY_COLUMNS = 5;
const RSVP_TILE_ASPECTS = [
    "aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[5/4]", "aspect-[2/3]",
] as const;

function RSVPBackdrop() {
    const columns = Array.from({ length: RSVP_MASONRY_COLUMNS }, (_, ci) =>
        RSVP_BACKDROP_IMAGES.filter((_, ii) => ii % RSVP_MASONRY_COLUMNS === ci)
    );
    return (
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-[#f6f2ea]" />
            <div className="absolute inset-0 flex scale-110 gap-3 px-3 py-6 md:gap-4 md:px-6 md:py-8">
                {columns.map((images, ci) => (
                    <div key={`col-${ci}`} className={`min-w-0 flex-1 overflow-hidden ${ci > 2 ? "hidden lg:block" : ""}`}>
                        <div
                            className={`flex flex-col gap-3 md:gap-4 will-change-transform ${ci % 2 === 0 ? "animate-rsvp-scroll-up" : "animate-rsvp-scroll-down"}`}
                            style={{ animationDuration: `${264 + ci * 42}s` }}
                        >
                            {[...images, ...images].map((src, ii) => (
                                <div
                                    key={`${src}-${ii}`}
                                    className={`overflow-hidden rounded-[1.4rem] border border-white/35 bg-white/25 shadow-[0_10px_28px_rgba(15,23,32,0.14)] ${RSVP_TILE_ASPECTS[(ii + ci) % RSVP_TILE_ASPECTS.length]}`}
                                >
                                    <Image src={src} alt="" width={600} height={800}
                                        sizes="(max-width: 1024px) 33vw, 20vw"
                                        quality={44}
                                        placeholder="blur"
                                        blurDataURL={IMAGE_BLUR_DATA_URL}
                                        fetchPriority="low"
                                        className="h-full w-full object-cover opacity-95" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="absolute inset-0 bg-[rgba(9,18,30,0.58)]" />
        </div>
    );
}

function getDisplayHouseholdName(name: string): string {
    return name.replace(/\s+\d+\s*$/, "").trim();
}

function getPrimaryGuests(household: Household) {
    return household.guests.filter((guest) => !guest.is_plus_one);
}

function getInvitationDisplayTitle(household: Household): string {
    const primaryGuests = getPrimaryGuests(household);
    if (primaryGuests.length === 1) {
        const guest = primaryGuests[0];
        return `${guest.first_name} ${guest.last_name}`;
    }
    return getDisplayHouseholdName(household.name);
}

function getInvitationDisplaySubtitle(household: Household): string {
    return getPrimaryGuests(household).length === 1
        ? "Let us know if you'll be joining us."
        : "Let us know who from your party will be joining us.";
}

// ── Types ─────────────────────────────────────────────────────────────────────

// Steps: 1 = Find Invitation, 2 = Who's Coming, 3 = A Few More Things, 4 = All Set
type RSVPStep = 1 | 2 | 3 | 4;
const STEP_LABELS = ["Find Invitation", "Who's Coming", "A Few More Things", "All Set!"];

type Guest = {
    id: string;
    first_name: string;
    last_name: string;
    suffix: string | null;
    nicknames: string | null;
    attending: boolean | null;
    meal_choice: string | null;
    food_allergies: string | null;
    song_request: string | null;
    advice: string | null;
    household_id: string;
    plus_one_allowed: boolean;
    is_plus_one: boolean;
    plus_one_for_id: string | null;
    plus_one_claimed: boolean;
    updated_at: string;
};

type Household = { id: string; name: string; guests: Guest[] };

type GuestResponse = {
    attending: boolean | null;
    food_allergies: string;
    showAllergies: boolean;
    // For plus one guests: their real name (user can edit the placeholder)
    firstName: string;
    lastName: string;
    nameEdited: boolean; // true once user has typed a name
};

// Stored in localStorage after a successful submit
type StoredRSVP = {
    accessToken: string;
    householdName: string;
    anyAttending: boolean;
    matchedGuestId?: string;
};

function buildGuestState(guests: Guest[]) {
    const responses: Record<string, GuestResponse> = {};
    const versions: Record<string, string> = {};

    guests.forEach((guest) => {
        const isClaimedPlusOne = guest.is_plus_one && guest.plus_one_claimed;
        responses[guest.id] = {
            attending: guest.attending ?? null,
            food_allergies: guest.food_allergies || "",
            showAllergies: !!guest.food_allergies,
            firstName: guest.first_name,
            lastName: guest.last_name,
            nameEdited: isClaimedPlusOne,
        };
        versions[guest.id] = guest.updated_at;
    });

    return { responses, versions };
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function RSVPProgressBar({ currentStep, onStepClick }: {
    currentStep: RSVPStep;
    onStepClick: (step: RSVPStep) => void;
}) {
    const total = STEP_LABELS.length;
    return (
        <div className="mb-8 md:mb-10 px-1">
            <div className="relative flex items-start justify-between">
                <div className="absolute top-4 left-4 right-4 h-px bg-primary/15 z-0" />
                <div
                    className="absolute top-4 left-4 h-px bg-primary/50 z-0 transition-all duration-500 ease-in-out"
                    style={{ width: `calc((${currentStep - 1} / ${total - 1}) * (100% - 2rem))` }}
                />
                {STEP_LABELS.map((label, i) => {
                    const stepNum = (i + 1) as RSVPStep;
                    const isCompleted = stepNum < currentStep;
                    const isCurrent = stepNum === currentStep;
                    const isClickable = isCompleted;
                    return (
                        <div key={label} className="relative z-10 flex flex-col items-center" style={{ width: `${100 / total}%` }}>
                            <button
                                type="button"
                                onClick={() => isClickable && onStepClick(stepNum)}
                                disabled={!isClickable}
                                aria-label={isClickable ? `Go back to step ${stepNum}: ${label}` : label}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                                    isCompleted
                                        ? "bg-primary border-primary text-white cursor-pointer hover:bg-primary/80 hover:scale-110"
                                        : isCurrent
                                        ? "bg-white border-primary text-primary shadow-[0_0_0_3px_rgba(26,63,111,0.12)] cursor-default"
                                        : "bg-white border-primary/20 text-text-secondary/40 cursor-default"
                                }`}
                            >
                                {isCompleted ? (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : stepNum}
                            </button>
                            <span
                                className={`mt-2 text-[9px] sm:text-[10px] uppercase tracking-wider font-medium text-center leading-tight transition-colors duration-300 ${
                                    isCurrent ? "text-primary" : isCompleted ? "text-primary/50" : "text-text-secondary/35"
                                }`}
                                style={{ maxWidth: "4.5rem" }}
                            >
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Shared back/outline button style ─────────────────────────────────────────
const outlineBtn = "px-6 py-3 text-sm font-medium border border-gray-200 rounded-sm text-text-secondary hover:border-primary hover:text-primary transition-colors";

// Auto-resize textarea hook
function useAutoResize(value: string, minRows: number = 1) {
    const ref = React.useRef<HTMLTextAreaElement>(null);
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        const lineHeight = 24;
        const minHeight = minRows * lineHeight + 24; // padding
        const maxHeight = 240;
        el.style.height = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight) + "px";
        el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [value, minRows]);
    return ref;
}

function SongRequestField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const ref = React.useRef<HTMLTextAreaElement>(null);
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        const maxH = 160;
        el.style.height = Math.min(el.scrollHeight, maxH) + "px";
        el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
    }, [value]);
    return (
        <div className="space-y-2">
            <label className="block text-xs uppercase tracking-widest text-text-secondary">Song Request</label>
            <p className="text-xs text-text-secondary/55">What song will get you on the dance floor?</p>
            <textarea
                ref={ref}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g. Mr. Brightside, Shout, anything Pitbull..."
                rows={1}
                className="w-full border-b border-gray-300 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder:text-gray-400 resize-none"
                style={{ minHeight: "44px" }}
            />
        </div>
    );
}

function AdviceField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const ref = React.useRef<HTMLTextAreaElement>(null);
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        const maxH = 240;
        el.style.height = Math.min(el.scrollHeight, maxH) + "px";
        el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
    }, [value]);
    return (
        <div className="space-y-2">
            <label className="block text-xs uppercase tracking-widest text-text-secondary">Advice for the Couple</label>
            <p className="text-xs text-text-secondary/55">Words of wisdom? Terrible advice? We&apos;ll take it.</p>
            <textarea
                ref={ref}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Share a thought..."
                rows={3}
                className="w-full border border-gray-200 p-3 text-sm rounded-sm focus:outline-none focus:border-primary bg-white resize-none placeholder:text-gray-400"
                style={{ minHeight: "84px" }}
            />
        </div>
    );
}

function PlusOneSlot({
    plusOneGuest,
    response,
    onAttendingToggle,
    onNameChange,
    onAllergyChange,
    onShowAllergy,
    onHideAllergy,
}: {
    plusOneGuest: Guest;
    response: GuestResponse | undefined;
    onAttendingToggle: (val: boolean) => void;
    onNameChange: (firstName: string, lastName: string) => void;
    onAllergyChange: (val: string) => void;
    onShowAllergy: () => void;
    onHideAllergy: () => void;
}) {
    const isNamed = !!(response?.nameEdited && response?.firstName?.trim() && response?.lastName?.trim());
    const isAttending = response?.attending;

    return (
        <div className="ml-5 mt-2 rounded-lg border border-dashed border-primary/20 bg-surface/30 p-4 space-y-3">
            <p className="text-xs uppercase tracking-widest text-text-secondary/60 font-medium">
                + Your Plus One
            </p>

            {/* Name inputs */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] uppercase tracking-widest text-text-secondary/60 mb-1">First Name</label>
                    <input
                        type="text"
                        value={response?.nameEdited ? (response?.firstName ?? "") : ""}
                        onChange={(e) => onNameChange(e.target.value, response?.lastName ?? "")}
                        placeholder="First name"
                        className="w-full border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder:text-gray-400"
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase tracking-widest text-text-secondary/60 mb-1">Last Name</label>
                    <input
                        type="text"
                        value={response?.nameEdited ? (response?.lastName ?? "") : ""}
                        onChange={(e) => onNameChange(response?.firstName ?? "", e.target.value)}
                        placeholder="Last name"
                        className="w-full border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* RSVP toggles — only show after name is entered */}
            {isNamed && (
                <div className="flex items-center justify-between animate-fade-in-up">
                    <span className="text-sm text-text-secondary font-medium">{response!.firstName} {response!.lastName}</span>
                    <div className="flex gap-2">
                        <button type="button"
                            onClick={() => onAttendingToggle(true)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-sm border transition-colors ${
                                isAttending === true
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-text-secondary border-gray-200 hover:border-primary hover:text-primary"
                            }`}
                        >Attending</button>
                        <button type="button"
                            onClick={() => onAttendingToggle(false)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-sm border transition-colors ${
                                isAttending === false
                                    ? "bg-secondary text-white border-secondary"
                                    : "bg-white text-text-secondary border-gray-200 hover:border-secondary hover:text-secondary"
                            }`}
                        >Declined</button>
                    </div>
                </div>
            )}

            {/* Dietary — only if attending */}
            {isNamed && isAttending === true && (
                <div className="animate-fade-in-up">
                    {!response?.showAllergies ? (
                        <button type="button" onClick={onShowAllergy}
                            className="text-xs text-text-secondary/55 hover:text-primary underline underline-offset-2 transition-colors">
                            + Add dietary restriction or allergy
                        </button>
                    ) : (
                        <div className="space-y-1.5 animate-fade-in-up">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs uppercase tracking-widest text-text-secondary">Dietary Restriction / Allergy</label>
                                <button type="button" onClick={onHideAllergy}
                                    className="text-xs text-text-secondary/40 hover:text-red-400 transition-colors">✕ Remove</button>
                            </div>
                            <input type="text" value={response?.food_allergies || ""}
                                onChange={(e) => onAllergyChange(e.target.value)}
                                placeholder="e.g. gluten-free, nut allergy"
                                className="w-full border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder:text-gray-400" />
                        </div>
                    )}
                </div>
            )}

            {!isNamed && (
                <p className="text-xs text-text-secondary/45 leading-relaxed">
                    Leave blank if you&apos;re not bringing a plus one.
                </p>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RSVP() {
    // ── Core form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [envError, setEnvError] = useState(false);
    const [step, setStep] = useState<RSVPStep>(1);

    // Step 1 sub-state: confirmation card shown before advancing
    const [confirming, setConfirming] = useState<{
        matchedName: string;
        matchedGuestId: string;
        accessToken: string;
        primaryGuestCount: number;
    } | null>(null);

    // Step 1 sub-state: multiple matches returned — user must pick one
    type RSVPChoice = {
        matchedName: string;
        matchedGuestId: string;
        accessToken: string;
        primaryGuestCount: number;
        householdLabel: string;
    };
    const [choices, setChoices] = useState<RSVPChoice[] | null>(null);

    // Step 2+ state
    const [household, setHousehold] = useState<Household | null>(null);
    const [matchedGuestId, setMatchedGuestId] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [responses, setResponses] = useState<Record<string, GuestResponse>>({});
    const [guestVersions, setGuestVersions] = useState<Record<string, string>>({});
    const [songRequest, setSongRequest] = useState("");
    const [advice, setAdvice] = useState("");

    // Returning visitor state (read from localStorage on mount)
    const [storedRSVP, setStoredRSVP] = useState<StoredRSVP | null>(null);
    const [loadingReturn, setLoadingReturn] = useState(false);

    // ── On mount: check localStorage for a previous submission ───────────────
    useEffect(() => {
        try {
            const raw = localStorage.getItem("rsvp_submitted");
            if (raw) {
                const parsed: StoredRSVP = JSON.parse(raw);
                if (parsed.accessToken && parsed.householdName) {
                    setStoredRSVP(parsed);
                    setMatchedGuestId(parsed.matchedGuestId ?? null);
                    setAccessToken(parsed.accessToken);
                    setStep(4);
                } else {
                    localStorage.removeItem("rsvp_submitted");
                }
            }
        } catch {
            // Corrupted storage — ignore and start fresh
        }
    }, []);

    // ── Leave/refresh guard ───────────────────────────────────────────────────
    // Active once the user has started filling out the form but hasn't submitted
    const guardActive = (step > 1 || !!confirming) && step !== 4;
    const pushedHistoryEntry = useRef(false);

    useEffect(() => {
        if (guardActive && !pushedHistoryEntry.current) {
            pushedHistoryEntry.current = true;
            window.history.pushState({ rsvpGuard: true }, "");
        }
    }, [guardActive]);

    useEffect(() => {
        if (!guardActive) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        const handlePopState = () => {
            const leave = window.confirm("Leave site?\n\nChanges you made may not be saved.");
            if (leave) {
                window.removeEventListener("beforeunload", handleBeforeUnload);
                window.removeEventListener("popstate", handlePopState);
                window.history.back();
            } else {
                window.history.pushState({ rsvpGuard: true }, "");
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [guardActive]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const anyAttending = household
        ? household.guests.some((g) => {
            const resp = responses[g.id];
            if (g.is_plus_one) {
                // Only count named plus ones
                return resp?.attending === true && resp?.nameEdited && resp?.firstName?.trim() && resp?.lastName?.trim();
            }
            return resp?.attending === true;
        })
        : false;

    // For step 4: did user come from localStorage only (no fresh submit this session)?
    const isReturningOnly = !!storedRSVP && !household;
    const step4Attending = household ? anyAttending : (storedRSVP?.anyAttending ?? false);
    const step4Name = storedRSVP?.householdName ?? (household ? getInvitationDisplayTitle(household) : "");

    // ── Navigation ────────────────────────────────────────────────────────────

    const handleStepClick = (targetStep: RSVPStep) => {
        if (targetStep < step) {
            setError(null);
            setStep(targetStep);
            if (targetStep === 1) { setConfirming(null); setChoices(null); }
        }
    };

    const goBack = () => {
        setError(null);
        if (step === 4) {
            // After submit: go back to the last content step
            setStep(anyAttending ? 3 : 2);
        } else if (step === 2) {
            setStep(1);
            setConfirming(null);
        } else if (step > 1) {
            setStep((prev) => (prev - 1) as RSVPStep);
        }
    };

    // ── Step 1: Search ────────────────────────────────────────────────────────

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setConfirming(null);
        setChoices(null);

        const cleanFirst = firstName.trim();
        const cleanLast = lastName.trim();
        if (!cleanFirst || !cleanLast) {
            setError("Please enter both your first and last name.");
            setLoading(false);
            return;
        }

        const response = await fetch("/api/rsvp/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName: cleanFirst, lastName: cleanLast }),
        });
        const payload = await response.json() as {
            error?: string;
            choices?: RSVPChoice[];
            matchedName?: string;
            matchedGuestId?: string;
            accessToken?: string;
            primaryGuestCount?: number;
        };

        // Multiple matches — let user pick their invitation
        if (payload.choices?.length) {
            setChoices(payload.choices);
            setLoading(false);
            return;
        }

        if (!response.ok || !payload.matchedName || !payload.matchedGuestId || !payload.accessToken || typeof payload.primaryGuestCount !== "number") {
            setError(payload.error ?? "There was an error communicating with the database. Please try again.");
            setLoading(false);
            return;
        }

        setConfirming({
            matchedName: payload.matchedName,
            matchedGuestId: payload.matchedGuestId,
            accessToken: payload.accessToken,
            primaryGuestCount: payload.primaryGuestCount,
        });
        setLoading(false);
    };

    const handleChoiceSelect = (choice: RSVPChoice) => {
        setChoices(null);
        setConfirming({
            matchedName: choice.matchedName,
            matchedGuestId: choice.matchedGuestId,
            accessToken: choice.accessToken,
            primaryGuestCount: choice.primaryGuestCount,
        });
    };

    const handleConfirm = async () => {
        if (!confirming) return;
        try {
            setLoading(true);
            const householdRes = await fetch(`/api/rsvp/household?token=${encodeURIComponent(confirming.accessToken)}`);
            const householdPayload = await householdRes.json() as { household?: Household; error?: string };
            if (!householdRes.ok || !householdPayload.household) {
                throw new Error(householdPayload.error || "Could not load your invitation.");
            }

            const nextState = buildGuestState(householdPayload.household.guests);
            setHousehold(householdPayload.household);
            setMatchedGuestId(confirming.matchedGuestId);
            setResponses(nextState.responses);
            setGuestVersions(nextState.versions);
            setAccessToken(confirming.accessToken);
            setConfirming(null);
            setStep(2);

            const viewedRes = await fetch("/api/rsvp/viewed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessToken: confirming.accessToken }),
            });
            if (viewedRes.ok) {
                const data = await viewedRes.json() as { versions?: Record<string, string> };
                if (data.versions) setGuestVersions(data.versions);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load your invitation.");
        } finally {
            setLoading(false);
        }
    };

    const handleNotMe = () => {
        setConfirming(null);
        setChoices(null);
        setMatchedGuestId(null);
        setError(null);
    };

    // ── Step 2: response helpers ──────────────────────────────────────────────

    // Toggle: clicking the currently-selected option deselects it (→ null)
    const handleAttendingToggle = (guestId: string, value: boolean) => {
        const current = responses[guestId]?.attending;
        setResponses((prev) => ({
            ...prev,
            [guestId]: { ...prev[guestId], attending: current === value ? null : value },
        }));
    };

    const handleAllergyChange = (guestId: string, value: string) => {
        setResponses((prev) => ({
            ...prev,
            [guestId]: { ...prev[guestId], food_allergies: value },
        }));
    };

    // Show the allergy field for a guest (expand)
    const showAllergyField = (guestId: string) => {
        setResponses((prev) => ({
            ...prev,
            [guestId]: { ...prev[guestId], showAllergies: true },
        }));
    };

    // Hide the allergy field AND clear the value
    const hideAllergyField = (guestId: string) => {
        setResponses((prev) => ({
            ...prev,
            [guestId]: { ...prev[guestId], showAllergies: false, food_allergies: "" },
        }));
    };

    const handleAttendanceNext = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!household) return;

        // Only require primary guests to have a selection
        const primaryGuests = household.guests.filter(g => !g.is_plus_one);
        const unselected = primaryGuests.find((g) => responses[g.id]?.attending === null);
        if (unselected) {
            setError(`Please select Attending or Declined for ${unselected.first_name}.`);
            return;
        }

        // Validate partially-named plus ones
        const plusOneGuests = household.guests.filter(g => g.is_plus_one);
        for (const po of plusOneGuests) {
            const resp = responses[po.id];
            if (resp?.nameEdited) {
                if (!resp.firstName?.trim() || !resp.lastName?.trim()) {
                    setError("Please enter your plus one's full name, or clear the name field.");
                    return;
                }
                if (resp.attending === null) {
                    setError(`Please select Attending or Declined for ${resp.firstName}.`);
                    return;
                }
            }
        }

        if (anyAttending) {
            setStep(3);
        } else {
            void handleSubmitRSVP();
        }
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmitRSVP = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError(null);
        if (!household || !accessToken) {
            setError("Your RSVP session expired. Please search for your invitation again.");
            setStep(1);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch("/api/rsvp/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accessToken,
                    responses,
                    songRequest,
                    advice,
                    versions: guestVersions,
                }),
            });
            const payload = await response.json() as { error?: string };
            if (!response.ok) throw new Error(payload.error || "Could not save RSVP.");

            // Persist to localStorage so returning visitors see step 4
            const toStore: StoredRSVP = {
                accessToken,
                householdName: getInvitationDisplayTitle(household),
                anyAttending,
                matchedGuestId: matchedGuestId ?? undefined,
            };
            try { localStorage.setItem("rsvp_submitted", JSON.stringify(toStore)); } catch { /* ignore */ }
            setStoredRSVP(toStore);

            setStep(4);
        } catch (err) {
            console.error("RSVP upsert error:", err);
            setError(err instanceof Error ? err.message : "Something went wrong while saving your RSVP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Returning visitor: load their data from DB ────────────────────────────

    const handleMakeChanges = async () => {
        const token = storedRSVP?.accessToken;
        if (!token) return;
        setLoadingReturn(true);
        setError(null);
        try {
            const response = await fetch(`/api/rsvp/household?token=${encodeURIComponent(token)}`);
            const payload = await response.json() as { household?: Household; error?: string };
            if (!response.ok || !payload.household) throw new Error(payload.error || "Not found");

            const nextState = buildGuestState(payload.household.guests);
            setHousehold(payload.household);
            setResponses(nextState.responses);
            setGuestVersions(nextState.versions);

            // Restore song/advice from what's already in the DB
            const gWithData = payload.household.guests.find((g: Guest) => g.song_request || g.advice);
            if (gWithData?.song_request) setSongRequest(gWithData.song_request);
            if (gWithData?.advice) setAdvice(gWithData.advice);

            setMatchedGuestId(storedRSVP?.matchedGuestId ?? null);
            setStep(2);

            // Sync versions after viewed update to avoid false conflict on submit.
            try {
                const viewedRes = await fetch("/api/rsvp/viewed", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ accessToken: token }),
                });
                if (viewedRes.ok) {
                    const viewedData = await viewedRes.json() as { versions?: Record<string, string> };
                    if (viewedData.versions) setGuestVersions(viewedData.versions);
                }
            } catch { /* ignore */ }
        } catch {
            try { localStorage.removeItem("rsvp_submitted"); } catch { /* ignore */ }
            setStoredRSVP(null);
            setAccessToken(null);
            setStep(1);
            setError("Could not load your RSVP data. Please search for your invitation again.");
        } finally {
            setLoadingReturn(false);
        }
    };

    // ── Step headings ─────────────────────────────────────────────────────────

    const stepHeadings: Record<RSVPStep, { title: string; subtitle: string }> = {
        1: {
            title: "RSVP",
            subtitle: "",
        },
        2: {
            title: household ? getInvitationDisplayTitle(household) : "Who's Coming?",
            subtitle: household ? getInvitationDisplaySubtitle(household) : "Let us know who will be joining us.",
        },
        3: { title: "Last Things", subtitle: "Two quick questions, then you're done." },
        4: {
            title: isReturningOnly ? `Welcome back!` : "You're All Set!",
            subtitle: "",
        },
    };

    const heading = stepHeadings[step];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="relative min-h-screen overflow-hidden">
            <RSVPBackdrop />

            <Section className="relative z-10 flex min-h-screen flex-col justify-center bg-transparent py-20 text-center md:py-28">
                {/* Card — min-height prevents jarring jumps between steps */}
                <div
                    className="surface-panel mx-auto w-full max-w-[min(92vw,52rem)] p-6 shadow-[0_32px_90px_rgba(8,16,28,0.24)] sm:p-8 lg:p-12"
                    style={{ minHeight: "520px" }}
                >
                    {/* Progress bar (hidden on step 4) */}
                    {step !== 4 && (
                        <RSVPProgressBar currentStep={step} onStepClick={handleStepClick} />
                    )}

                    {/* Heading */}
                    <div className="mb-8 text-center md:mb-10">
                        <h1 className="font-heading text-4xl md:text-5xl">{heading.title}</h1>
                        {heading.subtitle && (
                            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-primary/72 md:text-lg">
                                {heading.subtitle}
                            </p>
                        )}
                    </div>

                    {/* Error banners */}
                    {envError && (
                        <div className="mb-8 p-6 bg-red-50 text-red-900 border border-red-200 rounded-sm text-left">
                            <h3 className="font-heading text-xl mb-2 text-red-800">Database Connection Error</h3>
                            <p className="text-sm">Running locally without a Supabase connection. Add keys to <code>.env.local</code> or test on the live domain.</p>
                        </div>
                    )}
                    {error && !envError && (
                        <div className="mb-6 p-4 bg-red-50 text-red-800 text-sm border border-red-200 rounded-sm">
                            {error}
                        </div>
                    )}

                    {/* ── Step 1: Search ──────────────────────────────────────────────── */}
                    {step === 1 && !envError && !confirming && !choices && (
                        <form onSubmit={handleSearch} className="space-y-6 text-left animate-fade-in-up">
                            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                                <div className="space-y-1 min-w-0">
                                    <div className="h-4">
                                        <label
                                            className={`block text-xs uppercase tracking-widest text-text-secondary transition-opacity duration-200 ${
                                                firstName.trim() ? "opacity-100" : "opacity-0"
                                            }`}
                                        >
                                            First Name
                                        </label>
                                    </div>
                                    <input
                                        type="text" required value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder={firstName.trim() ? "" : "First name"}
                                        className="w-full min-w-0 border-b border-primary/18 py-3 text-text-primary placeholder:text-text-secondary/70 focus:outline-none focus:border-primary transition-colors bg-transparent"
                                    />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <div className="h-4">
                                        <label
                                            className={`block text-xs uppercase tracking-widest text-text-secondary transition-opacity duration-200 ${
                                                lastName.trim() ? "opacity-100" : "opacity-0"
                                            }`}
                                        >
                                            Last Name
                                        </label>
                                    </div>
                                    <input
                                        type="text" required value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder={lastName.trim() ? "" : "Last name"}
                                        className="w-full min-w-0 border-b border-primary/18 py-3 text-text-primary placeholder:text-text-secondary/70 focus:outline-none focus:border-primary transition-colors bg-transparent"
                                    />
                                </div>
                            </div>
                            <div className="pt-6">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Searching..." : "Find My Invitation"}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* ── Step 1: Multiple matches — pick your invitation ──────────────── */}
                    {step === 1 && !envError && !confirming && choices && (
                        <div className="animate-fade-in-up space-y-5 text-left">
                            <p className="text-sm text-text-secondary text-center">
                                We found {choices.length} invitations for <strong>{choices[0]?.matchedName}</strong>. Which one is yours?
                            </p>
                            <div className="space-y-3">
                                {choices.map((choice, i) => (
                                    <button
                                        key={choice.matchedGuestId}
                                        type="button"
                                        onClick={() => handleChoiceSelect(choice)}
                                        className="w-full rounded-xl border border-primary/12 bg-surface/60 p-5 text-left hover:border-primary/40 hover:bg-surface transition-colors group"
                                    >
                                        <p className="text-xs uppercase tracking-widest text-text-secondary mb-1 font-medium">Invitation {i + 1}</p>
                                        <p className="font-heading text-xl text-primary group-hover:text-primary">{choice.matchedName}</p>
                                        <p className="text-sm text-text-secondary mt-0.5">{choice.householdLabel}</p>
                                    </button>
                                ))}
                            </div>
                            <div className="pt-1 text-center">
                                <button type="button" onClick={handleNotMe} className="text-sm text-text-secondary underline underline-offset-2 hover:text-primary transition-colors">
                                    None of these — search again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 1: Confirmation card ────────────────────────────────────── */}
                    {step === 1 && !envError && confirming && (
                        <div className="animate-fade-in-up space-y-6 text-center">
                            <div className="rounded-xl border border-primary/12 bg-surface/60 p-6 text-left">
                                <p className="text-xs uppercase tracking-widest text-text-secondary mb-3 font-medium">We found a match</p>
                                <p className="font-heading text-2xl text-primary mb-1">{confirming.matchedName}</p>
                                {confirming.primaryGuestCount > 1 && (
                                    <p className="text-sm text-text-secondary">
                                        We&apos;ll show everyone included with you on the next page.
                                    </p>
                                )}
                            </div>
                            <p className="text-base text-text-secondary">Is this you?</p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button className="flex-1" onClick={handleConfirm}>Yes, that&apos;s me →</Button>
                                <button type="button" onClick={handleNotMe} className={`flex-1 ${outlineBtn}`}>
                                    Not me — search again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Attendance ───────────────────────────────────────────── */}
                    {step === 2 && household && (
                        <form onSubmit={handleAttendanceNext} className="space-y-6 text-left animate-fade-in-up">
                            {(() => {
                                const primaryGuests = household.guests.filter((g) => !g.is_plus_one);
                                const plusOneByForId: Record<string, Guest> = {};
                                household.guests
                                    .filter((g) => g.is_plus_one && g.plus_one_for_id)
                                    .forEach((g) => { plusOneByForId[g.plus_one_for_id!] = g; });

                                return primaryGuests.map((guest: Guest) => {
                                    const resp = responses[guest.id];
                                    const isAttending = resp?.attending;
                                    const plusOneGuest = guest.plus_one_allowed ? plusOneByForId[guest.id] : undefined;

                                    return (
                                        <div key={guest.id} className="space-y-3 pb-6 border-b border-surface last:border-0">
                                            {/* Primary guest row */}
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <h3 className="font-medium text-lg border-l-2 border-primary pl-3 text-text-primary">
                                                    {guest.first_name} {guest.last_name}
                                                    {guest.suffix && <span className="text-text-secondary text-base ml-1">{guest.suffix}</span>}
                                                </h3>
                                                <div className="flex gap-2 flex-shrink-0 pl-5 sm:pl-0">
                                                    <button type="button"
                                                        onClick={() => handleAttendingToggle(guest.id, true)}
                                                        className={`px-5 py-2 text-sm font-medium rounded-sm border transition-colors ${
                                                            isAttending === true
                                                                ? "bg-primary text-white border-primary"
                                                                : "bg-white text-text-secondary border-gray-200 hover:border-primary hover:text-primary"
                                                        }`}
                                                    >Attending</button>
                                                    <button type="button"
                                                        onClick={() => handleAttendingToggle(guest.id, false)}
                                                        className={`px-5 py-2 text-sm font-medium rounded-sm border transition-colors ${
                                                            isAttending === false
                                                                ? "bg-secondary text-white border-secondary"
                                                                : "bg-white text-text-secondary border-gray-200 hover:border-secondary hover:text-secondary"
                                                        }`}
                                                    >Declined</button>
                                                </div>
                                            </div>

                                            {/* Dietary restriction */}
                                            {isAttending === true && (
                                                <div className="pl-5 animate-fade-in-up">
                                                    {!resp?.showAllergies ? (
                                                        <button type="button" onClick={() => showAllergyField(guest.id)}
                                                            className="text-xs text-text-secondary/55 hover:text-primary underline underline-offset-2 transition-colors">
                                                            + Add dietary restriction or allergy
                                                        </button>
                                                    ) : (
                                                        <div className="space-y-1.5 animate-fade-in-up">
                                                            <div className="flex items-center justify-between">
                                                                <label className="block text-xs uppercase tracking-widest text-text-secondary">Dietary Restriction / Allergy</label>
                                                                <button type="button" onClick={() => hideAllergyField(guest.id)}
                                                                    className="text-xs text-text-secondary/40 hover:text-red-400 transition-colors leading-none" aria-label="Remove dietary restriction">
                                                                    ✕ Remove
                                                                </button>
                                                            </div>
                                                            <input type="text" autoFocus value={resp?.food_allergies || ""}
                                                                onChange={(e) => handleAllergyChange(guest.id, e.target.value)}
                                                                placeholder="e.g. gluten-free, nut allergy"
                                                                className="w-full border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder:text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Plus one slot */}
                                            {plusOneGuest && (
                                                <PlusOneSlot
                                                    plusOneGuest={plusOneGuest}
                                                    response={responses[plusOneGuest.id]}
                                                    onAttendingToggle={(val) => handleAttendingToggle(plusOneGuest.id, val)}
                                                    onNameChange={(firstName, lastName) => {
                                                        setResponses((prev) => ({
                                                            ...prev,
                                                            [plusOneGuest.id]: {
                                                                ...prev[plusOneGuest.id],
                                                                firstName,
                                                                lastName,
                                                                nameEdited: true,
                                                            },
                                                        }));
                                                    }}
                                                    onAllergyChange={(val) => handleAllergyChange(plusOneGuest.id, val)}
                                                    onShowAllergy={() => showAllergyField(plusOneGuest.id)}
                                                    onHideAllergy={() => hideAllergyField(plusOneGuest.id)}
                                                />
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button type="button" onClick={goBack} className={`sm:w-auto ${outlineBtn}`}>← Back</button>
                                <Button type="submit" className="flex-1" disabled={loading}>
                                    {loading ? "Saving..." : anyAttending ? "Next →" : "Submit RSVP"}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* ── Step 3: Extras ───────────────────────────────────────────────── */}
                    {step === 3 && household && (
                        <form onSubmit={handleSubmitRSVP} className="space-y-8 text-left animate-fade-in-up">
                            <SongRequestField value={songRequest} onChange={setSongRequest} />
                            <AdviceField value={advice} onChange={setAdvice} />
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button type="button" onClick={goBack} className={`sm:w-auto ${outlineBtn}`}>← Back</button>
                                <Button type="submit" className="flex-1" disabled={loading}>
                                    {loading ? "Sending..." : "Send RSVP"}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* ── Step 4: Confirmation / Returning visitor ─────────────────────── */}
                    {step === 4 && (
                        <div className="text-center space-y-6 animate-fade-in-up">
                            {/* Navy circle + beige checkmark */}
                            <div className="w-20 h-20 bg-primary mx-auto rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24"
                                    stroke="#f6f2ea" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs uppercase tracking-[0.2em] text-primary/60 font-medium">
                                    {isReturningOnly ? "Already Submitted" : "Response Received"}
                                </p>
                                {isReturningOnly && (
                                    <p className="font-heading text-2xl text-primary/70">{step4Name}</p>
                                )}
                                <p className="font-heading text-3xl md:text-4xl text-primary">
                                    {isReturningOnly ? "You're all set!" : "We've got you!"}
                                </p>
                                <p className="text-text-secondary leading-relaxed max-w-md mx-auto">
                                    {isReturningOnly
                                        ? "Your RSVP is already on file. Want to make any changes?"
                                        : step4Attending
                                        ? `Your RSVP is confirmed. We can't wait to celebrate with you on ${WEDDING.date.dayOfWeek}, ${WEDDING.date.display}.`
                                        : "We're sorry you can't make it, but we appreciate you letting us know."}
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                                {isReturningOnly ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => void handleMakeChanges()}
                                            disabled={loadingReturn}
                                            className={outlineBtn}
                                        >
                                            {loadingReturn ? "Loading..." : "Make changes to my RSVP"}
                                        </button>
                                        <Button href="/">Return Home</Button>
                                    </>
                                ) : (
                                    <>
                                        <button type="button" onClick={goBack} className={outlineBtn}>← Back</button>
                                        <Button href="/">Return Home</Button>
                                    </>
                                )}
                            </div>

                            {/* Subtle trip planning link */}
                            {step4Attending && (
                                <p className="text-sm text-text-secondary/60 pt-1">
                                    Live outside DFW?{" "}
                                    <Link href="/travel" className="text-primary/70 underline underline-offset-2 hover:text-primary transition-colors">
                                        Plan your trip →
                                    </Link>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </Section>
        </div>
    );
}
