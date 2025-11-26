import { firecrawl, schema, universalPaginationActions } from "../firecrawl";

export const scrapeCompanyDirs = async (companyDirsToSearch: string[]) => {
  const companyDirsCollected = [];
  const jobBoardsCollected = [];
  let i = 0;
  const scrapeResults = { data: [] };

  for (const dirUrl of companyDirsToSearch) {
    const scrapeResult = await firecrawl.scrape(dirUrl, {
      engine: "playwright",
      waitUntil: "networkidle",
      actions: universalPaginationActions,
      formats: [
        {
          type: "json",
          schema,
        },
      ],
    });
    scrapeResults.data.push(scrapeResult);
  }
  for (const scrapeResult of scrapeResults.data) {
    const scrapeResultJobBoards = (scrapeResult.json as any)?.jobBoards || [];
    jobBoardsCollected.push(...scrapeResultJobBoards);
    const scrapeResultCompanies = (scrapeResult.json as any)?.companies || [];
    const scrapeResultCompanyDirs =
      (scrapeResult.json as any)?.companyDirectories || [];
    companyDirsCollected.push(...scrapeResultCompanyDirs);
    for (const company of scrapeResultCompanies) {
      const buildPotentialJobBoardUrls = (company: { url: string }) => {
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
        for (let i = 0; i < 3; i++) {
          if (potentialJobBoardUrlsValidated[i]) {
            jobBoardsCollected.push(potentialJobBoardUrlsValidated[i]);
          }
        }
      }
    }
  }

  return {
    companyDirsCollectedByScrape: companyDirsCollected,
    jobBoardsCollectedByScrape: jobBoardsCollected,
  };
};
