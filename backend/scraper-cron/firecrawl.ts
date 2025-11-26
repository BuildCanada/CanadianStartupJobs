import Firecrawl, {
  ActionOption,
  FirecrawlClientOptions,
} from "@mendable/firecrawl-js";
import dotenv from "dotenv";
dotenv.config();

export const schema = {
  type: "object",
  properties: {
    jobBoards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          jobBoardName: { type: "string" },
          url: { type: "string" },
        },
        required: ["jobBoardName", "url"],
      },
    },
    companies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          companyName: { type: "string" },
          url: { type: "string" },
          isCanadian: { type: "boolean" },
          isVcBacked: { type: "boolean" },
        },
        required: ["companyName", "url", "isCanadian", "isVcBacked"],
      },
    },
    companyDirectories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          directoryName: { type: "string" },
          url: { type: "string" },
        },
        required: ["directoryName", "url"],
      },
    },
  },
  required: ["jobBoards", "companies", "companyDirectories"],
};

export const jobSchema = {
  type: "object",
  properties: {
    jobs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          location: { type: "string" },
          remoteOk: { type: "boolean" },
          salaryMin: { type: "number" },
          salaryMax: { type: "number" },
          description: { type: "string" },
          company: { type: "string" },
          jobBoardUrl: { type: "string" },
          postingUrl: { type: "string" },
        },
        required: [
          "title",
          "location",
          "remoteOk",
          "description",
          "company",

          // salaryMin and salaryMax intentionally omitted
        ],
      },
    },
  },
  required: ["jobs"],
};

export const firecrawl = new Firecrawl({
  apiKey: process.env.FIRE_CRAWL_API_KEY!,
});
