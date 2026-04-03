"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_SESSION_EVENT, emitAdminSessionChange } from "@/components/admin/useAdminSession";

// ─── Types ────────────────────────────────────────────────────────────────────

type EditableType = "image" | "text" | "rich-text" | "image-indexed";

type RectSnapshot = {
    top: number;
    left: number;
    width: number;
    height: number;
    right: number;
    bottom: number;
};

type ImageOverlay = {
    color: string;
    opacity: number;
};

type ImageSettingValue = {
    main?: string;
    src?: string;
    overlay?: ImageOverlay | null;
};

type ImagePanelState = {
    mode: "image";
    key: string;
    currentUrl: string;
    currentOverlay: ImageOverlay | null;
    label: string;
};

type TextPanelState = {
    mode: "text";
    key: string;
    currentText: string;
    richText: boolean;
    label: string;
};

type PanelState = { mode: "closed" } | ImagePanelState | TextPanelState;

// ─── Key → human label map ───────────────────────────────────────────────────

const KEY_LABELS: Record<string, string> = {
    "images.hero": "Hero Photo",
    "home.intro": "Home Intro Text",
    "story.subtitle": "Story Page Subtitle",
    "couple.names": "Couple Names",
    "venue.name": "Venue Name",
    "venue.ceremonyTime": "Ceremony Time",
    "venue.cocktailTime": "Cocktail Hour Time",
    "venue.receptionTime": "Reception Time",
    "venue.sendOffTime": "Send-Off Time",
    "venue.parking": "Parking Info",
    "venue.shuttle": "Shuttle Info",
    "venue.mapsUrl": "Google Maps URL",
    "venue.mapsEmbedSrc": "Map Embed URL",
    "dresscode.short": "Dress Code (Short)",
    "dresscode.summary": "Dress Code Summary",
    "dresscode.ladies": "Attire — Ladies",
    "dresscode.gentlemen": "Attire — Gentlemen",
    "meta.title": "Page Title (SEO)",
    "meta.description": "Meta Description (SEO)",
};

function labelForKey(key: string): string {
    if (KEY_LABELS[key]) return KEY_LABELS[key];
    // Pattern-based labels
    const storyItem = key.match(/^story\.item\.(\d+)\.(title|description|year)$/);
    if (storyItem) return `Story #${Number(storyItem[1]) + 1} — ${storyItem[2]}`;
    const storyImg = key.match(/^story\.item\.(\d+)\.image$/);
    if (storyImg) return `Story #${Number(storyImg[1]) + 1} — Photo`;
    const faq = key.match(/^faq\.(\d+)\.(q|a)$/);
    if (faq) return `FAQ #${Number(faq[1]) + 1} — ${faq[2] === "q" ? "Question" : "Answer"}`;
    const sched = key.match(/^schedule\.(\d+)\.(time|title|description)$/);
    if (sched) return `Schedule #${Number(sched[1]) + 1} — ${sched[2]}`;
    const bridesmaid = key.match(/^bridal-party\.bridesmaids\.(\d+)\.image$/);
    if (bridesmaid) return `Bridesmaid #${Number(bridesmaid[1]) + 1} — Photo`;
    const groomsman = key.match(/^bridal-party\.groomsmen\.(\d+)\.image$/);
    if (groomsman) return `Groomsman #${Number(groomsman[1]) + 1} — Photo`;
    const attireL = key.match(/^images\.attire\.ladies\.(\d+)$/);
    if (attireL) return `Ladies Attire Photo #${Number(attireL[1]) + 1}`;
    const attireG = key.match(/^images\.attire\.gents\.(\d+)$/);
    if (attireG) return `Gents Attire Photo #${Number(attireG[1]) + 1}`;
    const reg = key.match(/^registry\.(\d+)\.(url|description|name)$/);
    if (reg) return `Registry #${Number(reg[1]) + 1} — ${reg[2]}`;
    const airport = key.match(/^travel\.airport\.(\d+)\.(name|description|url)$/);
    if (airport) return `Airport #${Number(airport[1]) + 1} — ${airport[2]}`;
    return key;
}

// ─── Site pages for edit-mode nav ─────────────────────────────────────────────

const SITE_PAGES = [
    { label: "Home", href: "/" },
    { label: "Our Story", href: "/our-story" },
    { label: "Details", href: "/wedding-details" },
    { label: "Schedule", href: "/schedule" },
    { label: "Bridal Party", href: "/bridal-party" },
    { label: "Attire", href: "/attire" },
    { label: "Registry", href: "/registry" },
    { label: "Travel", href: "/travel" },
    { label: "FAQ", href: "/faq" },
];

// ─── CSS injected when edit mode is active ────────────────────────────────────

const STYLE_ID = "admin-edit-bar-css";

const EDIT_CSS = `
  html.admin-edit-active [data-admin-key] {
    outline: 2px dashed rgba(251, 191, 36, 0.7) !important;
    outline-offset: 3px !important;
    cursor: crosshair !important;
    transition: outline-color 0.1s;
    position: relative;
  }
  html.admin-edit-active [data-admin-key]:hover {
    outline: 2px solid rgba(251, 191, 36, 1) !important;
    outline-offset: 3px !important;
  }
  html.admin-edit-active [data-admin-key]:hover::after {
    content: attr(data-admin-label);
    position: absolute;
    top: 4px;
    left: 4px;
    background: rgba(251, 191, 36, 0.95);
    color: #111;
    font-size: 10px;
    font-weight: 700;
    font-family: system-ui, sans-serif;
    padding: 2px 6px;
    border-radius: 4px;
    pointer-events: none;
    z-index: 9990;
    white-space: nowrap;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  html.admin-edit-active [data-admin-selected="true"] {
    outline: 3px solid rgba(251, 191, 36, 1) !important;
    outline-offset: 4px !important;
    box-shadow: 0 0 0 6px rgba(251, 191, 36, 0.18) !important;
  }
`;

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

