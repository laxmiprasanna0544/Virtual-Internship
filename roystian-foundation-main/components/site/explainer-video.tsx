"use client";

import * as React from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The one-minute introduction to Roystian Foundation (vertical 9:16 reel).
 *
 * Built for smooth browsing:
 * - Until the visitor presses play, only the cover image loads (optimised by
 *   next/image); the video itself costs nothing on page load.
 * - Two web-optimised H.264 encodes with the index at the start of the file,
 *   so playback starts at once and seeking uses HTTP range requests from the
 *   CDN: 720p (~12 MB) normally, 480p (~6 MB) when the browser asks to save
 *   data or reports a slow connection.
 * - Plays inline (never full-screen hijack on iPhone), with native controls,
 *   and pauses itself when scrolled out of view.
 * - The 9:16 frame is reserved up front, so nothing shifts as it loads.
 */

const SOURCES = {
  hd: "/videos/roystian-explainer-720.mp4",
  sd: "/videos/roystian-explainer-480.mp4",
};
const POSTER = "/videos/roystian-explainer-poster.jpg";
const DURATION_LABEL = "1:01";

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

function chooseSource(): string {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection?.saveData) return SOURCES.sd;
  if (/(^|-)(2g|3g)$/.test(connection?.effectiveType ?? "")) return SOURCES.sd;
  return SOURCES.hd;
}

export function ExplainerVideo({ className }: { className?: string }) {
  const [src, setSrc] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const frameRef = React.useRef<HTMLDivElement>(null);

  // Pause when the player leaves the viewport, so audio never plays off-screen.
  React.useEffect(() => {
    if (!src || !frameRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.25) videoRef.current?.pause();
      },
      { threshold: [0, 0.25] },
    );
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, [src]);

  React.useEffect(() => {
    if (src) videoRef.current?.focus({ preventScroll: true });
  }, [src]);

  return (
    <div
      ref={frameRef}
      className={cn(
        "relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-[1.75rem] border border-border bg-black shadow-card",
        className,
      )}
    >
      {src && !failed ? (
        <video
          ref={videoRef}
          src={src}
          poster={POSTER}
          controls
          autoPlay
          playsInline
          preload="auto"
          controlsList="nodownload"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover focus:outline-none"
          aria-label="Roystian Foundation in one minute"
        >
          Your browser can&apos;t play this video.
        </video>
      ) : (
        <button
          type="button"
          onClick={() => {
            setFailed(false);
            setSrc(chooseSource());
          }}
          className="group absolute inset-0 h-full w-full text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring"
          aria-label={`Play the ${DURATION_LABEL} introduction to Roystian Foundation`}
        >
          <Image
            src={POSTER}
            alt=""
            fill
            sizes="(max-width: 640px) 90vw, 360px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" aria-hidden="true" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg transition-transform duration-200 group-hover:scale-110">
            <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />
          </span>
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4 text-white">
            <span className="text-sm font-medium">
              {failed ? "The video couldn't load. Tap to try again." : "Watch the introduction"}
            </span>
            <span className="rounded-md bg-black/60 px-2 py-0.5 font-mono text-xs">{DURATION_LABEL}</span>
          </span>
        </button>
      )}
    </div>
  );
}
