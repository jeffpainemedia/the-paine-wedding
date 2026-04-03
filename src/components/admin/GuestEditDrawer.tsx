"use client";

import React, { useEffect, useRef, useState } from "react";

type Guest = {
    id: string;
    first_name: string;
    last_name: string;
    suffix: string | null;
    nicknames: string | null;
    attending: boolean | null;
    meal_choice: string | null;
    food_allergies: string | null;
    dietary_restrictions: string | null;
    song_request: string | null;
    advice: string | null;
    plus_one_name: string | null;
    plus_one_allowed: boolean;
    affiliation: string | null;
    side: string | null;
    likelihood: string | null;
    viewed_rsvp: boolean;
    is_plus_one: boolean;
    plus_one_for_id: string | null;
    plus_one_claimed: boolean;
    households: { id: string; name: string };
};

type HouseholdMate = {
    id: string;
    first_name: string;
    last_name: string;
    attending: boolean | null;
};

type Props = {
    guest: Guest | null;
    householdMates: HouseholdMate[]; // all guests in same household (including this guest)
    householdOptions: string[];
    onClose: () => void;
    onSaved: (updatedGuest: Guest) => void;
    onHouseholdRsvp: (householdId: string, attending: boolean | null) => void;
    onDelete: (guestId: string) => void;
};

function isUnnamedPlusOneGuest(guest: Guest) {
    return guest.is_plus_one && (
        (guest.first_name === "Plus" && guest.last_name === "One") ||
        (guest.first_name === "Plus One" && !guest.last_name)
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-widest text-text-secondary">
                {label}
            </label>
            {children}
        </div>
    );
}

function ClearableText({
    value,
    placeholder,
    onChange,
    multiline,
}: {
    value: string;
    placeholder?: string;
    onChange: (val: string | null) => void;
    multiline?: boolean;
}) {
    const cls =
        "w-full rounded-xl border border-primary/12 bg-surface/50 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary/40 focus:outline-none focus:ring-0 resize-none";
    return (
        <div className="relative">
            {multiline ? (
                <textarea
                    rows={3}
                    className={cls}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value || null)}
                />
            ) : (
                <input
                    type="text"
                    className={cls + " pr-8"}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value || null)}
                />
            )}
            {value && !multiline && (
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary/40 hover:text-red-400 transition-colors"
                    title="Clear"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>
            )}
            {value && multiline && (
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="mt-1 text-xs text-text-secondary/50 hover:text-red-400 transition-colors"
                >
                    Clear
                </button>
            )}
        </div>
    );
}

function AttendingSelect({
    value,
    onChange,
}: {
    value: boolean | null;
    onChange: (val: boolean | null) => void;
}) {
    const toStr = (v: boolean | null) => (v === true ? "true" : v === false ? "false" : "null");
    const fromStr = (s: string): boolean | null =>
        s === "true" ? true : s === "false" ? false : null;

    return (
        <select
            className="w-full rounded-xl border border-primary/12 bg-surface/50 px-3 py-2.5 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
            value={toStr(value)}
            onChange={(e) => onChange(fromStr(e.target.value))}
        >
            <option value="null">Pending (no response)</option>
            <option value="true">Attending ✓</option>
            <option value="false">Declined ✗</option>
        </select>
    );
}