const ALLOWED_RICH_TEXT_TAGS = new Set(["A", "B", "BR", "EM", "I", "LI", "OL", "P", "STRONG", "U", "UL"]);

function sanitizeRichTextHtml(html: string) {
    if (!html || typeof window === "undefined") return html;

    const parser = new DOMParser();
    const document = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const root = document.body.firstElementChild;

    if (!root) return "";

    const sanitizeNode = (node: Node) => {
        for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const element = child as HTMLElement;
                const originalHref = element.getAttribute("href")?.trim() ?? "";

                if (!ALLOWED_RICH_TEXT_TAGS.has(element.tagName)) {
                    while (element.firstChild) {
                        node.insertBefore(element.firstChild, element);
                    }
                    node.removeChild(element);
                    continue;
                }

                for (const attribute of Array.from(element.attributes)) {
                    element.removeAttribute(attribute.name);
                }

                if (element.tagName === "A") {
                    if (/^(https?:|mailto:|tel:|\/)/i.test(originalHref)) {
                        element.setAttribute("href", originalHref);
                    } else {
                        element.removeAttribute("href");
                    }
                    element.setAttribute("rel", "noopener noreferrer");
                }

                sanitizeNode(element);
                continue;
            }

            if (child.nodeType === Node.COMMENT_NODE) {
                node.removeChild(child);
            }
        }
    };

    sanitizeNode(root);
    return root.innerHTML;
}

function snapshotRect(element: HTMLElement): RectSnapshot {
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
    };
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiGetSettings(): Promise<Record<string, unknown>> {
    try {
        const r = await fetch("/api/admin/site-settings");
        if (!r.ok) return {};
        const { settings } = (await r.json()) as { settings: Record<string, unknown> };
        return settings ?? {};
    } catch {
        return {};
    }
}

async function apiSaveSetting(key: string, value: unknown): Promise<void> {
    const r = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
    });
    if (!r.ok) {
        const data = (await r.json()) as { error?: string };
        throw new Error(data.error ?? "Save failed");
    }
}

async function apiDeleteSetting(key: string): Promise<void> {
    const r = await fetch("/api/admin/site-settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
    });
    if (!r.ok) {
        const data = (await r.json()) as { error?: string };
        throw new Error(data.error ?? "Delete failed");
    }
}

// ─── Client-side image compression ───────────────────────────────────────────

/**
 * Compress an image File/Blob via Canvas so it's always < 3 MB before upload.
 * Vercel Serverless Functions cap the request body at ~4.5 MB; this ensures
 * even large phone photos (10+ MB) are safely resized first.
 */
async function compressImageFile(file: File | Blob, maxPx = 2400, quality = 0.88): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { naturalWidth: w, naturalHeight: h } = img;
            if (w > maxPx || h > maxPx) {
                if (w > h) { h = Math.round((h * maxPx) / w); w = maxPx; }
                else { w = Math.round((w * maxPx) / h); h = maxPx; }
            }
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
            canvas.toBlob(
                (blob) => { if (blob) resolve(blob); else reject(new Error("Compression failed")); },
                "image/jpeg",
                quality
            );
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
        img.src = url;
    });
}

async function apiUploadImage(file: File | Blob, filename?: string): Promise<string> {
    // Compress if it's a big File (e.g. from the file picker). Blobs from the
    // crop tool are already sized, so we skip re-compression for those.
    const toUpload = file instanceof File && file.size > 1_500_000
        ? await compressImageFile(file)
        : file;
    const fd = new FormData();
    fd.append("file", toUpload, filename ?? "upload.jpg");
    const r = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
    if (!r.ok) {
        // Guard against non-JSON responses (e.g. Vercel 413 "Request Entity Too Large")
        const text = await r.text();
        let msg = "Upload failed";
        try { msg = (JSON.parse(text) as { error?: string }).error ?? msg; } catch { msg = text.slice(0, 120); }
        throw new Error(msg);
    }
    const { url } = (await r.json()) as { url: string };
    return url;
}

// ─── SmartCropTool ─────────────────────────────────────────────────────────────

/** Returns [w, h] ratio matching the destination frame on the site for a given admin key */
function getFrameAspect(key: string): [number, number] {
    if (key.startsWith("bridal-party.")) return [3, 4];
    if (key.startsWith("story.item.")) return [4, 5];
    if (key === "images.hero") return [16, 7];
    if (key.startsWith("images.attire.")) return [3, 4];
    if (key.startsWith("images.")) return [16, 9];
    return [4, 3];
}

const FRAME_DISPLAY_W = 290; // px — matches drawer width

