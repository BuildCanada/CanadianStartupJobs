"use client";

export function JobCard() {
  return (
    <div
      className="rounded-md border border-neutral-300 bg-white/70 p-4 shadow-sm flex gap-2"
      role="listitem"
    >
      <div className="h-12 w-12 rounded bg-neutral-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-neutral-200" />
        <div className="h-3 w-1/2 rounded bg-neutral-200" />
        <div className="flex gap-2 pt-2">
          <div className="h-4 w-16 rounded bg-neutral-200" />
          <div className="h-4 w-20 rounded bg-neutral-200" />
          <div className="h-4 w-14 rounded bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}