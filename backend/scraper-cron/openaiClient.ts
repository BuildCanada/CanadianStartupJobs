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
          description: "A list of job board URLs. only show here if the url explicitly mentions job boards or career pages.",
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

function buildMockAssistantResponseFromToolResult(content: string) {
  const parsed = JSON.parse(content);
  const jobBoards = Array.isArray(parsed.jobBoards) ? parsed.jobBoards : [];
  const companyDirectories = Array.isArray(parsed.companyDirectories)
    ? parsed.companyDirectories
    : [];
  const lines: string[] = [];
  if (jobBoards.length) {
    lines.push(`Found ${jobBoards.length} job boards:`);
    for (const url of jobBoards) {
      lines.push(`- ${url}`);
    }
  }
  if (companyDirectories.length) {
    lines.push(`Found ${companyDirectories.length} company directories:`);
    for (const url of companyDirectories) {
      lines.push(`- ${url}`);
    }
  }

  return {
    id: "chatcmpl-mock",
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "gpt-4o-mock",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: lines.join("\n"),
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 5,
      completion_tokens: 7,
    },
  } as Awaited<ReturnType<OpenAI["chat"]["completions"]["create"]>>;
}

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