function SmartCropTool({
    imageUrl,
    adminKey,
    onCrop,
    onCancel,
}: {
    imageUrl: string;
    adminKey: string;
    onCrop: (blob: Blob) => void;
    onCancel: () => void;
}) {
    const [ratioW, ratioH] = getFrameAspect(adminKey);
    const frameH = Math.round(FRAME_DISPLAY_W * ratioH / ratioW);

    const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [applying, setApplying] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [cropError, setCropError] = useState<string | null>(null);

    const imgRef = useRef<HTMLImageElement>(null);
    const drag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

    // "Cover" scale — makes the image exactly fill the frame at zoom=1
    const coverScale = naturalSize
        ? Math.max(FRAME_DISPLAY_W / naturalSize.w, frameH / naturalSize.h)
        : 1;

    // Max pan so the image never exposes blank space inside the frame
    const maxPanX = naturalSize ? Math.max(0, (coverScale * zoom * naturalSize.w - FRAME_DISPLAY_W) / 2) : 0;
    const maxPanY = naturalSize ? Math.max(0, (coverScale * zoom * naturalSize.h - frameH) / 2) : 0;
    const clampPan = (p: typeof pan) => ({
        x: Math.max(-maxPanX, Math.min(maxPanX, p.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, p.y)),
    });
    const cp = clampPan(pan);

    // Image display size
    const dispW = naturalSize ? naturalSize.w * coverScale * zoom : FRAME_DISPLAY_W;
    const dispH = naturalSize ? naturalSize.h * coverScale * zoom : frameH;

    // Mouse drag to pan
    const onMouseDown = (e: React.MouseEvent) => {
        if (!naturalSize) return;
        e.preventDefault();
        drag.current = { sx: e.clientX, sy: e.clientY, px: cp.x, py: cp.y };
    };

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!drag.current) return;
            const dx = e.clientX - drag.current.sx;
            const dy = e.clientY - drag.current.sy;
            setPan(clampPan({ x: drag.current.px + dx, y: drag.current.py + dy }));
        };
        const onUp = () => { drag.current = null; };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxPanX, maxPanY]);

    const handleApply = async () => {
        if (!naturalSize || !imgRef.current) { setCropError("Image not loaded yet — wait a moment."); return; }
        setApplying(true);
        setCropError(null);
        try {
            const outW = 1200;
            const outH = Math.round(outW * ratioH / ratioW);
            const canvas = document.createElement("canvas");
            canvas.width = outW;
            canvas.height = outH;
            const ctx = canvas.getContext("2d")!;

            // Compute which slice of the natural image is visible in the frame
            const es = coverScale * zoom;
            const imgLeft = FRAME_DISPLAY_W / 2 + cp.x - dispW / 2;
            const imgTop = frameH / 2 + cp.y - dispH / 2;
            const srcX = Math.max(0, -imgLeft / es);
            const srcY = Math.max(0, -imgTop / es);
            const srcW = Math.min(naturalSize.w - srcX, FRAME_DISPLAY_W / es);
            const srcH = Math.min(naturalSize.h - srcY, frameH / es);

            ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
            canvas.toBlob(
                (blob) => {
                    if (blob) { onCrop(blob); }
                    else { setCropError("Export failed — try again."); setApplying(false); }
                },
                "image/jpeg", 0.92
            );
        } catch (e) {
            setCropError((e as Error).message);
            setApplying(false);
        }
    };

    const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    return (
        <div className="space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">
                <strong>Drag</strong> the image to reposition · <strong>Zoom slider</strong> to fill the frame. The amber border is the exact crop.
            </p>

            {/* Frame preview */}
            <div
                className="mx-auto overflow-hidden relative select-none rounded-sm border-2 border-amber-400"
                style={{ width: FRAME_DISPLAY_W, height: frameH, cursor: naturalSize ? (drag.current ? "grabbing" : "grab") : "default" }}
                onMouseDown={onMouseDown}
            >
                {/* Checkerboard bg */}
                <div className="absolute inset-0" style={{
                    background: "repeating-conic-gradient(#d1d5db 0% 25%, #e5e7eb 0% 50%) 0 0 / 12px 12px",
                }} />
                {/* The image, positioned manually via transform */}
                {!loadError && imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        ref={imgRef}
                        src={imageUrl}
                        alt=""
                        crossOrigin="anonymous"
                        draggable={false}
                        onLoad={(e) => {
                            const t = e.currentTarget;
                            setNaturalSize({ w: t.naturalWidth, h: t.naturalHeight });
                        }}
                        onError={() => setLoadError(true)}
                        style={{
                            position: "absolute",
                            width: dispW,
                            height: dispH,
                            left: "50%",
                            top: "50%",
                            transform: `translate(calc(-50% + ${cp.x}px), calc(-50% + ${cp.y}px))`,
                            maxWidth: "none",
                            pointerEvents: "none",
                            userSelect: "none",
                        }}
                    />
                )}
                {loadError && (
                    <div className="absolute inset-0 flex items-center justify-center text-center text-xs text-gray-400 p-4">
                        Couldn&apos;t load image for cropping.
                        <br />Upload via &ldquo;↑ Upload Photo&rdquo; first.
                    </div>
                )}
                {!naturalSize && !loadError && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                        Loading…
                    </div>
                )}
            </div>

            {/* Ratio label */}
            <p className="text-center text-xs text-gray-400">
                {ratioW}:{ratioH} — matches the frame on the page
            </p>

            {/* Zoom slider */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 shrink-0">Zoom</span>
                <input
                    type="range" min={1} max={3} step={0.05}
                    value={zoom}
                    onChange={(e) => { setZoom(+e.target.value); setPan(p => clampPan(p)); }}
                    className="flex-1 accent-amber-400"
                    disabled={!naturalSize}
                />
                <span className="text-xs text-gray-400 w-8 text-right">{zoom.toFixed(1)}×</span>
                <button onClick={resetView} className="text-xs text-gray-400 hover:text-gray-700 transition-colors ml-1" title="Reset view">↺</button>
            </div>

            {cropError && <p className="text-xs text-red-600 bg-red-50 rounded p-2">{cropError}</p>}

            <div className="flex gap-2">
                <button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
                    ← Back
                </button>
                <button
                    onClick={() => void handleApply()}
                    disabled={!naturalSize || applying || loadError}
                    className="flex-1 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-900 text-sm font-semibold transition-colors"
                >
                    {applying ? "Exporting…" : "Apply Crop"}
                </button>
            </div>
        </div>
    );
}


