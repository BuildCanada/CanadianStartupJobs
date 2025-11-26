import { mapCompanyDirs } from "scrape-helpers/mapCompanyDirs";
import { firecrawl } from "./firecrawl";
import { listingTool, openaiClient } from "./openaiClient";
import type { ChatCompletion } from "openai/resources";
import { scrapeCompanyDirs } from "scrape-helpers/scrapeCompanyDirs";

import { dedupeArray } from "utils";

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
  const { companyDirsCollectedByMap, jobBoardsCollectedByMap } =
    await mapCompanyDirs(companyDirsToSearch);
  // scrape company dirs for job boards and individual companies

  const { companyDirsCollectedByScrape, jobBoardsCollectedByScrape } =
    await scrapeCompanyDirs(companyDirsToSearch);

  const allNewCompanyDirs = dedupeArray([
    ...companyDirsCollectedByMap,
    ...companyDirsCollectedByScrape,
  ]);
  const allNewJobBoards = dedupeArray([
    ...jobBoardsCollectedByMap,
    ...jobBoardsCollectedByScrape,
  ]);

  const newJobs: { title: string; pay: number }[] = [];
  if (
    depth < 2 &&
    (allNewJobBoards.length > 0 || allNewCompanyDirs.length > 0)
  ) {
    console.log("Recursing to next depth:", depth + 1);
    const newRecursedJobs = await recursiveLinkGathering(
      allNewCompanyDirs,
      allNewJobBoards,
      depth + 1
    );
    newJobs.push(...newRecursedJobs);
  }
  console.log(allNewCompanyDirs, allNewJobBoards);
  return newJobs;
};
