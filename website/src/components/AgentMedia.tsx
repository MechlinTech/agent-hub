"use client";

import { useState } from "react";
import type { LandingAgentMedia } from "../content/agents";

type AgentMediaProps = {
  media: LandingAgentMedia;
  agentName: string;
};

export function AgentMedia({ media, agentName }: AgentMediaProps) {
  const [activeShot, setActiveShot] = useState(0);
  const [imgError, setImgError] = useState(false);
  const shots = [{ src: media.hero, alt: `${agentName} preview` }, ...media.screenshots];
  const active = shots[activeShot] ?? shots[0];

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-indigo-950/10 bg-white shadow-card ring-1 ring-indigo-950/5">
        {!imgError && active ? (
          // Native img avoids Next Image fill/object-cover soft scaling of UI chrome
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.src}
            alt={active.alt}
            className="block h-auto w-full"
            style={{ imageRendering: "auto" }}
            loading={activeShot === 0 ? "eager" : "lazy"}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 bg-indigo-50/50 p-6 text-center text-sm text-indigo-800/50">
            <span className="font-medium text-indigo-900/70">Preview unavailable</span>
          </div>
        )}
      </div>

      {shots.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {shots.map((shot, i) => (
            <button
              key={shot.src}
              type="button"
              onClick={() => {
                setImgError(false);
                setActiveShot(i);
              }}
              className={`h-14 w-24 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition ${
                activeShot === i
                  ? "border-brand-600 ring-2 ring-brand-600/20"
                  : "border-indigo-950/10 opacity-80 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shot.src} alt="" className="h-full w-full object-cover object-top" />
            </button>
          ))}
        </div>
      )}

      {media.video && (
        <div className="overflow-hidden rounded-2xl border border-indigo-950/10 bg-indigo-950 shadow-card">
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-violet-200">
            {media.video.label}
          </p>
          <video
            key={media.video.src}
            className="aspect-video w-full bg-indigo-950"
            controls
            playsInline
            muted
            loop
            autoPlay
            poster={media.video.poster}
            preload="auto"
          >
            <source src={media.video.src} type="video/mp4" />
          </video>
        </div>
      )}
    </div>
  );
}
