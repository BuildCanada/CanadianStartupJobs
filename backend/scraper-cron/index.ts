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
    index < WORKER_CONCURRENCY.MAP_COMPANY_BREADTH
      ? mapCompanyDirQueue.add("map-company-directory", { url })
      : Promise.resolve()
  );

  const results = await Promise.allSettled(mapPromises);
  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  if (failed > 0) {
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        // Failed to add mapping job
      }
    });
  }
};

getAllJobs().catch((error) => {
  process.exit(1);
});