// ─── RichTextToolbar ──────────────────────────────────────────────────────────

function RichTextToolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
    const exec = (cmd: string, value?: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, value);
    };

    return (
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-primary/10 bg-[#f8f4ec] p-2">
            {[
                { label: "B", title: "Bold", cmd: "bold", style: "font-bold" },
                { label: "I", title: "Italic", cmd: "italic", style: "italic" },
                { label: "U", title: "Underline", cmd: "underline", style: "underline" },
            ].map(({ label, title, cmd, style }) => (
                <button
                    key={cmd}
                    title={title}
                    onMouseDown={(e) => { e.preventDefault(); exec(cmd); }}
                    className={`rounded-full border border-primary/10 bg-white px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/5 ${style}`}
                >
                    {label}
                </button>
            ))}
            <button
                title="Bulleted List"
                onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }}
                className="rounded-full border border-primary/10 bg-white px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/5"
            >
                List
            </button>
            <button
                title="Link"
                onMouseDown={(e) => {
                    e.preventDefault();
                    const url = window.prompt("Enter URL:", "https://");
                    if (url) exec("createLink", url);
                }}
                className="rounded-full border border-primary/10 bg-white px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/5"
            >
                Link
            </button>
            <button
                title="Clear Formatting"
                onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); }}
                className="rounded-full border border-primary/10 bg-white px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/5"
            >
                Clear
            </button>
        </div>
    );
}

function SelectionShell({
    rect,
    mode,
    children,
}: {
    rect: RectSnapshot;
    mode: "text" | "image";
    children: React.ReactNode;
}) {
    const isText = mode === "text";
    const width = isText
        ? clamp(Math.max(rect.width, 360), 360, Math.min(window.innerWidth - 32, 860))
        : clamp(Math.max(rect.width, 460), 460, Math.min(window.innerWidth - 32, 760));
    const maxHeight = isText ? window.innerHeight - 110 : window.innerHeight - 120;
    const left = clamp(isText ? rect.left - 8 : rect.left + rect.width / 2 - width / 2, 16, window.innerWidth - width - 16);
    const estimatedHeight = isText ? Math.min(Math.max(rect.height + 38, 220), maxHeight) : Math.min(520, maxHeight);
    const preferBelow = !isText && rect.bottom + estimatedHeight + 20 < window.innerHeight;
    const top = isText
        ? clamp(rect.top - 8, 72, Math.max(72, window.innerHeight - estimatedHeight - 16))
        : preferBelow
            ? rect.bottom + 14
            : clamp(rect.top - estimatedHeight - 14, 72, Math.max(72, window.innerHeight - estimatedHeight - 16));

    return (
        <div
            className="fixed z-[9999] rounded-[1.75rem] border border-primary/12 bg-[linear-gradient(180deg,#fffdfa_0%,#f7f1e8_100%)] shadow-[0_28px_80px_rgba(20,42,68,0.24)]"
            style={{
                left,
                top,
                width,
                maxHeight,
            }}
        >
            {children}
        </div>
    );
}

