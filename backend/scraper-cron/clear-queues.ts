// Simple script to clear all BullMQ queues
import {
  mapCompanyDirQueue,
  companyDirectoryQueue,
  jobBoardQueue,
  closeAllQueues,
} from "./queues";
import { connectRedis } from "./redisClient";
import dotenv from "dotenv";

dotenv.config();

const clearQueues = async () => {
  await connectRedis();

  console.log("Clearing all queues...");

  const queues = [
    { name: "map-company-directories", queue: mapCompanyDirQueue },
    { name: "company-directories", queue: companyDirectoryQueue },
    { name: "job-boards", queue: jobBoardQueue },
  ];

  for (const { name, queue } of queues) {
    try {
      // Get counts before clearing
      const waiting = await queue.getWaitingCount();
      const active = await queue.getActiveCount();
      const completed = await queue.getCompletedCount();
      const failed = await queue.getFailedCount();
      const delayed = await queue.getDelayedCount();

      const total = waiting + active + completed + failed + delayed;

      if (total > 0) {
        // Clear all job states
        await queue.obliterate({ force: true });
        console.log(`✓ Cleared ${name}: ${total} jobs (${waiting} waiting, ${active} active, ${completed} completed, ${failed} failed, ${delayed} delayed)`);
      } else {
        console.log(`✓ ${name}: already empty`);
      }
    } catch (error) {
      console.error(`✗ Error clearing ${name}:`, error);
    }
  }

  await closeAllQueues();
  console.log("\nAll queues cleared!");
  process.exit(0);
};

clearQueues().catch((error) => {
  console.error("Error clearing queues:", error);
  process.exit(1);
});

