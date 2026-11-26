"use client";

import { useRef, useState } from "react";
import { saveVideoPosition } from "@/app/(parent)/club/actions";
import { formatClock } from "@/lib/format";

export function VideoGuide({
  provider,
  src,
  minutes,
  resumeSeconds,
  stepId,
  childIds,
}: {
  provider: "mp4" | "youtube" | "vimeo" | "storage" | "none";
  src: string;
  minutes: number;
  resumeSeconds: number;
  stepId: string;
  childIds: string[];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSent = useRef(resumeSeconds);
  const [playing, setPlaying] = useState(false);
  const resume = resumeSeconds > 3;

  function remember(seconds: number) {
    if (childIds.length === 0 || Math.abs(seconds - lastSent.current) < 5) return;
    lastSent.current = seconds;
    void saveVideoPosition({ stepId, childIds, seconds: Math.floor(seconds) });
  }

  const fileSrc = provider === "mp4" || provider === "storage" ? src : "";
  const youtube = provider === "youtube" && src
    ? `https://www.youtube-nocookie.com/embed/${src}?start=${Math.floor(resumeSeconds)}&rel=0`
    : "";
  const vimeo = provider === "vimeo" && src
    ? `https://player.vimeo.com/video/${src}#t=${Math.floor(resumeSeconds)}s`
    : "";

  return (
    <div className="relative overflow-hidden rounded-[22px] bg-[#1b4332] aspect-video">
      {fileSrc && (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={fileSrc}
          controls={playing}
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => {
            if (resumeSeconds > 3) event.currentTarget.currentTime = resumeSeconds;
          }}
          onTimeUpdate={(event) => remember(event.currentTarget.currentTime)}
          onPause={(event) => remember(event.currentTarget.currentTime)}
        />
      )}
      {youtube && playing && (
        <iframe className="absolute inset-0 h-full w-full" src={youtube} title="Video guide" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      )}
      {vimeo && playing && (
        <iframe className="absolute inset-0 h-full w-full" src={vimeo} title="Video guide" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
      )}
      {!playing && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center"
          onClick={() => {
            setPlaying(true);
            const node = videoRef.current;
            if (node) {
              if (resumeSeconds > 3) node.currentTime = resumeSeconds;
              void node.play();
            }
          }}
        >
          <svg viewBox="0 0 320 180" className="absolute inset-0 h-full w-full" aria-hidden>
            <path d="M20 120 C 80 90, 140 140, 200 100 S 300 70, 310 90" fill="none" stroke="#f0b429" strokeWidth="4" strokeDasharray="2 8" strokeLinecap="round" />
            <circle cx="48" cy="112" r="8" fill="#f0b429" />
            <circle cx="250" cy="86" r="10" fill="#f0b429" />
          </svg>
          <span className="relative flex size-16 items-center justify-center rounded-full bg-[#fff6e4] text-[#1e4d3a] shadow-lg">
            <span className="ml-1 text-2xl">▶</span>
          </span>
        </button>
      )}
      <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-[#1e4d3a]">
        Video guide · {minutes} min
      </span>
      {resume && (
        <span className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-[#f0b429] px-2.5 py-1 text-[11px] font-extrabold text-[#1a3b2c]">
          Resume at {formatClock(resumeSeconds)}
        </span>
      )}
    </div>
  );
}
