import express from "express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import {
  mapCompanyDirQueue,
  companyDirectoryQueue,
  jobBoardQueue,
} from "./queues";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Create Express adapter for Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

// Create BullMQ Board with all queues
createBullBoard({
  queues: [
    new BullMQAdapter(mapCompanyDirQueue),
    new BullMQAdapter(companyDirectoryQueue),
    new BullMQAdapter(jobBoardQueue),
  ],
  serverAdapter,
});

// Mount BullMQ Board at the '/admin/queues' route
app.use("/admin/queues", serverAdapter.getRouter());

// Health check endpoint
app.get("/", (req, res) => {
  res.redirect("/admin/queues");
});

const PORT = process.env.BULL_BOARD_PORT || 3000;

app.listen(PORT, () => {
  // BullMQ Board running
});

