import { Queue, Worker, QueueEvents } from "bullmq";
import dotenv from "dotenv";
import { BATCH_SETTINGS } from "./constants";

dotenv.config();

// Redis connection configuration matching existing redisClient setup
export const redisConnection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    };

// Queue for mapping company directories (initial discovery)
export const mapCompanyDirQueue = new Queue("map-company-directories", {
  connection: redisConnection,
});

// Queue for scraping company directories
export const companyDirectoryQueue = new Queue("company-directories", {
  connection: redisConnection,
});

// Queue for scraping job boards
export const jobBoardQueue = new Queue("job-boards", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: BATCH_SETTINGS.QUEUE_DELAY_MS,
    },
  },
});

// Queue events for monitoring
export const mapCompanyDirEvents = new QueueEvents("map-company-directories", {
  connection: redisConnection,
});

export const companyDirectoryEvents = new QueueEvents("company-directories", {
  connection: redisConnection,
});

export const jobBoardEvents = new QueueEvents("job-boards", {
  connection: redisConnection,
});


// Helper to close all queues
export const closeAllQueues = async () => {
  await Promise.all([
    mapCompanyDirQueue.close(),
    companyDirectoryQueue.close(),
    jobBoardQueue.close(),
    mapCompanyDirEvents.close(),
    companyDirectoryEvents.close(),
    jobBoardEvents.close()
  ]);
};

