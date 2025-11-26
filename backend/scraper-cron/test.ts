import { firecrawl, schema } from "firecrawl";

const getCrawl = async () => {
  const url = "https://www.bycanada.tech/";
  const pathPrefix = "/search-category";
  const crawlResult = await firecrawl.crawl(url, {
    limit: 100, // number of pages to allow via pagination

    maxDiscoveryDepth: 2, // allow pagination links but no roaming
    includePaths: [
      `${pathPrefix}`,
      `${pathPrefix}?page=*`,
      `${pathPrefix}/page/*`,
      `${pathPrefix}?offset=*`,
    ],

    // optional extras
    scrapeOptions: {
      formats: [
        {
          type: "json",
          schema: schema as any,
        },
      ],
    },
  });

  console.log(
    `Completed crawling URL ${JSON.stringify(url)}`,
    JSON.stringify(crawlResult)
  );
  return crawlResult;
};

getCrawl();
