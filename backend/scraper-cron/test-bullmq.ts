// Test script to verify BullMQ is working with Redis
import { companyDirectoryQueue, jobBoardQueue, closeAllQueues } from "./queues";
import { connectRedis } from "./redisClient";
import dotenv from "dotenv";

dotenv.config();

const testBullMQ = async () => {
  try {
    // Connect to Redis
    await connectRedis();

    // Test adding jobs to queues
    const companyDirJob = await companyDirectoryQueue.add("scrape-directory", {
      url: "https://www.bycanada.tech/",
      timestamp: Date.now(),
    });

    const jobBoardJob = await jobBoardQueue.add("scrape-job-board", {
      url: "https://example.com/careers",
      timestamp: Date.now(),
    });

    // Check queue status
    const companyDirCount = await companyDirectoryQueue.getWaitingCount();
    const jobBoardCount = await jobBoardQueue.getWaitingCount();

    await closeAllQueues();
    process.exit(0);
  } catch (error) {
    await closeAllQueues();
    process.exit(1);
  }
};

testBullMQ();

