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

class FirecrawlWithOptionalMocks extends Firecrawl {
  override async batchScrape(
    urls: string[],
    options: Parameters<Firecrawl["batchScrape"]>[1] & {
      useMocks?: boolean;
    } = {}
  ): Promise<Awaited<ReturnType<Firecrawl["batchScrape"]>>> {
    if (process.env.NODE_ENV === "local") {
      console.log("Returning mocked Firecrawl batch scrape response");
      return {
        id: "41909ede-22c5-4c75-b005-c45c249cef3a",
        status: "completed",
        completed: 1,
        total: 1,
        creditsUsed: 5,
        expiresAt: "2025-11-24T17:26:50.000Z",
        next: null,
        data: [
          {
            metadata: {
              "og:title": "Coast-to-Coast Startup Directory",
              viewport:
                "width=device-width, initial-scale=1, viewport-fit=cover",
              "twitter:card": "summary_large_image",
              ogDescription:
                "Search through 10k+ Canadian startups coast-to-coast.\n\nFind alternatives to software & products you use made right here in Canada. ",
              "og:type": "website",
              description:
                "Search through 10k+ Canadian startups coast-to-coast.\n\nFind alternatives to software & products you use made right here in Canada. ",
              "twitter:description": [
                "Search through 10k+ Canadian startups coast-to-coast.\n\nFind alternatives to software & products you use made right here in Canada. ",
                "Search through 10k+ Canadian startups coast-to-coast.\n\nFind alternatives to software & products you use made right here in Canada. ",
              ],
              "twitter:url": "https://www.bycanada.tech/",
              language: "en-US",
              ogSiteName: "ByCanada",
              "og:site_name": "ByCanada",
              "twitter:image":
                "https://assets.softr-files.com/applications/eceb64d9-9bcb-4edd-a269-9cc17106ab30/assets/841d5078-0e11-4af1-b1dc-8d445ca4fe56.jpeg",
              ogUrl: "https://www.bycanada.tech/",
              ogTitle: "Coast-to-Coast Startup Directory",
              ogImage:
                "https://assets.softr-files.com/applications/eceb64d9-9bcb-4edd-a269-9cc17106ab30/assets/841d5078-0e11-4af1-b1dc-8d445ca4fe56.jpeg",
              "og:description":
                "Search through 10k+ Canadian startups coast-to-coast.\n\nFind alternatives to software & products you use made right here in Canada. ",
              "twitter:title": [
                "Coast-to-Coast Startup Directory",
                "Coast-to-Coast Startup Directory",
              ],
              "og:image":
                "https://assets.softr-files.com/applications/eceb64d9-9bcb-4edd-a269-9cc17106ab30/assets/841d5078-0e11-4af1-b1dc-8d445ca4fe56.jpeg",
              "og:url": "https://www.bycanada.tech/",
              title: "ByCanada.Tech - Coast-to-Coast Startup Directory",
              favicon:
                "https://assets.softr-files.com/applications/eceb64d9-9bcb-4edd-a269-9cc17106ab30/assets/be5bd453-f386-44ef-a7a8-e2527e23b81b.png?rnd=1738710374276",
              scrapeId: "1011d7d4-1cbc-4ba1-9a02-3d2a016ac9c6",
              sourceURL: "https://www.bycanada.tech/",
              url: "https://www.bycanada.tech/",
              statusCode: 200,
              contentType: "text/html;charset=utf-8",
              proxyUsed: "basic",
              cacheState: "hit",
              cachedAt: "2025-11-23T16:40:35.797Z",
              creditsUsed: 5,
            },
            json: {
              companies: [
                {
                  url: "https://vidyard.com",
                  isCanadian: true,
                  isVcBacked: false,
                  companyName: "Vidyard",
                },
                {
                  url: "https://wealthsimple.com",
                  isCanadian: true,
                  isVcBacked: false,
                  companyName: "Wealthsimple",
                },
                {
                  url: "https://advite.ai",
                  isCanadian: true,
                  isVcBacked: false,
                  companyName: "Advite",
                },
                {
                  url: "https://cohere.com",
                  isCanadian: true,
                  isVcBacked: false,
                  companyName: "Cohere",
                },
                {
                  url: "https://freshbooks.com",
                  isCanadian: true,
                  isVcBacked: false,
                  companyName: "FreshBooks",
                },
                {
                  url: "https://ridehovr.com",
                  isCanadian: true,
                  isVcBacked: false,
                  companyName: "HOVR",
                },
                {
                  url: "https://therounds.com",
                  isCanadian: true,
                  isVcBacked: false,
                  companyName: "The Rounds",
                },
                {
                  url: "https://getjobber.com",
                  isCanadian: true,
                  isVcBacked: false,
                  companyName: "Jobber",
                },
              ],
              jobBoards: [],
              companyDirectories: [],
            },
          },
        ],
      };
    } else return super.batchScrape(urls, options);
  }
  override async map(
    url: string,
    options: Parameters<Firecrawl["map"]>[1] & { useMocks?: boolean } = {}
  ) {
    if (process.env.NODE_ENV === "local") {
      console.log("Returning mocked Firecrawl response");
      return {
        links: [
          {
            url: "https://www.bycanada.tech/search-category",
            title: "Coast-to-Coast Startup Directory",
            description:
              "Search through 10k+ Canadian startups coast-to-coast. Find alternatives to software & products you use made right here in Canada.",
          },
          {
            url: "https://www.bycanada.tech/contribute",
            title: "Contribute",
            description:
              "Add a Business. © 2025 ByCanada. All rights reserved. Made with Free AI No Code App Builder | Portals | Internal Tools.",
          },
          {
            url: "https://www.bycanada.tech/search-location",
          },
          {
            url: "https://www.bycanada.tech/careers",
          },
          {
            url: "https://www.bycanada.tech/profile",
          },
          {
            url: "https://www.bycanada.tech",
            title: "ByCanada.Tech - Coast-to-Coast Startup Directory",
            description:
              "Search through 10k+ Canadian startups coast-to-coast. Find alternatives to software & products you use made right here in Canada.",
          },
          {
            url: "https://www.bycanada.tech/addabusiness",
          },
          {
            url: "https://www.bycanada.tech/contactus",
            title: "Contact Us",
            description:
              "Search through 10k+ Canadian startups coast-to-coast. Find alternatives to software & products you use made right here in Canada.",
          },
        ],
      };
    } else return super.map(url, options);
  }
}

export const firecrawl = new FirecrawlWithOptionalMocks({
  apiKey: process.env.FIRE_CRAWL_API_KEY!,
});

export const universalPaginationActions: ActionOption[] = [
  // 1. Infinite Scroll Handler
  {
    type: "scroll",
    direction: "down",
    maxRepeats: 5,
  },

  // 2. Semantic Pagination Buttons ("see more", "load more", "next")
  {
    type: "click",
    selector: "button, a",
    maxRepeats: 5,
  },

  // 3. Numeric Pagination Buttons (1 2 3 4 ...)
  {
    type: "click",
    maxRepeats: 5,
    selector: "button, a",
  },

  // 4. rel="next" SEO Pagination
  {
    type: "click",
    selector: "a[rel='next']",
    maxRepeats: 5,
  },

  // 5. Auto-scroll again after clicking
  {
    type: "scroll",
    direction: "down",
    maxRepeats: 5,
  },
];
