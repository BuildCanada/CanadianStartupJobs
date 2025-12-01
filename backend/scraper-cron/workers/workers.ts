import { Worker } from "bullmq";
import dotenv from "dotenv";
import { connectRedis } from "../redisClient";
import { jobBoardWorker } from "./jobBoardWorker";
import { redisConnection } from "../queues";
import { companyDirectoryWorker } from "./companyDirWorker";
import { mapCompanyDirWorker } from "./mapCompanyDirWorker";
import {
  WORKER_CONCURRENCY,
  RATE_LIMITER,
} from "../constants";

dotenv.config();



// Set up event listeners
mapCompanyDirWorker.on("completed", (job) => {
  console.log(`Map company directory job ${job.id} completed`);
});

mapCompanyDirWorker.on("failed", (job, err) => {
  console.error(`Map company directory job ${job?.id} failed:`, err);
});

companyDirectoryWorker.on("completed", (job) => {
  console.log(`Company directory job ${job.id} completed`);
});

companyDirectoryWorker.on("failed", (job, err) => {
  console.error(`Company directory job ${job?.id} failed:`, err);
});

jobBoardWorker.on("completed", (job) => {
  console.log(`Job board job ${job.id} completed`);
});

jobBoardWorker.on("failed", (job, err) => {
  console.error(`Job board job ${job?.id} failed:`, err);
});

// Initialize Redis connection when workers start
mapCompanyDirWorker.on("ready", async () => {
  console.log("Map company directory worker ready");
  await connectRedis();
});

companyDirectoryWorker.on("ready", async () => {
  console.log("Company directory worker ready");
});

jobBoardWorker.on("ready", async () => {
  console.log("Job board worker ready");
});


// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down workers...");
  await Promise.all([
    mapCompanyDirWorker.close(),
    companyDirectoryWorker.close(),
    jobBoardWorker.close()
  ]);
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

