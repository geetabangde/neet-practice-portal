"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const MAX_BYTES = 2 * 1024 * 1024;

export interface ChosenImage {
  // Name of the file, kept with the question
  name: string;
  // Preview address. null when only the name is known (an image chosen earlier).
  previewUrl: string | null;
}

interface ImageUploadProps {
  value: ChosenImage | null;
  onChange: (image: ChosenImage | null) => void;
  error?: string;
  onError: (message: string | undefined) => void;
}

// Upload box for the question image. There is no server yet, so the file is only previewed here
// and its name is saved with the question.
export function ImageUpload({ value, onChange, error, onError }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Free the preview from memory when the form is left
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  function accept(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return onError("Choose an image file (PNG, JPG, WebP or GIF).");
    if (file.size > MAX_BYTES) return onError("The image must be smaller than 2 MB.");

    onError(undefined);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(file);
    onChange({ name: file.name, previewUrl: urlRef.current });
  }

  function remove() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
    onError(undefined);
    onChange(null);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]);
  }

  return (
    <div>
      <input
        ref={inputRef}
        id="question-image"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => accept(event.target.files?.[0])}
      />

      {value ? (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-3">
          {value.previewUrl ? (
            // A local preview of a file the admin just chose: next/image cannot show a blob: address
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.previewUrl} alt="Preview of the chosen question image" className="h-20 w-28 rounded-lg border border-slate-200 object-cover" />
          ) : (
            <span className="flex h-20 w-28 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{value.name}</p>
            <p className="text-xs text-slate-500">{value.previewUrl ? "Ready to save with the question" : "Saved with this question"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={remove}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
            dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50/60",
            error && "border-red-300",
          )}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm text-slate-700">
            <label htmlFor="question-image" className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-700">
              Choose an image
            </label>{" "}
            or drag it here
          </p>
          <p className="mt-1 text-xs text-slate-500">PNG, JPG, WebP or GIF, up to 2 MB. Optional.</p>
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
