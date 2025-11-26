// universalScraper.ts
import { chromium, Browser, Page } from "playwright";
import { NodeHtmlMarkdown } from "node-html-markdown";
import OpenAI from "openai";
import dotenv from "dotenv";
import crypto from "crypto";
import { openaiClient } from "openaiClient";
dotenv.config();

function isAppendStyle(snapshots: PageSnapshot[]): boolean {
  if (snapshots.length < 2) return false;

  const first = snapshots[0].markdown;
  const last = snapshots[snapshots.length - 1].markdown;

  // if last page contains half or more of the first snapshot's HTML → append style
  const slice = first.slice(0, Math.min(first.length, 2000)); // limit for speed
  return last.includes(slice);
}

/**
 * Extract meaningful "blocks" from the HTML.
 * This is extremely reliable for list/card-style pages.
 */

function hashBlock(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex");
}

/**
 * Main heuristic merger:
 * - If append-style: return the last snapshot.
 * - If paginated slices: dedupe blocks across all pages.
 */
function mergeSnapshotsHeuristically(snapshots: PageSnapshot[]): string {
  if (snapshots.length === 0) return "";

  // CASE 1 — Append-style pagination → last snapshot has everything
  if (isAppendStyle(snapshots)) {
    console.log("📌 Append-style detected — using only final snapshot.");
    return snapshots[snapshots.length - 1].markdown.trim();
  }

  // CASE 2 — Paginated slices → merge unique blocks
  const seen = new Set<string>();
  const mergedBlocks: string[] = [];

  for (const snap of snapshots) {
    const blocks = snap.markdown;
    for (const block of blocks) {
      const h = hashBlock(snap.markdown);
      if (!seen.has(h)) {
        seen.add(h);
        mergedBlocks.push(block);
      }
    }
  }

  const pageMarkDown = mergedBlocks.join("");
  return pageMarkDown;
}

/**
 * DROP-IN REPLACEMENT for your existing function.
 * Eliminates all LLM calls and uses deterministic structural merging.
 */

// -----------------------------
// Types
// -----------------------------

interface Company {
  name: string;
  url: string;
  isCanadian?: boolean;
  isVcBacked?: boolean;
}

interface CompanyDirectory {
  directoryName: string;
  url: string;
}

interface JobBoard {
  jobBoardName: string;
  url: string;
}

export interface ExtractionResult {
  companies: Company[];
  companyDirectories: CompanyDirectory[];
  jobBoards: JobBoard[];
}

export interface GeneralScraperConfig {
  url: string;

  /**
   * Optional override for the main content container selector.
   * If not provided, we'll detect it dynamically from the page.
   */
  contentContainerSelector?: string;

  /**
   * Optional override selector for pagination buttons/links.
   * If not provided, we'll use a robust default built from keyword heuristics.
   */
  paginationSelector?: string;

  /**
   * Extra delay after each pagination click to let JS-heavy sites settle, in ms.
   * Default: 1500
   */
  postClickDelayMs?: number;

  /**
   * If true, we'll use an LLM post-pass to deduplicate repeated content
   * across pages and keep only unique/useful sections.
   */
  useLLMDiff?: boolean;
}

interface PageSnapshot {
  pageIndex: number;
  url: string;
  html: string;
  markdown: string;
}

// -----------------------------
// Pagination selector plumbing
// -----------------------------

const PAGINATION_KEYWORDS = [
  "see more",
  "show more",
  "load more",
  "more results",
  "more",
  "next",
  "load older",
  "older posts",
  "load",
  "continue",
  "view more",
];

