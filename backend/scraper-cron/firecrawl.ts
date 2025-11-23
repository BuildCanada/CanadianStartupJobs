import Firecrawl from "@mendable/firecrawl-js";
import dotenv from "dotenv";
dotenv.config();

class FirecrawlWithOptionalMocks extends Firecrawl {
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
