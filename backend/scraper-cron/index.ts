// will eventually boot cron job, currently just hitting the scraper directly

import { writeFileSync } from "fs";
import { mapCompanyDirQueue, closeAllQueues } from "queues";
import { companyDirectoryUrls } from "sources";
import { connectRedis } from "redisClient";
import { WORKER_CONCURRENCY } from "./constants";

const getAllJobs = async () => {
  await connectRedis();

  // Initialize empty jobs file
  writeFileSync("new_jobs.json", "[]");

  // Add each initial company directory URL to the mapping queue
  // Workers will map them in parallel and add discovered directories/job boards to other queues
  const mapPromises = companyDirectoryUrls.map((url, index) =>
    index < WORKER_CONCURRENCY.MAP_COMPANY_BREADTH ?
    mapCompanyDirQueue.add("map-company-directory", { url })
    : Promise.resolve()
  );

  const results = await Promise.allSettled(mapPromises);
  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`Added ${succeeded} URLs to mapping queue (${failed} failed)`);
  console.log(`Workers will map them in parallel and discover directories/job boards.`);
  
  if (failed > 0) {
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Failed to add mapping job for ${companyDirectoryUrls[index]}:`,
          result.reason
        );
      }
    });
  }
  
  console.log("Jobs added to queue. Workers (running separately) will process them.");
  console.log("Mapping workers will discover company directories and job boards, then add them to queues.");
  console.log("Jobs are persisted in Redis and will survive server crashes.");
  console.log("Make sure workers are running with: npm run worker");

  // Close queue connections and exit
  // Workers run separately and will pick up jobs from Redis
  await closeAllQueues();
};

getAllJobs().catch((error) => {
  console.error("Error in getAllJobs:", error);
  process.exit(1);
});
