import { companyDirectoryUrls, jobBoardUrls } from "sources";
import { firecrawl } from "./firecrawl";
import { listingTool, openaiClient } from "./openaiClient";
import type { ChatCompletion } from "openai/resources";
import { z } from "zod";
import fs from "fs";
const schema = {
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

export const recursiveLinkGathering = async (
  companyDirsToSearch: string[],
  jobBoardsToSearch: string[],
  allCompanyDirs: string[] = [],
  allJobBoards: string[] = [],
  depth = 0
) => {
  let i = 0;

  // get all url associated with current company dirs to search, categorize as job board or company dir.
  for (const url of companyDirsToSearch) {
    if (i > 0) break;
    i++;
    const result = await firecrawl.map(url, {
      limit: 50,
      sitemap: "include",
    });

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at extracting company names and descriptions from website content always use the listing tool to extract urls from user messages.",
        },
        {
          role: "user",
          content: `Extract the company names and descriptions from the following links:\n\n${result.links
            .map(
              (link) =>
                ` ${link.url}
                - ${link.title ?? "No Title"}: ${
                  link.description ?? "No Description"
                }`
            )
            .join("\n")}`,
        },
      ],
      tools: [listingTool],
      tool_choice: "required",
    });

    // Type guard to ensure it's a ChatCompletion (not a stream)
    if (!("choices" in response)) {
      console.error("Unexpected response type - expected ChatCompletion");
      return;
    }

    const chatCompletion = response as ChatCompletion;

    // Check if the response contains tool calls
    const message = chatCompletion.choices[0]?.message;
    const newCompanyDirs = [];
    const newJobBoards = [];

    if (message?.tool_calls && message.tool_calls.length > 0) {
      // Prepare tool messages with function results
      const toolCall = message.tool_calls[0];

      // Type guard to check if it's a function tool call
      if (toolCall.type === "function" && "function" in toolCall) {
        const parsedArgs = JSON.parse(toolCall.function.arguments);
        newCompanyDirs.push(...(parsedArgs.companyDirectories || []));
        newJobBoards.push(...(parsedArgs.jobBoards || []));
      }
    }

    for (const companyDir of newCompanyDirs) {
      console.log(`Found company directory URL: ${companyDir}`);
    }

    allCompanyDirs.push(...newCompanyDirs);
    allJobBoards.push(...newJobBoards);

    if (depth < 2 && (newJobBoards.length > 0 || newCompanyDirs.length > 0)) {
      console.log("Recursing to next depth:", depth + 1);
      await recursiveLinkGathering(
        newCompanyDirs,
        newCompanyDirs,
        allCompanyDirs,
        allJobBoards,
        depth + 1
      );
    }
  }
  // scrape company dirs for job boards and individual companies
  console.log(
    "Starting batch scrape for company directories...",
    companyDirsToSearch
  );
  const scrapeResult = await firecrawl.batchScrape(companyDirsToSearch, {
    options: {
      formats: [
        {
          type: "json",
          schema: schema as any, // Firecrawl expects Record<string, unknown> but ZodObject works at runtime
        },
      ],
    },
  });

  console.log("Scrape result new:", JSON.stringify(scrapeResult, null, 2));
  fs.writeFileSync("scrapeResult.json", JSON.stringify(scrapeResult, null, 2));
};
