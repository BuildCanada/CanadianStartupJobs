export const PROVINCES = ["Any Province", "AB", "BC", "MB", "NB", "NL", "NS", "ON", "PE", "QC", "SK"];
export const JOB_TYPES = ["Any Job Type", "Full-time", "Part-time", "Contract", "Internship"];
export const EXPERIENCE_LEVELS = ["Any Experience", "Entry", "Intermediate", "Senior", "Leadership"];
export const INDUSTRIES = ["Any Industry", "Fintech", "Healthtech", "Cleantech", "AI & Data", "Consumer", "Enterprise SaaS"];
export const ROLES = ["Any Role", "Software Engineering", "Product Management", "Design", "Marketing", "Sales", "Operations"];

export type FilterState = {
  province: string;
  jobType: string;
  experience: string;
  industry: string;
  role: string;
};

export const DEFAULT_FILTERS: FilterState = {
  province: PROVINCES[0],
  jobType: JOB_TYPES[0],
  experience: EXPERIENCE_LEVELS[0],
  industry: INDUSTRIES[0],
  role: ROLES[0],
};

export type FilterDropdownConfig = {
  key: keyof FilterState;
  label: string;
  options: string[];
  defaultValue: string;
};

export const FILTER_DROPDOWN_CONFIG: FilterDropdownConfig[] = [
  { key: "province", label: "Province", options: PROVINCES, defaultValue: DEFAULT_FILTERS.province },
  { key: "jobType", label: "Job Type", options: JOB_TYPES, defaultValue: DEFAULT_FILTERS.jobType },
  { key: "experience", label: "Experience", options: EXPERIENCE_LEVELS, defaultValue: DEFAULT_FILTERS.experience },
  { key: "industry", label: "Industry", options: INDUSTRIES, defaultValue: DEFAULT_FILTERS.industry },
  { key: "role", label: "Role", options: ROLES, defaultValue: DEFAULT_FILTERS.role },
];
