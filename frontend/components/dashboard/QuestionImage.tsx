"use client";

import { useState } from "react";
import { questionImageUrl } from "@/lib/studentContent";

// The picture of a question (an X-ray, an ECG, a diagram ...). Click it to open the full size in a new tab.
export default function QuestionImage({ token, label, small = false }: { token: string; label: string; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  const url = questionImageUrl(token);

  if (failed) {
    return (
      <p role="status" className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
        The image of this question could not be loaded.{" "}
        <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-dark hover:underline">
          Try opening it
        </a>
      </p>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title="Open the full image" className="mt-4 block w-fit max-w-full">
      {/* The picture comes from the API, not from this site, and its size is not known: a plain <img> fits */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`max-w-full rounded-lg border border-slate-200 bg-white object-contain ${small ? "max-h-32 sm:max-w-xs" : "max-h-60 sm:max-w-sm"}`}
      />
      {small ? null : <span className="mt-1 block text-[11px] text-slate-500">Click the image to open it full size</span>}
    </a>
  );
}