function ImageEditPanel({
    state,
    rect,
    settings,
    onClose,
    onRefresh,
}: {
    state: ImagePanelState;
    rect: RectSnapshot;
    settings: Record<string, unknown>;
    onClose: () => void;
    onRefresh: () => void;
}) {
    const [url, setUrl] = useState(state.currentUrl);
    const [hasOverlay, setHasOverlay] = useState(!!state.currentOverlay);
    const [overlay, setOverlay] = useState<ImageOverlay>(state.currentOverlay ?? { color: "#0f2439", opacity: 0.2 });
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCrop, setShowCrop] = useState(false);
    const [croppingUrl, setCroppingUrl] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        setUploading(true);
        setError(null);
        try {
            const newUrl = await apiUploadImage(file);
            setUrl(newUrl);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setUploading(false);
        }
    };

    const handleCrop = async (blob: Blob) => {
        setUploading(true);
        setError(null);
        setShowCrop(false);
        try {
            const newUrl = await apiUploadImage(blob, `cropped-${Date.now()}.jpg`);
            setUrl(newUrl);
            setCroppingUrl(null);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const key = state.key;
            if (key === "images.hero") {
                const current = (settings[key] as ImageSettingValue) ?? {};
                await apiSaveSetting(key, { ...current, main: url, overlay: hasOverlay ? overlay : null });
            } else if (key.startsWith("images.attire.")) {
                await apiSaveSetting(key, { src: url, overlay: hasOverlay ? overlay : null });
            } else if (key.startsWith("story.item.") && key.endsWith(".image")) {
                const current = (settings[key] as ImageSettingValue) ?? {};
                await apiSaveSetting(key, { ...current, main: url, overlay: hasOverlay ? overlay : null });
            } else if (key.startsWith("bridal-party.")) {
                await apiSaveSetting(key, url);
            } else {
                await apiSaveSetting(key, { url, overlay: hasOverlay ? overlay : null });
            }
            onClose();
            onRefresh();
        } catch (e) {
            setError((e as Error).message);
            setSaving(false);
        }
    };

    const handleRestore = async () => {
        if (!confirm("Restore the original image for this section?")) return;
        setSaving(true);
        setError(null);
        try {
            await apiDeleteSetting(state.key);
            onClose();
            onRefresh();
        } catch (e) {
            setError((e as Error).message);
            setSaving(false);
        }
    };

    if (showCrop && croppingUrl) {
        return (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-primary/35 p-6 backdrop-blur-sm">
                <div className="w-full max-w-[420px] rounded-[1.75rem] border border-primary/12 bg-white p-5 shadow-[0_28px_80px_rgba(20,42,68,0.28)]">
                    <SmartCropTool imageUrl={croppingUrl} adminKey={state.key} onCrop={handleCrop} onCancel={() => setShowCrop(false)} />
                </div>
            </div>
        );
    }

    return (
        <SelectionShell rect={rect} mode="image">
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-accent">Image Editor</p>
                        <h2 className="mt-2 text-base font-semibold text-primary">{state.label}</h2>
                        <p className="mt-1 text-[11px] font-mono text-text-secondary">{state.key}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-white text-lg leading-none text-text-secondary transition-colors hover:bg-primary/5 hover:text-primary"
                    >
                        ×
                    </button>
                </div>

                <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 bg-[#eef2f6]" style={{ minHeight: Math.max(220, Math.min(rect.height * 1.1, 320)) }}>
                    {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-text-secondary">
                            No image selected
                        </div>
                    )}
                    {hasOverlay && overlay.opacity > 0 ? (
                        <div
                            className="pointer-events-none absolute inset-0"
                            style={{ backgroundColor: overlay.color, opacity: overlay.opacity }}
                        />
                    ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-accent/85 disabled:opacity-50"
                    >
                        {uploading ? "Uploading…" : "Upload"}
                    </button>
                    <button
                        onClick={() => { setCroppingUrl(url); setShowCrop(true); }}
                        disabled={!url || uploading}
                        className="rounded-full border border-primary/12 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/5 disabled:opacity-40"
                    >
                        Crop
                    </button>
                    <button
                        onClick={() => void handleRestore()}
                        disabled={saving}
                        className="rounded-full border border-secondary/20 bg-secondary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-secondary transition-colors hover:bg-secondary/10 disabled:opacity-40"
                    >
                        Restore Default
                    </button>
                </div>

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleFile(file);
                    }}
                />

                <div className="mt-4 space-y-4 rounded-[1.25rem] border border-primary/10 bg-white/80 p-4">
                    <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-text-secondary">Image URL</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-xl border border-primary/12 bg-white px-3 py-2.5 text-xs font-mono text-primary outline-none transition-colors focus:border-primary/35 focus:ring-2 focus:ring-primary/10"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-primary">
                            <input
                                type="checkbox"
                                checked={hasOverlay}
                                onChange={(e) => setHasOverlay(e.target.checked)}
                                className="h-4 w-4 rounded accent-accent"
                            />
                            Overlay controls
                        </label>
                        {hasOverlay ? (
                            <div className="grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-center">
                                <input
                                    type="color"
                                    value={overlay.color}
                                    onChange={(e) => setOverlay((current) => ({ ...current, color: e.target.value }))}
                                    className="h-10 w-14 rounded-lg border border-primary/12 bg-white"
                                />
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={overlay.opacity}
                                    onChange={(e) => setOverlay((current) => ({ ...current, opacity: +e.target.value }))}
                                    className="w-full accent-accent"
                                />
                                <span className="text-xs text-text-secondary">{Math.round(overlay.opacity * 100)}%</span>
                            </div>
                        ) : null}
                    </div>
                </div>

                {error ? (
                    <p className="mt-4 rounded-xl bg-secondary/8 px-3 py-2 text-xs text-secondary">{error}</p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3 border-t border-primary/10 pt-4">
                    <button
                        onClick={onClose}
                        className="rounded-full border border-primary/12 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/5"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => void handleSave()}
                        disabled={saving || uploading}
                        className="rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </SelectionShell>
    );
}