const buildDefaultPaginationSelector = (keywords: string[]): string => {
  const buttonTextSelectors = keywords.map(
    (k) => `button:has-text(${JSON.stringify(k)})`
  );
  const linkTextSelectors = keywords.map(
    (k) => `a:has-text(${JSON.stringify(k)})`
  );
  const roleButtonTextSelectors = keywords.map(
    (k) => `[role="button"]:has-text(${JSON.stringify(k)})`
  );

  const semanticNextSelectors = [
    `a[rel="next"]`,
    `a[aria-label*="Next" i]`,
    `button[aria-label*="Next" i]`,
    `[role="button"][aria-label*="Next" i]`,
  ];

  const commonClassSelectors = [
    `button[id*="more" i]`,
    `button[class*="more" i]`,
    `button[class*="load" i]`,
    `button[class*="next" i]`,
    `button[class*="pagination" i]`,
    `button[data-testid*="more" i]`,
    `[role="button"][id*="more" i]`,
    `[role="button"][class*="more" i]`,
    `[role="button"][data-testid*="more" i]`,
  ];

  return [
    ...buttonTextSelectors,
    ...linkTextSelectors,
    ...roleButtonTextSelectors,
    ...semanticNextSelectors,
    ...commonClassSelectors,
  ].join(", ");
};

// -----------------------------
// HTML → Markdown helper
// -----------------------------

const htmlToMarkdown = (html: string): string => {
  const strippedHtml = stripScriptAndStyleTags(html);
  return NodeHtmlMarkdown.translate(strippedHtml);
};

export const stripScriptAndStyleTags = (html: string): string => {
  return (
    html
      // remove <script> ... </script> blocks
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, "")
      // remove <style> ... </style> blocks
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, "")
      // remove self-closing scripts (rare but valid)
      .replace(/<script\b[^>]*\/>/gi, "")
      // remove self-closing styles
      .replace(/<style\b[^>]*\/>/gi, "")
  );
};

const paginateAndSnapshot = async (
  page: Page,
  config: GeneralScraperConfig
): Promise<PageSnapshot[]> => {
  const {
    paginationSelector: paginationSelectorOverride,
    postClickDelayMs = 1500,
  } = config;

  // 1. Detect container dynamically if not provided
  const contentContainerSelector = "body";

  const paginationSelector =
    paginationSelectorOverride ||
    buildDefaultPaginationSelector(PAGINATION_KEYWORDS);

  const snapshots: PageSnapshot[] = [];

  let pageIndex = 0;
  let lastHTML = "";
  let stableCount = 0;

  while (true) {
    const iterationStart = Date.now();

    // ---- 1. Snapshot current content ----
    const container = page.locator(contentContainerSelector);
    const html = await container.innerHTML();
    const markdown = htmlToMarkdown(html);

    snapshots.push({
      pageIndex,
      url: page.url(),
      html,
      markdown,
    });
    if (pageIndex > 2) break;

    // ---- 2. Detect if content stopped changing ----
    if (html === lastHTML) {
      stableCount++;
      if (stableCount >= 3) {
        console.log("🛑 Pagination ended: container stabilized.");
        break;
      }
    } else {
      stableCount = 0;
    }
    lastHTML = html;

    // ---- 3. Check timeout for this loop iteration ----
    if (Date.now() - iterationStart > 20_000) {
      console.log(
        "🛑 Pagination ended: 20-second timeout for iteration reached."
      );
      break;
    }

    // ---- 4. Look for 'Next' button ----
    const nextButton = page.locator(paginationSelector).first();

    const isVisible = await nextButton.isVisible().catch(() => false);
    if (!isVisible) {
      console.log("🛑 Pagination ended: next button not visible.");
      break;
    }

    // ---- 5. Check disabled state ----
    const isDisabled = await nextButton.isDisabled().catch(() => false);
    const ariaDisabled = await nextButton.getAttribute("aria-disabled");

    if (isDisabled || ariaDisabled === "true") {
      console.log("🛑 Pagination ended: button disabled.");
      break;
    }

    // ---- 6. Click the button ----
    const beforeHTML = await container.innerHTML();

    await nextButton.click({ force: true });

    // ---- 7. Wait for content to change (with its own timeout) ----

    const changed = await page
      .waitForFunction(
        (args) => {
          const { sel, prev } = args;
          const el = document.querySelector(sel);
          return el && el.innerHTML !== prev;
        },
        { sel: contentContainerSelector, prev: beforeHTML }, // <-- arg
        { timeout: 8000 } // <-- options
      )
      .then(() => true)
      .catch(() => false);

    if (!changed) {
      console.log("🛑 Pagination ended: container did not change after click.");
      break;
    }

    // ---- 8. Optional delay ----
    if (postClickDelayMs > 0) {
      await page.waitForTimeout(postClickDelayMs);
    }

    // ---- 9. Check if full iteration exceeded 20 sec ----
    if (Date.now() - iterationStart > 20_000) {
      console.log("🛑 Pagination ended: iteration exceeded 20 seconds.");
      break;
    }

    pageIndex++;
  }
  return snapshots;
};

