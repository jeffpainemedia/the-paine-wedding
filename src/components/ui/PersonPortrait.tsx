"use client";
import Image from "next/image";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image-placeholder";

const DEFAULT_FALLBACK =
    "/images/hero/JeffAshlyn-7977_2.jpg";

/** Client component for bridal party portraits with onError fallback and admin-key */
export function PersonPortrait({
    src,
    fallback,
    name,
    role,
    relationship,
    adminKey,
}: {
    src: string;
    fallback: string;
    name: string;
    role: string;
    relationship: string;
    adminKey: string;
}) {
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ");

    // Allow local paths (starting with /) as well as absolute https URLs.
    // Fall back to Unsplash only if src is empty or an unrecognised format.
    const safeSrc =
        src && (src.startsWith("/") || /^https?:\/\//.test(src))
            ? src
            : fallback || DEFAULT_FALLBACK;

    return (
        <div className="group text-center">
            <div
                className="relative aspect-[3/4] w-full mb-6 overflow-hidden rounded-[1.7rem] border border-primary/10 shadow-[0_20px_44px_rgba(20,42,68,0.09)]"
                data-admin-key={adminKey}
                data-admin-type="image"
                data-admin-current-url={safeSrc}
                data-admin-label={`${name} — Photo`}
            >
                <Image
                    src={safeSrc}
                    alt={name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    quality={68}
                    placeholder="blur"
                    blurDataURL={IMAGE_BLUR_DATA_URL}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = fallback || DEFAULT_FALLBACK;
                    }}
                />
            </div>
            <h3 className="font-heading text-xl text-primary leading-tight">
                <span className="block">{firstName}</span>
                {lastName && <span className="block">{lastName}</span>}
            </h3>
            <p className="uppercase tracking-[0.2em] text-xs text-text-secondary mt-2">{role}</p>
            {relationship && (
                <p className="text-xs text-text-secondary/60 mt-1 italic">{relationship}</p>
            )}
        </div>
    );
}
