"use client";
import Image from "next/image";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image-placeholder";

interface StoryImageProps {
  src: string;
  alt: string;
  fallback: string;
}

export default function StoryImage({ src, alt, fallback }: StoryImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(min-width: 768px) 50vw, 100vw"
      quality={72}
      placeholder="blur"
      blurDataURL={IMAGE_BLUR_DATA_URL}
      className="object-cover transition-transform duration-700 hover:scale-105"
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallback;
      }}
    />
  );
}
