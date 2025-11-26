// will eventually boot cron job, currently just hitting the scraper directly

import { firecrawl, jobSchema } from "firecrawl";
import { writeFileSync } from "fs";
import { getJobBoards } from "getJobBoards";
import { companyDirectoryUrls } from "sources";
import { chunkStrings } from "utils";

// need to add chunking here
const getAllJobs = async () => {
  const allJobs = [];
  const allJobBoardUrls = [];
  for (const companyDirectory in companyDirectoryUrls.slice) {
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

    const jobChunks = result.data.map((elem) => {
      try {
        const jobs = (elem.json as { jobs: { title: string }[] }).jobs;
        return jobs;
      } catch (err) {
        console.log(err, elem.json);
        return [] as unknown as {
          title: string;
        }[];
      }
    });

    for (const jobChunk of jobChunks) {
      allJobs.push(...jobChunk);
    }
  }

  writeFileSync("new_jobs.json", JSON.stringify(allJobs));
};

getAllJobs();