function TextEditPanel({
    state,
    rect,
    onClose,
    onRefresh,
}: {
    state: TextPanelState;
    rect: RectSnapshot;
    onClose: () => void;
    onRefresh: () => void;
}) {
    const [richMode, setRichMode] = useState(state.richText);
    const [text, setText] = useState(state.currentText);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (richMode && editorRef.current) {
            editorRef.current.innerHTML = sanitizeRichTextHtml(state.currentText);
            editorRef.current.focus();
        }
    }, [richMode, state.currentText]);

    const getRichContent = () => sanitizeRichTextHtml(editorRef.current?.innerHTML ?? text);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const value = richMode ? getRichContent() : text;
            await apiSaveSetting(state.key, value);
            onClose();
            onRefresh();
        } catch (e) {
            setError((e as Error).message);
            setSaving(false);
        }
    };

    const handleRestore = async () => {
        if (!confirm("Restore the original text for this field?")) return;
        setSaving(true);
        setError(null);
        try {
            await apiDeleteSetting(state.key);
            onClose();
            onRefresh();
        } catch (e) {
            setError((e as Error).message);
            setSaving(false);
        }
    };

    return (
        <SelectionShell rect={rect} mode="text">
            <div className="flex max-h-[calc(100vh-7rem)] flex-col p-4">
                <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-accent">Inline Text Editor</p>
                        <h2 className="mt-2 text-base font-semibold text-primary">{state.label}</h2>
                        <p className="mt-1 text-[11px] font-mono text-text-secondary">{state.key}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-white text-lg leading-none text-text-secondary transition-colors hover:bg-primary/5 hover:text-primary"
                    >
                        ×
                    </button>
                </div>

                <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="text-xs text-text-secondary">
                        Editing directly over the selected content instead of using the side drawer.
                    </p>
                    <label className="flex items-center gap-2 text-xs text-text-secondary">
                        <input
                            type="checkbox"
                            checked={richMode}
                            onChange={(e) => {
                                if (!e.target.checked && editorRef.current) {
                                    setText(editorRef.current.innerText);
                                }
                                setRichMode(e.target.checked);
                            }}
                            className="h-4 w-4 accent-accent"
                        />
                        Rich text
                    </label>
                </div>

                {richMode ? <RichTextToolbar editorRef={editorRef} /> : null}

                <div className="mt-3 flex-1 overflow-hidden">
                    {richMode ? (
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            className="h-full min-h-[200px] overflow-y-auto rounded-[1.35rem] border border-primary/12 bg-white px-4 py-4 text-sm leading-relaxed text-primary outline-none focus:border-primary/35 focus:ring-2 focus:ring-primary/10"
                        />
                    ) : (
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="h-full min-h-[200px] w-full resize-none rounded-[1.35rem] border border-primary/12 bg-white px-4 py-4 text-sm leading-relaxed text-primary outline-none focus:border-primary/35 focus:ring-2 focus:ring-primary/10"
                        />
                    )}
                </div>

                {error ? (
                    <p className="mt-3 rounded-xl bg-secondary/8 px-3 py-2 text-xs text-secondary">{error}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3 border-t border-primary/10 pt-4">
                    <button
                        onClick={onClose}
                        className="rounded-full border border-primary/12 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/5"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => void handleRestore()}
                        disabled={saving}
                        className="rounded-full border border-secondary/20 bg-secondary/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-secondary transition-colors hover:bg-secondary/10 disabled:opacity-50"
                    >
                        Restore Default
                    </button>
                    <button
                        onClick={() => void handleSave()}
                        disabled={saving}
                        className="rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </SelectionShell>
    );
}

// ─── Edit-mode site nav ───────────────────────────────────────────────────────

function EditModeNav({ currentPath }: { currentPath: string }) {
    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9996] flex items-center gap-1 px-4 py-2 overflow-x-auto"
            style={{
                background: "rgba(10,10,15,0.92)",
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                fontFamily: "system-ui,-apple-system,sans-serif",
            }}
        >
            <span
                style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: "#fbbf24",
                    marginRight: 8,
                    flexShrink: 0,
                }}
            >
                ✎ BROWSING:
            </span>
            {SITE_PAGES.map((page) => {
                const active = currentPath === page.href;
                return (
                    <Link
                        key={page.href}
                        href={page.href}
                        style={{
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: active ? 700 : 500,
                            color: active ? "#111827" : "#d1d5db",
                            background: active ? "#fbbf24" : "rgba(255,255,255,0.06)",
                            border: "1px solid",
                            borderColor: active ? "#fbbf24" : "rgba(255,255,255,0.1)",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                            transition: "background 0.15s",
                            flexShrink: 0,
                        }}
                    >
                        {page.label}
                    </Link>
                );
            })}
        </div>
    );
}

// ─── AdminEditBar (main component, rendered in layout) ────────────────────────

