import { Worker } from "bullmq";
import dotenv from "dotenv";
import { connectRedis } from "../redisClient";
import { jobBoardWorker } from "./jobBoardWorker";
import { companyDirectoryWorker } from "./companyDirWorker";
import { mapCompanyDirWorker } from "./mapCompanyDirWorker";

dotenv.config();



// Set up event listeners
mapCompanyDirWorker.on("completed", (job) => {
  // Job completed
});

mapCompanyDirWorker.on("failed", (job, err) => {
  // Job failed
});

companyDirectoryWorker.on("completed", (job) => {
  // Job completed
});

companyDirectoryWorker.on("failed", (job, err) => {
  // Job failed
});

jobBoardWorker.on("completed", (job) => {
  // Job completed
});

jobBoardWorker.on("failed", (job, err) => {
  // Job failed
});

// Initialize Redis connection when workers start
mapCompanyDirWorker.on("ready", async () => {
  await connectRedis();
});

companyDirectoryWorker.on("ready", async () => {
  // Worker ready
});

jobBoardWorker.on("ready", async () => {
  // Worker ready
});


// Graceful shutdown
const shutdown = async () => {
  await Promise.all([
    mapCompanyDirWorker.close(),
    companyDirectoryWorker.close(),
    jobBoardWorker.close()
  ]);
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

