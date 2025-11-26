"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import HeroSection from "@/components/layout/heroSection";
import { useJobsContext } from "@/components/jobs/jobsProvider";
import { COLOURS } from "@/utils/constants";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { jobsById, selectJob } = useJobsContext();

  useEffect(() => {
    if (typeof id === "string" && jobsById[id]) {
      selectJob(id);
    }
  }, [id, jobsById, selectJob]);

  if (!id || !jobsById[id]) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center px-4 text-center"
        style={{ backgroundColor: COLOURS.background }}
      >
        <p className="text-sm text-neutral-600">We couldn’t find that job. It may have been removed.</p>
        <button
          type="button"
          className="mt-4 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700"
          onClick={() => router.push("/")}
        >
          Back to listings
        </button>
      </main>
    );
  }

  return (
    <main
      className="flex flex-col px-4 py-6 sm:px-6 lg:px-8"
      style={{ backgroundColor: COLOURS.background }}
    >
      <button
        type="button"
        className="mb-4 w-fit rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700"
        onClick={() => router.push("/")}
      >
        Back to listings
      </button>
      <HeroSection />
    </main>
  );
}
