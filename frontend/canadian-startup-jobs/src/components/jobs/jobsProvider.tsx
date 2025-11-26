"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import jobsSource from "@/data/jobs.json" assert { type: "json" };
import {
  DEFAULT_FILTERS,
  FilterState,
  FILTER_DROPDOWN_CONFIG,
} from "@/components/jobs/filterConfig";

type Job = {
  id: string;
  title: string;
  company: string;
  description?: string;
  applyUrl?: string;
  location?: string;
  province?: string;
  jobType?: string;
  experience?: string;
  industry?: string;
  role?: string;
  [key: string]: unknown;
};

type JobsContextValue = {
  jobsById: Record<string, Job>;
  jobIds: string[];
  filteredJobIds: string[];
  filteredJobs: Job[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  selectedJobId: string | null;
  selectedJob: Job | null;
  selectJob: (id: string) => void;
};

const JobsContext = createContext<JobsContextValue | undefined>(undefined);

const jobsByIdStatic: Record<string, Job> = Object.entries(jobsSource as Record<string, Omit<Job, "id">>).reduce(
  (acc, [id, data]) => {
    acc[id] = { id, ...data } as Job;
    return acc;
  },
  {} as Record<string, Job>
);

const jobIdsStatic = Object.keys(jobsByIdStatic);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [searchTerm, setSearchTermState] = useState("");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobIdsStatic[0] ?? null);

  const filteredJobIds = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return jobIdsStatic.filter((id) => {
      const job = jobsByIdStatic[id];
      if (!job) return false;

      const passesFilters = FILTER_DROPDOWN_CONFIG.every(({ key, defaultValue }) => {
        const filterValue = filters[key];
        if (filterValue === defaultValue) return true;
        const jobValue = (job[key] ?? "").toString();
        return jobValue.length > 0 && jobValue === filterValue;
      });

      if (!passesFilters) return false;
      if (!term) return true;

      return (
        job.title?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term)
      );
    });
  }, [filters, searchTerm]);

  const filteredJobs = useMemo(
    () => filteredJobIds.map((id) => jobsByIdStatic[id]).filter(Boolean),
    [filteredJobIds]
  );

  const activeJobId = useMemo(() => {
    if (filteredJobIds.length === 0) return null;
    if (selectedJobId && filteredJobIds.includes(selectedJobId)) return selectedJobId;
    return filteredJobIds[0];
  }, [filteredJobIds, selectedJobId]);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  const selectJob = useCallback((id: string) => {
    if (jobsByIdStatic[id]) {
      setSelectedJobId(id);
    }
  }, []);

  const value = useMemo<JobsContextValue>(
    () => ({
      jobsById: jobsByIdStatic,
      jobIds: jobIdsStatic,
      filteredJobIds,
      filteredJobs,
      searchTerm,
      setSearchTerm,
      filters,
      setFilters,
      selectedJobId: activeJobId,
      selectedJob: activeJobId ? jobsByIdStatic[activeJobId] ?? null : null,
      selectJob,
    }),
    [filteredJobIds, filteredJobs, searchTerm, setSearchTerm, filters, setFilters, activeJobId, selectJob]
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobsContext() {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error("useJobsContext must be used within JobsProvider");
  }
  return context;
}
