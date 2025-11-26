import { mapCompanyDir } from "scrape-helpers/mapCompanyDirs";
import { scrapeCompanyDirs } from "scrape-helpers/scrapeCompanyDirs";

// recursively gather links from company directories and job boards
// for company directory scrape all links and categorize, then try to find company -> company job board from there
// on each recursion pass directories and job boards to next recursion
// return jobs from job boards found
export const getJobBoards = async (companyDirToSearch: string) => {
  const { companyDirsCollectedByMap, jobBoardsCollectedByMap } =
    await mapCompanyDir(companyDirToSearch);

  const { companyDirsCollectedByScrape, jobBoardsCollectedByScrape } =
    await scrapeCompanyDirs(companyDirsCollectedByMap);
  const { jobBoardsCollectedByScrape: jobBoardsCollectedBySecondScrape } =
    await scrapeCompanyDirs(companyDirsCollectedByScrape);

  const allJobBoards = jobBoardsCollectedByMap
    .concat(jobBoardsCollectedByScrape)
    .concat(jobBoardsCollectedBySecondScrape);

  return allJobBoards;
};
