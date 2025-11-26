// will eventually boot cron job, currently just hitting the scraper directly
import { chunkStrings } from "utils";
import { getJobBoards } from "./getJobBoards";

import { jobBoardUrls, companyDirectoryUrls } from "./sources";
import { firecrawl, jobSchema } from "firecrawl";
import { writeFileSync } from "fs";

// need to add chunking here
const getAllJobs = async () => {
  const allJobs = [];
  const allJobBoardUrls = jobBoardUrls;
  for (const companyDirectory in companyDirectoryUrls) {
    const jobBoardsCollected = await getJobBoards(companyDirectory);
    allJobBoardUrls.push(...jobBoardsCollected);
  }

  const chunkedJobBoardUrls = chunkStrings(allJobBoardUrls, 10);

  for (const jobBoards of chunkedJobBoardUrls) {
    const result = await firecrawl.batchScrape(jobBoards, {
      options: {
        formats: [{ type: "json", schema: jobSchema }],
      },
    });

    const jobs = result.data.map((elem) => {
      return elem.json;
    });

    allJobs.push(jobs);
  }

  writeFileSync("new_jobs.json", JSON.stringify(allJobs));
};
