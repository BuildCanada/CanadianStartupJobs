import { scrapeAndExtract } from "customScrapeAndExtract";

export const scrapeCompanyDirs = async (companyDirsToSearch: string[]) => {
  const companyDirsCollected = [];
  const jobBoardsCollected = [];
  for (const dirUrl of companyDirsToSearch) {
    // use custom extractor to get job boards, directories and companies
    const result = await scrapeAndExtract({ url: dirUrl });

    const { jobBoards, companyDirectories, companies } = result;

    companyDirsCollected.push(...companyDirectories.map((elem) => elem.url));
    jobBoardsCollected.push(...jobBoards.map((elem) => elem.url));

    // for each company validate potential job boards.
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
      for (const url of potentialJobBoardUrls) {
        console.log("Checking job boards");
        try {
          const res = await fetch(url, {
            method: "HEAD",
            signal: AbortSignal.timeout(1000),
          });

          if (res.ok) {
            jobBoardsCollected.push(res.url);
            break;
          }
        } catch (err) {}
      }
    }
  }

  return {
    companyDirsCollectedByScrape: companyDirsCollected,
    jobBoardsCollectedByScrape: jobBoardsCollected,
  };
};
