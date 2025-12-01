import { scrapeJobsFromJobBoards } from "scrape-helpers/scrapeJobsFromJobBoards";
import { Worker } from "bullmq";
import { redisConnection } from "../queues";
import { db, jobs } from "@canadian-startup-jobs/db";
import { eq } from "drizzle-orm";
import {
  WORKER_CONCURRENCY,
  RATE_LIMITER,
} from "../constants";

// Type for scraped job data
type ScrapedJob = {
  title: string;
  location: string;
  remoteOk?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  company: string;
  jobBoardUrl?: string;
  postingUrl?: string;
  isAtAStartup?: boolean;
};

export const jobBoardWorker = new Worker(
  "job-boards",
  async (job) => {
    console.log(`Processing job board: ${job.data.url}`);
    try {
      // Scrape one job board at a time
      const scrapedJobs = (await scrapeJobsFromJobBoards([
        job.data.url,
      ])) as ScrapedJob[];
      console.log(`Found ${scrapedJobs.length} jobs from ${job.data.url}`);
      console.log(JSON.stringify(scrapedJobs, null, 2));

      if (scrapedJobs.length === 0) {
        return { success: true, url: job.data.url, jobsInserted: 0 };
      }

      // Transform scraped jobs to match database schema
      const jobsToUpsert = scrapedJobs.map((jobData) => ({
        title: jobData.title,
        location: jobData.location,
        remoteOk: jobData.remoteOk ?? false,
        salaryMin: jobData.salaryMin ?? null,
        salaryMax: jobData.salaryMax ?? null,
        description: jobData.description,
        company: jobData.company,
        jobBoardUrl: jobData.jobBoardUrl ?? job.data.url,
        postingUrl: jobData.postingUrl ?? null,
        isAtAStartup: jobData.isAtAStartup ?? null,
      }));

      // Bulk upsert jobs using postingUrl as unique identifier
      // Separate jobs with and without postingUrl
      const jobsWithUrl = jobsToUpsert.filter((j) => j.postingUrl);
      const jobsWithoutUrl = jobsToUpsert.filter((j) => !j.postingUrl);

      let insertedCount = 0;
      let updatedCount = 0;

      // Handle jobs with postingUrl (check for existing)
      if (jobsWithUrl.length > 0) {
        // Check each job individually to see if it exists
        // Using individual queries to work around drizzle-orm version type conflicts
        const existingUrls = new Set<string>();
        
        for (const jobData of jobsWithUrl) {
          if (!jobData.postingUrl) continue;
          
          try {
            // Use Drizzle ORM to check if job exists
            // Type assertion needed due to drizzle-orm version mismatch between packages
            const existing = await db
              .select({ postingUrl: jobs.postingUrl })
              .from(jobs)
              // @ts-expect-error - Type mismatch between drizzle-orm versions, but works at runtime
              .where(eq(jobs.postingUrl, jobData.postingUrl))
              .limit(1);
            
            if (existing.length > 0 && existing[0].postingUrl) {
              existingUrls.add(existing[0].postingUrl);
            }
          } catch (error) {
            // If query fails, assume job doesn't exist and will be inserted
            console.warn(
              `Error checking for existing job with URL ${jobData.postingUrl}:`,
              error
            );
          }
        }

        const toInsert = jobsWithUrl.filter(
          (j) => j.postingUrl && !existingUrls.has(j.postingUrl)
        );
        const toUpdate = jobsWithUrl.filter(
          (j) => j.postingUrl && existingUrls.has(j.postingUrl)
        );

        // Batch insert new jobs
        if (toInsert.length > 0) {
          await db.insert(jobs).values(toInsert);
          insertedCount += toInsert.length;
        }

        // Update existing jobs one by one using Drizzle ORM
        for (const jobData of toUpdate) {
          if (!jobData.postingUrl) continue;
          
          try {
            await db
              .update(jobs)
              .set({
                ...jobData,
                updatedAt: new Date(),
              })
              // @ts-expect-error - Type mismatch between drizzle-orm versions, but works at runtime
              .where(eq(jobs.postingUrl, jobData.postingUrl));
            updatedCount++;
          } catch (error) {
            console.warn(
              `Error updating job with URL ${jobData.postingUrl}:`,
              error
            );
          }
        }
      }

      // Insert jobs without postingUrl (always new)
      if (jobsWithoutUrl.length > 0) {
        await db.insert(jobs).values(jobsWithoutUrl);
        insertedCount += jobsWithoutUrl.length;
      }

      console.log(
        `Upserted ${scrapedJobs.length} jobs: ${insertedCount} inserted, ${updatedCount} updated`
      );

      return {
        success: true,
        url: job.data.url,
        jobsInserted: insertedCount,
        jobsUpdated: updatedCount,
        totalJobs: scrapedJobs.length,
      };
    } catch (error) {
      console.error(`Error scraping job board ${job.data.url}:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: WORKER_CONCURRENCY.JOB_BOARD,
    limiter: RATE_LIMITER.FIRECRAWL,
  }
);
