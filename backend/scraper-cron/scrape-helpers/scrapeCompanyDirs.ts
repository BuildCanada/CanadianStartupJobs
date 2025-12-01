import { scrapeAndExtract } from "customScrapeAndExtract";

export const scrapeCompanyDirs = async (companyDirsToSearch: string[]) => {
  const companyDirsCollected = [];
  const jobBoardsCollected = [];
  for (const dirUrl of companyDirsToSearch) {
    // use custom extractor to get job boards, directories and companies
    const result = await scrapeAndExtract({ url: dirUrl });
    console.log("Companies: ", result);

    const { jobBoards, companyDirectories, companies } = result;

    companyDirsCollected.push(...companyDirectories.map((elem) => elem.url));
    jobBoardsCollected.push(...jobBoards.map((elem) => elem.url));

    // for each company validate potential job boards.
    console.log("Testing company", companies);
    for (const company of companies) {
      if (!company.isStartup) break;
      const buildPotentialJobBoardUrls = (url: string) => {
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
          `https://jobs.lever.co/${baseUrlDomainWithoutTld}`,
          `https://jobs.ashbyhq.com/${baseUrlDomainWithoutTld}`,
          `https://${baseUrlDomainWithoutTld}.applytojob.com`,
        ];
      };
      const potentialJobBoardUrls = buildPotentialJobBoardUrls(company.url);
      console.log(potentialJobBoardUrls, "my potential job boards");
      for (const url of potentialJobBoardUrls) {
        try {
          console.log("Checking if job board exists at ", url);
          const res = await fetch(url, {
            method: "HEAD",
            signal: AbortSignal.timeout(1000),
          });

          const checkRedirectsOnAts = (response: Response) => {
            if (!response.redirected) {
              return true;
            }
            if (
              response.url.includes("jobs.lever.co") ||
              response.url.includes("applytojob.com") ||
              response.url.includes("ashbyhq.com") ||
              response.url.includes("info.jazzhr.com")
            ) {
              return true;
            }
            return false;
          };

          const noRedirectsOnAts = checkRedirectsOnAts(res);
          console.log(res.ok, noRedirectsOnAts, "res ok and no redirect");
          if (res.ok && noRedirectsOnAts) {
            jobBoardsCollected.push(res.url);
            break;
          }
        } catch (err) {
          console.log("error", err);
        }
      }
    }
  }

  return {
    companyDirsCollectedByScrape: companyDirsCollected,
    jobBoardsCollectedByScrape: jobBoardsCollected,
  };
};
