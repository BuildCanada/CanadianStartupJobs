import { companyDirectoryQueue, jobBoardQueue, redisConnection } from "queues";
import { scrapeCompanyDirs } from "scrape-helpers/scrapeCompanyDirs";
import { Worker } from "bullmq";
import { WORKER_CONCURRENCY } from "../constants";

export const companyDirectoryWorker = new Worker(
    "company-directories",
    async (job) => {
      const depth = job.data.depth ?? 0;
      console.log(`Processing company directory (depth ${depth}): ${job.data.url}`);
      try {
        // Scrape the company directory to discover job boards and more directories
        const { companyDirsCollectedByScrape, jobBoardsCollectedByScrape } =
          await scrapeCompanyDirs([job.data.url]);
          console.log("Collected company directories: ", companyDirsCollectedByScrape);
          console.log("Collected job boards: ", jobBoardsCollectedByScrape);
          
  
        // Add discovered job boards to the job board queue
        const jobBoardPromises = jobBoardsCollectedByScrape.map((jobBoardUrl, index) =>
          index < WORKER_CONCURRENCY.JOB_BOARD_BREADTH ?
          jobBoardQueue.add("scrape-job-board", { url: jobBoardUrl })
          : Promise.resolve()
        );
        await Promise.allSettled(jobBoardPromises);
        console.log(`Added ${jobBoardsCollectedByScrape.length} job boards from ${job.data.url}`);
  
        // Recurse once: if depth is 0, add discovered directories with depth 1
        // If depth is already 1, don't recurse further
        if (depth === 0 && companyDirsCollectedByScrape.length > 0) {
          const dirPromises = companyDirsCollectedByScrape.map((dirUrl, index) =>
            index < WORKER_CONCURRENCY.COMPANY_DIRECTORY_BREADTH ?
            companyDirectoryQueue.add("scrape-company-directory", { url: dirUrl, depth: 1 })
            : Promise.resolve()
          );
          await Promise.allSettled(dirPromises);
          console.log(
            `Added ${companyDirsCollectedByScrape.length} company directories (depth 1) from ${job.data.url}`
          );
        }
  
        return {
          success: true,
          url: job.data.url,
          depth,
          jobBoardsFound: jobBoardsCollectedByScrape.length,
          directoriesFound: companyDirsCollectedByScrape.length,
          recursed: depth === 0 && companyDirsCollectedByScrape.length > 0,
        };
      } catch (error) {
        console.error(`Error scraping company directory ${job.data.url}:`, error);
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: WORKER_CONCURRENCY.COMPANY_DIRECTORY,
    }
  );
  