function EnumSelect({
    value,
    options,
    placeholder,
    onChange,
}: {
    value: string | null;
    options: string[];
    placeholder?: string;
    onChange: (val: string | null) => void;
}) {
    return (
        <select
            className="w-full rounded-xl border border-primary/12 bg-surface/50 px-3 py-2.5 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
        >
            <option value="">{placeholder ?? "— none —"}</option>
            {options.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    );
}

export default function GuestEditDrawer({
    guest,
    householdMates,
    householdOptions,
    onClose,
    onSaved,
    onHouseholdRsvp,
    onDelete,
}: Props) {
    const [form, setForm] = useState<Guest | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [householdRsvpValue, setHouseholdRsvpValue] = useState<boolean | null>(null);
    const [applyingHousehold, setApplyingHousehold] = useState(false);
    const [moveHouseholdName, setMoveHouseholdName] = useState("");
    const [plusOneNameUnknown, setPlusOneNameUnknown] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);

    // Sync form when guest changes
    useEffect(() => {
        if (guest) {
            setForm({ ...guest });
            setSaveError(null);
            setConfirmDelete(false);
            setHouseholdRsvpValue(guest.attending);
            setMoveHouseholdName("");
            setPlusOneNameUnknown(
                guest.is_plus_one
                    ? isUnnamedPlusOneGuest(guest)
                    : !(guest.plus_one_name?.trim())
            );
        }
    }, [guest?.id]);

    // Close on Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!guest || !form) return null;

    // At this point guest is non-null; capture in local const so closures below are safe
    const currentGuest = guest;

    function set<K extends keyof Guest>(key: K, value: Guest[K]) {
        setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    }

    function setHouseholdName(name: string | null) {
        setForm((prev) => (
            prev
                ? {
                    ...prev,
                    households: {
                        ...prev.households,
                        name: name ?? "",
                    },
                }
                : prev
        ));
    }

    async function handleSave() {
        if (!form) return;
        setSaving(true);
        setSaveError(null);
        try {
            const trimmedHouseholdName = form.households.name.trim();
            if (!trimmedHouseholdName) {
                throw new Error("Household name is required.");
            }

            const trimmedMoveHouseholdName = moveHouseholdName.trim();
            const normalizedPlusOneName = plusOneNameUnknown
                ? null
                : form.plus_one_name?.trim() || null;

            const normalizedGuest = form.is_plus_one
                ? {
                    ...form,
                    first_name: plusOneNameUnknown ? "Plus" : form.first_name,
                    last_name: plusOneNameUnknown ? "One" : form.last_name,
                }
                : {
                    ...form,
                    plus_one_name: normalizedPlusOneName,
                    plus_one_for_id: null,
                    plus_one_claimed: false,
                };
            const res = await fetch("/api/admin/guests", {
                method: "PATCH",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: normalizedGuest.id,
                    household_id: normalizedGuest.households.id,
                    household_name: trimmedHouseholdName,
                    target_household_name: trimmedMoveHouseholdName || undefined,
                    updates: {
                        first_name: normalizedGuest.first_name,
                        last_name: normalizedGuest.last_name,
                        suffix: normalizedGuest.suffix,
                        attending: normalizedGuest.attending,
                        food_allergies: normalizedGuest.food_allergies,
                        dietary_restrictions: normalizedGuest.dietary_restrictions,
                        song_request: normalizedGuest.song_request,
                        advice: normalizedGuest.advice,
                        plus_one_name: normalizedGuest.plus_one_name,
                        plus_one_allowed: normalizedGuest.plus_one_allowed,
                        affiliation: normalizedGuest.affiliation,
                        side: normalizedGuest.side,
                        likelihood: normalizedGuest.likelihood,
                        is_plus_one: normalizedGuest.is_plus_one,
                        plus_one_for_id: normalizedGuest.plus_one_for_id,
                        plus_one_claimed: normalizedGuest.plus_one_claimed,
                    },
                }),
            });
            if (!res.ok) {
                const data = (await res.json()) as { error?: string };
                throw new Error(data.error ?? "Save failed");
            }
            onSaved(normalizedGuest);
            onClose();
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : "Unknown error");
        }
        setSaving(false);
    }

    async function handleDelete() {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/guests?id=${currentGuest.id}`, {
                method: "DELETE",
                credentials: "same-origin",
            });
            if (!res.ok) {
                const data = (await res.json()) as { error?: string };
                throw new Error(data.error ?? "Delete failed");
            }
            onDelete(currentGuest.id);
            onClose();
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : "Unknown error");
        }
        setDeleting(false);
    }

    async function handleHouseholdRsvp() {
        setApplyingHousehold(true);
        try {
            const res = await fetch("/api/admin/guests", {
                method: "PATCH",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    household_id: currentGuest.households.id,
                    household_attending: householdRsvpValue,
                }),
            });
            if (!res.ok) {
                const data = (await res.json()) as { error?: string };
                throw new Error(data.error ?? "Failed to update household");
            }
            onHouseholdRsvp(currentGuest.households.id, householdRsvpValue);
            // Also update form to reflect new value for this guest
            set("attending", householdRsvpValue);
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : "Unknown error");
        }
        setApplyingHousehold(false);
    }

    const hasOtherMates = householdMates.filter((m) => m.id !== guest.id).length > 0;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-primary/8 px-6 py-5">
                    <div>
                        <h2 className="font-heading text-xl text-primary">
                            {form.first_name} {form.last_name}
                            {form.suffix ? (
                                <span className="ml-2 text-sm font-normal text-text-secondary">
                                    {form.suffix}
                                </span>
                            ) : null}
                        </h2>
                        <p className="mt-0.5 text-xs text-text-secondary">
                            {currentGuest.households.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 mt-0.5 rounded-full p-1.5 text-text-secondary hover:bg-surface/80 hover:text-primary transition-colors"
                        title="Close"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                    {/* ── RSVP STATUS ── */}
                    <section>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary/50">
                            RSVP Status
                        </h3>
                        <div className="space-y-4">
                            <Field label="This guest">
                                <AttendingSelect
                                    value={form.attending}
                                    onChange={(v) => set("attending", v)}
                                />
                            </Field>

                            {/* Household bulk action */}
                            <div className="rounded-xl border border-primary/8 bg-surface/50 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium uppercase tracking-widest text-text-secondary">
                                        Entire Household
                                    </span>
                                    <span className="text-xs text-text-secondary/60">
                                        {householdMates.map((m) => m.first_name).join(", ")}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <AttendingSelect
                                            value={householdRsvpValue}
                                            onChange={setHouseholdRsvpValue}
                                        />
                                    </div>
                                    <button
                                        onClick={() => void handleHouseholdRsvp()}
                                        disabled={applyingHousehold}
                                        className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                    >
                                        {applyingHousehold ? "Applying…" : "Apply All"}
                                    </button>
                                </div>
                                {hasOtherMates && (
                                    <p className="text-[11px] text-text-secondary/50 leading-relaxed">
                                        This will set every guest in this household to the selected status.
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ── RESPONSES ── */}
                    <section>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary/50">
                            Responses
                        </h3>
                        <div className="space-y-4">
                            <Field label="Dietary restrictions / allergies">
                                <ClearableText
                                    value={form.dietary_restrictions ?? form.food_allergies ?? ""}
                                    placeholder="None"
                                    onChange={(v) => {
                                        set("dietary_restrictions", v);
                                        set("food_allergies", v);
                                    }}
                                />
                            </Field>
                            <Field label="Song request">
                                <ClearableText
                                    value={form.song_request ?? ""}
                                    placeholder="No song requested"
                                    onChange={(v) => set("song_request", v)}
                                />
                            </Field>
                            <Field label="Advice / message">
                                <ClearableText
                                    value={form.advice ?? ""}
                                    placeholder="No advice left"
                                    onChange={(v) => set("advice", v)}
                                    multiline
                                />
                            </Field>
                        </div>
                    </section>

                    {/* ── GUEST INFO ── */}
                    <section>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary/50">
                            Guest Info
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="First name">
                                    <ClearableText
                                        value={form.first_name}
                                        placeholder="First"
                                        onChange={(v) => set("first_name", v ?? "")}
                                    />
                                </Field>
                                <Field label="Last name">
                                    <ClearableText
                                        value={form.last_name}
                                        placeholder="Last"
                                        onChange={(v) => set("last_name", v ?? "")}
                                    />
                                </Field>
                            </div>
                            <Field label="Suffix (Jr., III, etc.)">
                                <ClearableText
                                    value={form.suffix ?? ""}
                                    placeholder="None"
                                    onChange={(v) => set("suffix", v)}
                                />
                            </Field>
                            <Field label="Plus-one name (reference only)">
                                <ClearableText
                                    value={form.plus_one_name ?? ""}
                                    placeholder={plusOneNameUnknown ? "Guest will enter their name on the RSVP" : "None"}
                                    onChange={(v) => {
                                        if ((v ?? "").trim()) setPlusOneNameUnknown(false);
                                        set("plus_one_name", v);
                                    }}
                                />
                            </Field>
                            {form.is_plus_one ? (
                                <label className="flex items-center gap-2 text-sm text-text-secondary">
                                    <input
                                        type="checkbox"
                                        checked={plusOneNameUnknown}
                                        onChange={(e) => setPlusOneNameUnknown(e.target.checked)}
                                        className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary/30"
                                    />
                                    Do not know this plus-one&apos;s name yet
                                </label>
                            ) : form.plus_one_allowed ? (
                                <label className="flex items-center gap-2 text-sm text-text-secondary">
                                    <input
                                        type="checkbox"
                                        checked={plusOneNameUnknown}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setPlusOneNameUnknown(checked);
                                            if (checked) {
                                                set("plus_one_name", null);
                                            }
                                        }}
                                        className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary/30"
                                    />
                                    Do not know plus-one name yet
                                </label>
                            ) : null}
                            <Field label="Guest role">
                                <select
                                    className="w-full rounded-xl border border-primary/12 bg-surface/50 px-3 py-2.5 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                                    value={form.is_plus_one ? "plus_one" : "primary"}
                                    onChange={(e) => {
                                        const isPlusOne = e.target.value === "plus_one";
                                        set("is_plus_one", isPlusOne);
                                        if (!isPlusOne) {
                                            set("plus_one_allowed", false);
                                            set("plus_one_name", null);
                                            set("plus_one_for_id", null);
                                            set("plus_one_claimed", false);
                                            setPlusOneNameUnknown(false);
                                        }
                                    }}
                                >
                                    <option value="primary">Primary guest</option>
                                    <option value="plus_one">Plus-one guest</option>
                                </select>
                            </Field>
                            <Field label="Plus-one allowed">
                                <select
                                    className="w-full rounded-xl border border-primary/12 bg-surface/50 px-3 py-2.5 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                                    value={form.plus_one_allowed ? "true" : "false"}
                                    onChange={(e) => set("plus_one_allowed", e.target.value === "true")}
                                >
                                    <option value="false">No</option>
                                    <option value="true">Yes</option>
                                </select>
                            </Field>
                            <Field label="Current household">
                                <ClearableText
                                    value={form.households.name}
                                    placeholder="Household name"
                                    onChange={setHouseholdName}
                                />
                            </Field>
                            <Field label="Move guest to household">
                                <input
                                    list="guest-drawer-household-options"
                                    value={moveHouseholdName}
                                    onChange={(e) => setMoveHouseholdName(e.target.value)}
                                    placeholder={form.households.name}
                                    className="w-full rounded-xl border border-primary/12 bg-surface/50 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary/40 focus:outline-none"
                                />
                                <p className="mt-1 text-[11px] leading-relaxed text-text-secondary/55">
                                    Leave blank to keep this guest where they are. Enter an existing household name or a new one to move them.
                                    {!form.is_plus_one ? " Linked plus-one guests will move with their primary guest." : ""}
                                </p>
                                <datalist id="guest-drawer-household-options">
                                    {householdOptions.map((householdName) => (
                                        <option key={householdName} value={householdName} />
                                    ))}
                                </datalist>
                            </Field>
                        </div>
                    </section>

                    {/* ── ADMIN NOTES ── */}
                    <section>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary/50">
                            Admin Notes
                        </h3>
                        <div className="space-y-4">
                            <Field label="Affiliation">
                                <EnumSelect
                                    value={form.affiliation}
                                    options={["Family", "Our Friends", "Their Friends"]}
                                    placeholder="— unset —"
                                    onChange={(v) => set("affiliation", v)}
                                />
                            </Field>
                            <Field label="Side">
                                <EnumSelect
                                    value={form.side}
                                    options={["Jeff", "Ash", "Both"]}
                                    placeholder="— unset —"
                                    onChange={(v) => set("side", v)}
                                />
                            </Field>
                            <Field label="Likelihood (admin prediction)">
                                <EnumSelect
                                    value={form.likelihood}
                                    options={["Yes", "Maybe", "No"]}
                                    placeholder="— unset —"
                                    onChange={(v) => set("likelihood", v)}
                                />
                            </Field>
                        </div>
                    </section>

                    {/* ── DANGER ZONE ── */}
                    <section className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
                            Danger Zone
                        </h3>
                        <p className="mb-3 text-xs text-red-500/70 leading-relaxed">
                            Permanently remove this guest from the database. This cannot be undone.
                        </p>
                        <button
                            onClick={() => void handleDelete()}
                            disabled={deleting}
                            className={`rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
                                confirmDelete
                                    ? "bg-red-600 text-white hover:bg-red-700"
                                    : "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                            } disabled:opacity-50`}
                        >
                            {deleting
                                ? "Deleting…"
                                : confirmDelete
                                ? "Confirm — permanently delete"
                                : "Remove guest"}
                        </button>
                        {confirmDelete && !deleting && (
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="ml-3 text-xs text-text-secondary/60 hover:text-text-secondary transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <div className="border-t border-primary/8 px-6 py-4">
                    {saveError && (
                        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                            {saveError}
                        </p>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-primary/12 bg-transparent px-4 py-3 text-sm text-text-secondary hover:bg-surface/60 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => void handleSave()}
                            disabled={saving}
                            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {saving ? "Saving…" : "Save changes"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