// -----------------------------
// OPTIONAL: LLM-based deduplication across pages
// -----------------------------

// -----------------------------
// Tools for company / directory / job board extraction
// -----------------------------

const extractionTools: any[] = [
  {
    type: "function",
    function: {
      name: "extract_entities",
      description:
        "Extract companies, company directories, and job boards from the given markdown.",
      parameters: {
        type: "object",
        properties: {
          companies: {
            type: "array",
            description:
              "List of companies mentioned on the page with their main URL.",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                url: { type: "string" },
                isCanadian: { type: "boolean" },
                isVcBacked: { type: "boolean" },
              },
              required: ["name", "url"],
            },
          },
          companyDirectories: {
            type: "array",
            description:
              "Startup/tech/company directories that list many companies.",
            items: {
              type: "object",
              properties: {
                directoryName: { type: "string" },
                url: { type: "string" },
              },
              required: ["directoryName", "url"],
            },
          },
          jobBoards: {
            type: "array",
            description:
              "Job boards or career listing pages relevant to the content.",
            items: {
              type: "object",
              properties: {
                jobBoardName: { type: "string" },
                url: { type: "string" },
              },
              required: ["jobBoardName", "url"],
            },
          },
        },
        required: ["companies", "companyDirectories", "jobBoards"],
      },
    },
  },
];

// -----------------------------
// High-level pipeline
// -----------------------------

export interface MarkdownSection {
  heading: string;
  level: number;
  content: string;
}

