import { Worker } from "bullmq";
import { mapCompanyDir } from "../scrape-helpers/mapCompanyDirs";
import { companyDirectoryQueue, jobBoardQueue } from "../queues";
import { redisConnection } from "../queues";
import { WORKER_CONCURRENCY } from "../constants";

export const mapCompanyDirWorker = new Worker(
  "map-company-directories",
  async (job) => {
    try {
      // Call mapCompanyDir with a single URL array
      const { companyDirsCollectedByMap, jobBoardsCollectedByMap } =
        await mapCompanyDir([job.data.url]);
      console.log("Job boards from map", jobBoardsCollectedByMap, job.data.url);
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

      // Add discovered job boards to the job board queue
      const jobBoardPromises = jobBoardsCollectedByMap.map(
        (jobBoardUrl, index) =>
          index < WORKER_CONCURRENCY.JOB_BOARD_BREADTH
            ? jobBoardQueue.add("scrape-job-board", { url: jobBoardUrl })
            : Promise.resolve()
      );
      await Promise.allSettled(jobBoardPromises);

      return {
        success: true,
        url: job.data.url,
        directoriesFound: companyDirsCollectedByMap.length,
        jobBoardsFound: jobBoardsCollectedByMap.length,
      };
    } catch (error) {
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: WORKER_CONCURRENCY.MAP_COMPANY_DIR,
  }
);
