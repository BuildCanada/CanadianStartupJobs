// Test script to verify BullMQ is working with Redis
import { companyDirectoryQueue, jobBoardQueue, closeAllQueues } from "./queues";
import { connectRedis } from "./redisClient";
import dotenv from "dotenv";

dotenv.config();

const testBullMQ = async () => {
  try {
    // Connect to Redis
    await connectRedis();
    console.log("✓ Redis connected");

    // Test adding jobs to queues
    console.log("\nAdding test jobs to queues...");

    const companyDirJob = await companyDirectoryQueue.add("scrape-directory", {
      url: "https://www.bycanada.tech/",
      timestamp: Date.now(),
    });
    console.log(`✓ Added company directory job: ${companyDirJob.id}`);

    const jobBoardJob = await jobBoardQueue.add("scrape-job-board", {
      url: "https://example.com/careers",
      timestamp: Date.now(),
    });
    console.log(`✓ Added job board job: ${jobBoardJob.id}`);

    // Check queue status
    const companyDirCount = await companyDirectoryQueue.getWaitingCount();
    const jobBoardCount = await jobBoardQueue.getWaitingCount();

    console.log(`\nQueue status:`);
    console.log(`  Company directories waiting: ${companyDirCount}`);
    console.log(`  Job boards waiting: ${jobBoardCount}`);

    console.log("\n✓ BullMQ is working correctly!");
    console.log("\nNote: Jobs will be processed when workers are running.");
    console.log("Run 'npm run worker' in another terminal to process jobs.");

    await closeAllQueues();
    process.exit(0);
  } catch (error) {
    console.error("Error testing BullMQ:", error);
    await closeAllQueues();
    process.exit(1);
  }
};

testBullMQ();