export const splitMarkdownByHeadings = (
  markdown: string,
  chunkSize: number // number, not string
): MarkdownSection[] => {
  const lines = markdown.split(/\r?\n/);

  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | null = null;

  const headingRegex = /^(#{1,6})\s+(.*)$/;

  for (const line of lines) {
    const match = line.match(headingRegex);

    if (match) {
      // Save previous section
      if (current) sections.push(current);

      // Start a new one
      const level = match[1].length;
      const heading = match[2].trim();

      current = {
        heading,
        level,
        content: "",
      };
    } else if (current) {
      current.content += line + "\n";
    }
  }

  if (current) sections.push(current);

  //
  // SECOND PASS → split oversized sections by character count
  //
  const finalSections: MarkdownSection[] = [];

  for (const sec of sections) {
    if (sec.content.length <= chunkSize) {
      finalSections.push(sec);
      continue;
    }

    // Break into N chunks of size <= chunkSize
    let start = 0;
    const total = sec.content.length;

    while (start < total) {
      const end = Math.min(start + chunkSize, total);
      const chunkContent = sec.content.slice(start, end);

      finalSections.push({
        heading: sec.heading,
        level: sec.level,
        content: chunkContent,
      });

      start = end;
    }
  }

  return finalSections;
};

export const normalizeEntryToMarkdown = (entry: any): string => {
  // 1. Use heading if available
  const heading = entry.heading || entry.title || entry.name || "Entry";

  // 2. Use content if exists
  if (entry.content) {
    return `### ${heading}\n\n${entry.content}\n\n`;
  }

  // 3. Otherwise fallback to pretty-printed JSON
  return `### ${heading}\n\n\`\`\`json\n${JSON.stringify(
    entry,
    null,
    2
  )}\n\`\`\`\n\n`;
};

export const chunkMarkdown = (
  sections: string[],
  maxChars: number
): string[] => {
  const chunks: string[] = [];
  let current = "";

  for (const sec of sections) {
    if ((current + sec).length > maxChars) {
      chunks.push(current);
      current = sec;
    } else {
      current += sec;
    }
  }

  if (current.trim()) chunks.push(current);
  return chunks;
};

export const mergeResults = (results: ExtractionResult[]): ExtractionResult => {
  try {
    let companies: Company[] = [];
    let jobBoards: JobBoard[] = [];
    let directories: CompanyDirectory[] = [];
    for (const r of results) {
      companies = companies.concat(r.companies);
      jobBoards = jobBoards.concat(r.jobBoards);
      directories = directories.concat(r.companyDirectories);
    }
    return {
      companies,
      jobBoards,
      companyDirectories: directories,
    };
  } catch (err) {
    return {
      companies: [],
      jobBoards: [],
      companyDirectories: [],
    };
  }
};
export const extractChunk = async (
  client: OpenAI,
  markdownChunk: string
): Promise<ExtractionResult> => {
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Extract all companies, job boards, and company directories from the following markdown.",
        },
        { role: "user", content: markdownChunk },
      ],
      tools: extractionTools,
      tool_choice: "auto",
    });

    const toolCall = completion.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall)
      return {
        companies: [],
        jobBoards: [],
        companyDirectories: [],
      };

    const args = JSON.parse(
      (toolCall as unknown as { function: { arguments: string } }).function
        .arguments
    ) as ExtractionResult;

    // Example fallback injection (your sample data)
    // const args: ExtractionResult = {
    //   companies: [
    //     { name: "Antler", url: "https://www.antler.co/location/canada" },
    //     { name: "VClub", url: "https://vclub.poker" },
    //     { name: "Brampton Angels", url: "https://bramptonangels.vc/" },
    //     { name: "CVCA Intelligence", url: "https://intelligence.cvca.ca/" },
    //     {
    //       name: "Canada Startup Association",
    //       url: "https://canadastartups.co/",
    //     },
    //   ],
    //   companyDirectories: [],
    //   jobBoards: [],
    // };

    const companies: Company[] = [];
    const jobBoards: JobBoard[] = [];
    const companyDirectories: CompanyDirectory[] = [];

    if (Array.isArray(args.companies)) {
      for (const c of args.companies) {
        companies.push(c);
      }
    }

    if (Array.isArray(args.companyDirectories)) {
      for (const d of args.companyDirectories) {
        companyDirectories.push(d);
      }
    }

    if (Array.isArray(args.jobBoards)) {
      for (const j of args.jobBoards) {
        jobBoards.push(j);
      }
    }

    return {
      companies,
      jobBoards,
      companyDirectories,
    };
  } catch (err) {
    console.log("error", "markdown");
    return {
      companies: [],
      jobBoards: [],
      companyDirectories: [],
    };
  }
};

export const scrapeAndExtract = async (
  scraperConfig: GeneralScraperConfig
): Promise<ExtractionResult> => {
  const browser: Browser = await chromium.launch({ headless: true });
  const page: Page = await browser.newPage();
  const chunkChars = 10000;

  try {
    await page.goto(scraperConfig.url, { waitUntil: "networkidle" });

    const snapshots = await paginateAndSnapshot(page, scraperConfig);
    console.log("Number of snapshots", snapshots.length);
    const markdownCombined = mergeSnapshotsHeuristically(snapshots);

    const splitMarkDown = splitMarkdownByHeadings(markdownCombined, chunkChars);

    const markdownEntries = splitMarkDown.map(normalizeEntryToMarkdown);
    const markdownChunks = chunkMarkdown(markdownEntries, chunkChars);

    const partialResults: ExtractionResult[] = [];
    let i = 0;
    for (const chunk of markdownChunks) {
      i++;
      const r = await extractChunk(openaiClient, chunk);
      console.log("Getting partial results for chunk ", i);
      partialResults.push(r);
    }

    // 4. Merge
    const results = mergeResults(partialResults);

    return results;
  } catch {
    return {
      companies: [],
      companyDirectories: [],
      jobBoards: [],
    };
  } finally {
    await browser.close();
  }
};
