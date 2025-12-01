/**
 * Application constants for workers, rate limiting, and batch processing
 */

// ============================================================================
// Worker Concurrency Settings
// ============================================================================

export const WORKER_CONCURRENCY = {
  /** Process only 1 job board at a time to respect Firecrawl rate limits */
  JOB_BOARD: 10,
  JOB_BOARD_BREADTH: 2,
  /** Process 3 job extractions at a time */
  /** Process 2 company directory mappings in parallel */
  MAP_COMPANY_DIR: 2,
  MAP_COMPANY_BREADTH: 2,
  /** Process 2 company directories in parallel */
  COMPANY_DIRECTORY: 2,
  COMPANY_DIRECTORY_BREADTH: 2,
} as const;

// ============================================================================
// Rate Limiter Settings
// ============================================================================

export const RATE_LIMITER = {
  /** Firecrawl API rate limiting - 1 request per second */
  FIRECRAWL: {
    max: 1,
    duration: 1000, // milliseconds (1 second)
  },
  /** OpenAI API rate limiting - 20 requests per minute */
  OPENAI: {
    max: 20,
    duration: 60000, // milliseconds (1 minute)
  },
} as const;

// ============================================================================
// Batch Processing Settings
// ============================================================================

export const BATCH_SETTINGS = {
  /** Maximum number of links to process when mapping company directories */
  MAP_COMPANY_DIR_LIMIT: 50,
  /** Delay between queue operations (milliseconds) */
  QUEUE_DELAY_MS: 2000,
  /** Maximum items to process in a single batch for speed optimization */
  MAX_BATCH_SIZE: 2000,
  /** Character limit for markdown chunks when processing content */
  MARKDOWN_CHUNK_CHARS: 10000,
  /** Delay after clicking elements during scraping (milliseconds) */
  POST_CLICK_DELAY_MS: 1500,
} as const;

// ============================================================================
// Database Batch Settings
// ============================================================================

export const DB_BATCH_SETTINGS = {
  /** Maximum number of jobs to process in a single database batch operation */
  MAX_JOBS_PER_BATCH: 1000,
} as const;

// ============================================================================
// Depth/Recursion Settings
// ============================================================================

export const RECURSION_SETTINGS = {
  /** Maximum depth for company directory recursion */
  MAX_COMPANY_DIR_DEPTH: 1,
} as const;
