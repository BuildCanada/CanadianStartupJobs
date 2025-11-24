// will eventually boot cron job, currently just hitting the scraper directly
import { recursiveLinkGathering } from "./scrape";

import { jobBoardUrls, companyDirectoryUrls } from "./sources";
console.log("This is the scraper cron index file.");
const listOfJobsBoards: string[] = [];
const listOfCompanyDirs: string[] = [];
recursiveLinkGathering(
  companyDirectoryUrls.slice(0, 1),
  jobBoardUrls.slice(0, 1)
);
