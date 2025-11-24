import { ChatCompletion } from "openai/resources";
import { firecrawl } from "../firecrawl";
import { listingTool, openaiClient } from "../openaiClient";

export const mapCompanyDirs = async (
  companyDirsToSearch: string[]
): Promise<{
  companyDirsCollectedByMap: string[];
  jobBoardsCollectedByMap: string[];
}> => {
  const companyDirsCollected: string[] = [];
  const jobBoardsCollected: string[] = [];
  for (const url of companyDirsToSearch) {
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
      return {
        companyDirsCollectedByMap: companyDirsCollected,
        jobBoardsCollectedByMap: jobBoardsCollected,
      };
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
        companyDirsCollected.push(...(parsedArgs.companyDirectories || []));
        jobBoardsCollected.push(...(parsedArgs.jobBoards || []));
      }
    }
  }
  return {
    companyDirsCollectedByMap: companyDirsCollected,
    jobBoardsCollectedByMap: jobBoardsCollected,
  };
};
