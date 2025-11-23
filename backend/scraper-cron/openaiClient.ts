import { OpenAI } from "openai";

import dotenv from "dotenv";
import { ChatCompletionTool } from "openai/resources";
dotenv.config();

export const listingTool = {
  type: "function",
  function: {
    name: "listing-extractor",
    description:
      "Tool to extract urls and categorize them into two seperate lists, job board and company directory. Respond only with a json object with two keys, 'jobBoards' and 'companyDirectories', each containing an array of urls. Do not include any other text or formatting outside the json object.",
    parameters: {
      type: "object",
      properties: {
        jobBoards: {
          type: "array",
          items: {
            type: "string",
            format: "url",
          },
          description: "A list of job board URLs.",
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

class OpenAIWithOptionalMocks {
  private readonly client: OpenAI;

  constructor(options: { apiKey: string }) {
    this.client = new OpenAI(options);
  }

  get chat() {
    const originalChat = this.client.chat;
    return {
      ...originalChat,
      completions: {
        ...originalChat.completions,
        create: async (
          ...args: Parameters<typeof originalChat.completions.create>
        ) => {
          // Use the mocked OpenAI response when running locally (NODE_ENV === 'local').
          // This keeps the behavior consistent with firecrawl's mock which also checks
          // for NODE_ENV === 'local'. In non-local environments we call the real API.
          if (process.env.NODE_ENV === "local") {
            console.log("Returning mocked OpenAI response");
            const firstArg = args[0];
            const hasTools =
              firstArg &&
              typeof firstArg === "object" &&
              "tools" in firstArg &&
              Array.isArray((firstArg as any).tools) &&
              (firstArg as any).tools.length > 0;

            if (hasTools && (firstArg as any).tools) {
              // Return a tool call response
              return {
                id: "chatcmpl-CeuII0J1clIOOfCwJVufXxv2Y1Qla",
                object: "chat.completion",
                created: 1763865550,
                model: "gpt-4o-2024-08-06",
                choices: [
                  {
                    index: 0,
                    message: {
                      role: "assistant",
                      content: null,
                      tool_calls: [
                        {
                          id: "call_6USmqBwjyOZKM3GnH33iQWNk",
                          type: "function",
                          function: {
                            name: "listing-extractor",
                            arguments:
                              '{"jobBoards":[],"companyDirectories":["https://www.bycanada.tech/search-category","https://www.bycanada.tech/search-location","https://www.bycanada.tech"]}',
                          },
                        },
                      ],
                      refusal: null,
                      annotations: [],
                    },
                    logprobs: null,
                    finish_reason: "tool_calls",
                  },
                ],
                usage: {
                  prompt_tokens: 423,
                  completion_tokens: 48,
                  total_tokens: 471,
                  prompt_tokens_details: {
                    cached_tokens: 0,
                    audio_tokens: 0,
                  },
                  completion_tokens_details: {
                    reasoning_tokens: 0,
                    audio_tokens: 0,
                    accepted_prediction_tokens: 0,
                    rejected_prediction_tokens: 0,
                  },
                },
                service_tier: "default",
                system_fingerprint: "fp_cbf1785567",
              } as Awaited<ReturnType<typeof originalChat.completions.create>>;
            } else {
              // If the incoming message set contains a tool result (role: 'tool'),
              // parse it and create a realistic final assistant response for local testing.
              const messages = (firstArg as any).messages ?? [];
              const toolResultMessage = messages.find(
                (m: any) => m.role === "tool" && !!m.content
              );

              if (toolResultMessage) {
                try {
                  return buildMockAssistantResponseFromToolResult(
                    toolResultMessage.content
                  );
                } catch (err) {
                  console.error(
                    "Error building mock response from tool content:",
                    err
                  );
                  // Fall back to a very small response if our parser fails
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
                          content:
                            "Could not parse tool output during local testing.",
                        },
                        finish_reason: "stop",
                      },
                    ],
                    usage: {
                      prompt_tokens: 5,
                      completion_tokens: 7,
                    },
                  } as Awaited<
                    ReturnType<typeof originalChat.completions.create>
                  >;
                }
              }

              // Return a regular text response
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
                      content: "This is a mocked response from OpenAI API.",
                    },
                    finish_reason: "stop",
                  },
                ],
                usage: {
                  prompt_tokens: 5,
                  completion_tokens: 7,
                },
              } as Awaited<ReturnType<typeof originalChat.completions.create>>;
            }
          } else {
            console.log("Calling real OpenAI API");
            return originalChat.completions.create(...args);
          }
        },
      },
    };
  }
}
export const openaiClient = new OpenAIWithOptionalMocks({
  apiKey: process.env.OPENAI_API_KEY!,
});
