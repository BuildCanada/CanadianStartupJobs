import { mapCompanyDirs } from "scrape-helpers/scrapeCompanyDirs";
import { firecrawl } from "./firecrawl";
import { listingTool, openaiClient } from "./openaiClient";
import type { ChatCompletion } from "openai/resources";
const schema = {
  type: "object",
  properties: {
    jobBoards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          jobBoardName: { type: "string" },
          url: { type: "string" },
        },
        required: ["jobBoardName", "url"],
      },
    },
    companies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          companyName: { type: "string" },
          url: { type: "string" },
          isCanadian: { type: "boolean" },
          isVcBacked: { type: "boolean" },
        },
        required: ["companyName", "url", "isCanadian", "isVcBacked"],
      },
    },
    companyDirectories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          directoryName: { type: "string" },
          url: { type: "string" },
        },
        required: ["directoryName", "url"],
      },
    },
  },
  required: ["jobBoards", "companies", "companyDirectories"],
};

// recursively gather links from company directories and job boards
// for company directory scrape all links and categorize, then try to find company -> company job board from there
// on each recursion pass directories and job boards to next recursion
// return jobs from job boards found
export const recursiveLinkGathering = async (
  companyDirsToSearch: string[],
  jobBoardsToSearch: string[],
  depth = 0
): Promise<{ title: string; pay: number }[]> => {
  //const newCompanyDirs = [];
  // const newJobBoards = [];
  let i = 0;

  // get all url associated with current company dirs to search, categorize as job board or company dir.
  const { companyDirsCollected, jobBoardsCollected } = await mapCompanyDirs(
    companyDirsToSearch
  );
  // scrape company dirs for job boards and individual companies

  const scrapeResults = await firecrawl.batchScrape(companyDirsToSearch, {
    options: {
      formats: [
        {
          type: "json",
          schema: schema as any,
        },
      ],
    },
  });
  for (const scrapeResult of scrapeResults.data) {
    const scrapeResultJobBoards = (scrapeResult.json as any)?.jobBoards || [];
    newJobBoards.push(...scrapeResultJobBoards);
    const scrapeResultCompanies = (scrapeResult.json as any)?.companies || [];
    const scrapeResultCompanyDirs =
      (scrapeResult.json as any)?.companyDirectories || [];
    newCompanyDirs.push(...scrapeResultCompanyDirs);
    for (const company of scrapeResultCompanies) {
      const buildPotentialJobBoardUrls = (company: { url: string }) => {
        const url = company.url;
        const baseUrlDomain = new URL(url).hostname;
        const baseUrlDomainWithoutTld = new URL(url).hostname.replace(
          /\.[^/.]+$/,
          ""
        );
        return [
          `https://${baseUrlDomain}/en-ca/careers`,
          `https://${baseUrlDomain}/en-ca/jobs`,
          `https://${baseUrlDomain}/careers`,
          `https://${baseUrlDomain}/jobs`,
          `https://jobs.ashbyhq.com/${baseUrlDomainWithoutTld}`,
          `https://${baseUrlDomainWithoutTld}.applytojob.com`,
          `https://jobs.lever.co/${baseUrlDomainWithoutTld}`,
        ];
      };
      const potentialJobBoardUrls = buildPotentialJobBoardUrls(company);
      const potentialJobBoardUrlsValidated = [];
      for (const url of potentialJobBoardUrls) {
        const res = await fetch(url, { method: "HEAD" });

        const checkRedirectsOnAts = async (response: Response) => {
          if (response.redirected) {
            if (
              response.url.includes("jobs.lever.co") ||
              response.url.includes("applytojob.com") ||
              response.url.includes("ashbyhq.com") ||
              response.url.includes("info.jazzhr.com")
            ) {
              return false;
            }
            return true;
          }
          return true;
        };
        const noRedirectsOnAts = await checkRedirectsOnAts(res);

        if (res.ok && noRedirectsOnAts) {
          potentialJobBoardUrlsValidated.push(res.url);
        }
      }
      if (potentialJobBoardUrlsValidated.length > 0) {
        for (let i = 0; i < 3; i++) {
          if (potentialJobBoardUrlsValidated[i]) {
            newJobBoards.push(potentialJobBoardUrlsValidated[i]);
          }
        }
      }
    }
  }

  const newJobs: { title: string; pay: number }[] = [];
  if (depth < 2 && (newJobBoards.length > 0 || newCompanyDirs.length > 0)) {
    console.log("Recursing to next depth:", depth + 1);
    const newRecursedJobs = await recursiveLinkGathering(
      newCompanyDirs,
      newJobBoards,
      depth + 1
    );
    newJobs.push(...newRecursedJobs);
  }

  return newJobs;
};
