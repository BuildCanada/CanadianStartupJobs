import { ChatCompletion } from "openai/resources";
import { firecrawl } from "../firecrawl";
import { listingTool, openaiClient } from "../openaiClient";
import { BATCH_SETTINGS } from "../constants";

export const mapCompanyDir = async (
  companyDirsToSearch: string[]
): Promise<{
  companyDirsCollectedByMap: string[];
  jobBoardsCollectedByMap: string[];
}> => {
  const companyDirsCollected: string[] = [];
  const jobBoardsCollected: string[] = [];

  for (const companyDirToSearch of companyDirsToSearch) {
    const result = await firecrawl.map(companyDirToSearch, {
      limit: BATCH_SETTINGS.MAP_COMPANY_DIR_LIMIT,
      sitemap: "include",
    });

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You use the listing tool to extract urls with list of companies (known as company directories) and job boards from a map of this site. You choose one of each, you never return a sitemap",
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
    }

    const chatCompletion = response as ChatCompletion;

    // Check if the response contains tool calls
    const message = chatCompletion.choices[0]?.message;

    if (message?.tool_calls && message.tool_calls.length > 0) {
      // Prepare tool messages with function results
      const toolCall = message.tool_calls[0];

      // Type guard to check if it's a function tool call
      if (toolCall.type === "function" && "function" in toolCall) {
        const parsedArgs = JSON.parse(toolCall.function.arguments);
        if (companyDirsCollected.length > 0) {
          companyDirsCollected.push(...(parsedArgs.companyDirectories || []));
        } else {
          companyDirsCollected.push(companyDirToSearch);
        }
        if (jobBoardsCollected.length > 0) {
          jobBoardsCollected.push(...(parsedArgs.jobBoards || []));
        } else jobBoardsCollected.push(companyDirToSearch);
      }
    }
  }

  return {
    companyDirsCollectedByMap: companyDirsCollected,
    jobBoardsCollectedByMap: jobBoardsCollected,
  };
};
