import { Worker } from "bullmq";
import { mapCompanyDir } from "../scrape-helpers/mapCompanyDirs";
import { companyDirectoryQueue, jobBoardQueue } from "../queues";
import { redisConnection } from "../queues";
import { WORKER_CONCURRENCY } from "../constants";

export const mapCompanyDirWorker = new Worker(
  "map-company-directories",
  async (job) => {
    console.log(`Mapping company directory: ${job.data.url}`);
    try {
      // Call mapCompanyDir with a single URL array
      const { companyDirsCollectedByMap, jobBoardsCollectedByMap } =
        await mapCompanyDir([job.data.url]);
      console.log("Found", companyDirsCollectedByMap, jobBoardsCollectedByMap);
      // Add discovered company directories to the scrape queue (depth 0)
      const dirPromises = companyDirsCollectedByMap.map((dirUrl, index) =>
        index < WORKER_CONCURRENCY.COMPANY_DIRECTORY_BREADTH
          ? companyDirectoryQueue.add("scrape-company-directory", {
              url: dirUrl,
              depth: 0,
            })
          : Promise.resolve()
      );
      await Promise.allSettled(dirPromises);
      console.log(
        `Added ${companyDirsCollectedByMap.length} company directories from ${job.data.url}`
      );

      // Add discovered job boards to the job board queue
      const jobBoardPromises = jobBoardsCollectedByMap.map(
        (jobBoardUrl, index) =>
          index < WORKER_CONCURRENCY.JOB_BOARD_BREADTH
            ? jobBoardQueue.add("scrape-job-board", { url: jobBoardUrl })
            : Promise.resolve()
      );
      await Promise.allSettled(jobBoardPromises);
      console.log(
        `Added ${jobBoardsCollectedByMap.length} job boards from ${job.data.url}`
      );

      return {
        success: true,
        url: job.data.url,
        directoriesFound: companyDirsCollectedByMap.length,
        jobBoardsFound: jobBoardsCollectedByMap.length,
      };
    } catch (error) {
      console.error(`Error mapping company directory ${job.data.url}:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: WORKER_CONCURRENCY.MAP_COMPANY_DIR,
  }
);
