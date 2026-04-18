import { OpenAI } from "openai";

import dotenv from "dotenv";
import { ChatCompletionTool } from "openai/resources";
dotenv.config();

export const listingTool = {
  type: "function",
  function: {
    name: "listing-extractor",
    description:
      "Tool to get single url for finding a job board or company directory from a site map",
    parameters: {
      type: "object",
      properties: {
        jobBoards: {
          type: "array",
          items: {
            type: "string",
            format: "url",
          },
          description:
            "A list of job board URLs. only show here if the url explicitly mentions job boards or career pages.",
        },
        companyDirectories: {
          type: "array",
          items: {
            type: "string",
            format: "url",
          },
          description: "A list of company directory URLs.",
        },
      },
      required: ["jobBoards", "companyDirectories"],
    },
  },
} as ChatCompletionTool;

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