export default function AdminEditBar() {
    const [role, setRole] = useState<string | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [panel, setPanel] = useState<PanelState>({ mode: "closed" });
    const [settings, setSettings] = useState<Record<string, unknown>>({});
    const [selectionRect, setSelectionRect] = useState<RectSnapshot | null>(null);
    const selectedElementRef = useRef<HTMLElement | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null);
    const toolbarRef = useRef<HTMLDivElement | null>(null);

    const pathname = usePathname();
    const router = useRouter();

    const syncSession = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/session", {
                method: "GET",
                cache: "no-store",
                credentials: "same-origin",
            });

            if (!response.ok) {
                setRole(null);
                setEditMode(false);
                return;
            }

            const data = (await response.json()) as { role?: string };
            setRole(data.role ?? null);
        } catch {
            setRole(null);
            setEditMode(false);
        } finally {
            setSessionLoading(false);
        }
    }, []);

    // Re-check session whenever the route changes.
    // usePathname() from next/navigation updates correctly on every soft navigation
    // without MutationObserver hacks or stale closures.
    useEffect(() => {
        let cancelled = false;

        void (async () => {
            try {
                const response = await fetch("/api/admin/session", {
                    cache: "no-store",
                    credentials: "same-origin",
                });

                if (cancelled) return;

                if (response.ok) {
                    const data = (await response.json()) as { role?: string };
                    if (!cancelled) {
                        setRole(data.role ?? null);
                    }
                } else if (!cancelled) {
                    setRole(null);
                    setEditMode(false);
                }
            } catch {
                if (!cancelled) {
                    setRole(null);
                    setEditMode(false);
                }
            } finally {
                if (!cancelled) setSessionLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [pathname]);

    // 2. Inject edit-mode CSS once
    useEffect(() => {
        let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
        if (!el) {
            el = document.createElement("style");
            el.id = STYLE_ID;
            document.head.appendChild(el);
        }
        el.textContent = EDIT_CSS;
    }, []);

    // 3. Toggle html class + prefetch settings when edit mode turns on
    useEffect(() => {
        if (editMode) {
            document.documentElement.classList.add("admin-edit-active");
            void apiGetSettings().then(setSettings);
        } else {
            document.documentElement.classList.remove("admin-edit-active");
        }
        return () => {
            document.documentElement.classList.remove("admin-edit-active");
        };
    }, [editMode]);

    // 4. Push body down when edit nav is showing
    useEffect(() => {
        if (editMode) {
            document.body.style.paddingTop = "40px";
        } else {
            document.body.style.paddingTop = "";
        }
        return () => { document.body.style.paddingTop = ""; };
    }, [editMode]);

    const clearSelectedElement = useCallback(() => {
        if (selectedElementRef.current) {
            delete selectedElementRef.current.dataset.adminSelected;
        }
        selectedElementRef.current = null;
        setSelectionRect(null);
    }, []);

    const refreshSelectionRect = useCallback(() => {
        if (!selectedElementRef.current) return;
        setSelectionRect(snapshotRect(selectedElementRef.current));
    }, []);

    const closeAdminChrome = useCallback(() => {
        setSettingsOpen(false);
        setEditMode(false);
        setPanel({ mode: "closed" });
        clearSelectedElement();
    }, [clearSelectedElement]);

    useEffect(() => {
        const handleSessionChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ role: string; status: "authenticated" | "unauthenticated" }>;
            if (customEvent.detail.status === "authenticated") {
                setRole(customEvent.detail.role || null);
                setSessionLoading(false);
                return;
            }

            closeAdminChrome();
            setRole(null);
            setSessionLoading(false);
        };

        const handleWindowFocus = () => {
            void syncSession();
        };

        window.addEventListener(ADMIN_SESSION_EVENT, handleSessionChange as EventListener);
        window.addEventListener("focus", handleWindowFocus);

        return () => {
            window.removeEventListener(ADMIN_SESSION_EVENT, handleSessionChange as EventListener);
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, [closeAdminChrome, syncSession]);

    const handleLogout = useCallback(async () => {
        setLoggingOut(true);
        try {
            await fetch("/api/admin/session", {
                method: "DELETE",
                credentials: "same-origin",
            });
        } finally {
            closeAdminChrome();
            setRole(null);
            setSessionLoading(false);
            emitAdminSessionChange({ role: "", status: "unauthenticated" });
            setLoggingOut(false);
        }
    }, [closeAdminChrome]);

    // 5. Capture-phase click handler — intercepts clicks on [data-admin-key] elements
    const handleClick = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const editable = target.closest("[data-admin-key]") as HTMLElement | null;
        if (!editable) return;

        e.preventDefault();
        e.stopPropagation();

        const key = editable.dataset.adminKey!;
        const type = (editable.dataset.adminType as EditableType) ?? "text";
        const label = labelForKey(key);
        if (selectedElementRef.current && selectedElementRef.current !== editable) {
            delete selectedElementRef.current.dataset.adminSelected;
        }
        editable.dataset.adminSelected = "true";
        selectedElementRef.current = editable;
        setSelectionRect(snapshotRect(editable));

        if (type === "image" || type === "image-indexed") {
            const currentUrl =
                editable.dataset.adminCurrentUrl ??
                (editable.querySelector("img") as HTMLImageElement | null)?.src ??
                "";
            const settingVal = settings[key] as ImageSettingValue | null;
            const currentOverlay = settingVal?.overlay ?? null;
            setPanel({ mode: "image", key, currentUrl, currentOverlay, label });
        } else {
            const richText = type === "rich-text";
            // For plain text: use innerText (strips React <!-- --> comment nodes)
            // For rich text: use innerHTML (preserves formatting)
            // Always prefer data-admin-current-text if set (handles composite elements
            // like the date display where the DOM combines multiple data fields)
            const currentText = editable.dataset.adminCurrentText
                ?? (richText ? editable.innerHTML : editable.innerText)
                ?? ""; 
            setPanel({ mode: "text", key, currentText: currentText.trim(), richText, label });
        }
    }, [settings]);

    useEffect(() => {
        if (!editMode) return;
        document.addEventListener("click", handleClick, true);
        return () => document.removeEventListener("click", handleClick, true);
    }, [editMode, handleClick]);

    useEffect(() => {
        if (!editMode || panel.mode === "closed") return;

        const onWindowChange = () => refreshSelectionRect();
        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.closest("[data-admin-key]")) return;
            if (editorRef.current?.contains(target)) return;
            setPanel({ mode: "closed" });
            clearSelectedElement();
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            setPanel({ mode: "closed" });
            clearSelectedElement();
        };

        window.addEventListener("scroll", onWindowChange, true);
        window.addEventListener("resize", onWindowChange);
        document.addEventListener("mousedown", onPointerDown, true);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("scroll", onWindowChange, true);
            window.removeEventListener("resize", onWindowChange);
            document.removeEventListener("mousedown", onPointerDown, true);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [clearSelectedElement, editMode, panel.mode, refreshSelectionRect]);

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            clearSelectedElement();
            setPanel({ mode: "closed" });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [clearSelectedElement, pathname]);

    useEffect(() => {
        if (!settingsOpen) return;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (toolbarRef.current?.contains(target)) return;
            setSettingsOpen(false);
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSettingsOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown, true);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown, true);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [settingsOpen]);

    // Don't render anything until session confirmed, and only for Master role
    // Also hide on admin dashboard pages — the bar is only for public-facing pages
    if (sessionLoading || role !== "Master") return null;
    if (pathname.startsWith("/admin")) return null;

    return (
        <>
            {/* Edit-mode page nav */}
            {editMode && <EditModeNav currentPath={pathname} />}

            {/* ── Floating admin toolbar ── */}
            <div
                ref={toolbarRef}
                className="fixed bottom-3 left-1/2 z-[9997] flex -translate-x-1/2 items-center gap-1.5 rounded-full px-2.5 py-1.5 shadow-2xl select-none pointer-events-auto md:bottom-5 md:gap-3 md:px-5 md:py-2.5"
                style={{
                    background: "rgba(10,10,15,0.92)",
                    backdropFilter: "blur(12px)",
                    fontFamily: "system-ui,-apple-system,sans-serif",
                    fontSize: "12px",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                {/* Status dot */}
                <span
                    className="h-2 w-2 rounded-full shrink-0 transition-colors duration-300"
                    style={{ backgroundColor: editMode ? "#fbbf24" : "#4b5563" }}
                />

                {/* Label */}
                <span className="hidden sm:inline" style={{ color: "#9ca3af", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
                    ADMIN
                </span>

                {/* Divider */}
                <span className="hidden sm:inline-block" style={{ width: 1, height: 16, background: "#374151" }} />

                {/* Edit mode toggle */}
                <button
                    onClick={() => {
                        setEditMode((current) => {
                            const next = !current;
                            if (!next) {
                                clearSelectedElement();
                                setPanel({ mode: "closed" });
                            }
                            return next;
                        });
                    }}
                    style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        transition: "background 0.15s, color 0.15s",
                        background: editMode ? "#fbbf24" : "#374151",
                        color: editMode ? "#111827" : "#d1d5db",
                    }}
                >
                    {editMode ? "Edit On" : "Edit"}
                </button>

                {/* Hint + admin links when not editing */}
                {!editMode && (
                    <>
                        <span style={{ width: 1, height: 16, background: "#374151", display: "inline-block" }} />
                        <a
                            href="/admin"
                            style={{ fontSize: "11px", color: "#9ca3af", textDecoration: "none" }}
                        >
                            Dashboard
                        </a>
                    </>
                )}

                <span style={{ width: 1, height: 16, background: "#374151", display: "inline-block" }} />

                <button
                    onClick={() => setSettingsOpen((current) => !current)}
                    style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 600,
                        border: "1px solid rgba(255,255,255,0.08)",
                        cursor: "pointer",
                        transition: "background 0.15s, color 0.15s, border-color 0.15s",
                        background: settingsOpen ? "#1f2937" : "transparent",
                        color: "#d1d5db",
                    }}
                >
                    Settings
                </button>

                {settingsOpen ? (
                    <div
                        className="absolute bottom-[calc(100%+12px)] right-0 min-w-[220px] rounded-3xl p-3 shadow-2xl"
                        style={{
                            background: "rgba(10,10,15,0.96)",
                            backdropFilter: "blur(16px)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        <div style={{ padding: "6px 8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#f9fafb", textTransform: "uppercase" }}>
                                Admin Settings
                            </div>
                            <div style={{ marginTop: 4, fontSize: "11px", lineHeight: 1.45, color: "#9ca3af" }}>
                                Turn editing off or sign out of admin mode from any page.
                            </div>
                        </div>

                        <div style={{ display: "grid", gap: 8, paddingTop: 10 }}>
                            <button
                                onClick={() => {
                                    closeAdminChrome();
                                    setSettingsOpen(false);
                                }}
                                style={{
                                    width: "100%",
                                    borderRadius: 16,
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    background: "#111827",
                                    color: "#f3f4f6",
                                    padding: "10px 12px",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                }}
                            >
                                Exit editing on this page
                            </button>

                            <button
                                onClick={() => void handleLogout()}
                                disabled={loggingOut}
                                style={{
                                    width: "100%",
                                    borderRadius: 16,
                                    border: "1px solid rgba(248,113,113,0.25)",
                                    background: loggingOut ? "#3f3f46" : "#7f1d1d",
                                    color: "#fef2f2",
                                    padding: "10px 12px",
                                    textAlign: "left",
                                    cursor: loggingOut ? "wait" : "pointer",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                }}
                            >
                                {loggingOut ? "Signing out..." : "Log out of admin mode"}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            {panel.mode !== "closed" && selectionRect ? (
                <div ref={editorRef}>
                    {panel.mode === "image" ? (
                        <ImageEditPanel
                            state={panel}
                            rect={selectionRect}
                            settings={settings}
                            onClose={() => {
                                setPanel({ mode: "closed" });
                                clearSelectedElement();
                            }}
                            onRefresh={() => router.refresh()}
                        />
                    ) : (
                        <TextEditPanel
                            state={panel}
                            rect={selectionRect}
                            onClose={() => {
                                setPanel({ mode: "closed" });
                                clearSelectedElement();
                            }}
                            onRefresh={() => router.refresh()}
                        />
                    )}
                </div>
            ) : null}
        </>
    );
}
