import { firecrawl } from "./firecrawl";
import { listingTool, openaiClient } from "./openaiClient";
import type { ChatCompletion } from "openai/resources";
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
  const scrapeResults = await firecrawl.batchScrape(companyDirsToSearch, {
    options: {
      formats: [
        {
          type: "json",
          schema: schema as any,
        },
      ],
    },
  });
  for (const scrapeResult of scrapeResults.data) {
    console.log("Scrape result received.", scrapeResult);

    const scrapeResultJobBoards = (scrapeResult.json as any)?.jobBoards || [];
    allJobBoards.push(...scrapeResultJobBoards);
    const scrapeResultCompanies = (scrapeResult.json as any)?.companies || [];
    console.log(JSON.stringify(scrapeResult, null, 2), "Scraped job boards");
    console.log(scrapeResultCompanies, "Scraped companies");
    const scrapeResultCompanyDirs =
      (scrapeResult.json as any)?.companyDirectories || [];
    allCompanyDirs.push(...scrapeResultCompanyDirs);
    for (const company of scrapeResultCompanies) {
      console.log(
        `Found company URL: ${company.url} checking for associated job boards...`
      );
      const buildPotentialJobBoardUrls = (company: { url: string }) => {
        console.log(company.url, "Company URL");
        const url = company.url;
        const baseUrlDomain = new URL(url).hostname;
        const baseUrlDomainWithoutTld = new URL(url).hostname.replace(
          /\.[^/.]+$/,
          ""
        );
        return [
          `https://${baseUrlDomain}/en-ca/careers`,
          `https://${baseUrlDomain}/en-ca/jobs`,
          `https://${baseUrlDomain}/careers`,
          `https://${baseUrlDomain}/jobs`,
          `https://jobs.ashbyhq.com/${baseUrlDomainWithoutTld}`,
          `https://${baseUrlDomainWithoutTld}.applytojob.com`,
          `https://jobs.lever.co/${baseUrlDomainWithoutTld}`,
        ];
      };
      const potentialJobBoardUrls = buildPotentialJobBoardUrls(company);
      const potentialJobBoardUrlsValidated = [];
      for (const url of potentialJobBoardUrls) {
        const res = await fetch(url, { method: "HEAD" });

        const checkRedirectsOnAts = async (response: Response) => {
          if (response.redirected) {
            if (
              response.url.includes("jobs.lever.co") ||
              response.url.includes("applytojob.com") ||
              response.url.includes("ashbyhq.com") ||
              response.url.includes("info.jazzhr.com")
            ) {
              return false;
            }
            return true;
          }
          return true;
        };
        const noRedirectsOnAts = await checkRedirectsOnAts(res);

        if (res.ok && noRedirectsOnAts) {
          potentialJobBoardUrlsValidated.push(res.url);
        }
      }
      if (potentialJobBoardUrlsValidated.length > 0) {
        allJobBoards.push(potentialJobBoardUrlsValidated[0]);
      }
    }
  }
  console.log("Completed scraping. Found totals:", allJobBoards);
};
