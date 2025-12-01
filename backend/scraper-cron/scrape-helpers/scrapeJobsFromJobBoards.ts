import { firecrawl, jobSchema } from "firecrawl";

export const scrapeJobsFromJobBoards = async (jobBoards: string[]) => {
  const allJobs = [];
  const result = await firecrawl.batchScrape(jobBoards, {
    options: {
      formats: [{ type: "json", schema: jobSchema }],
    },
  });

  const jobChunks = result.data.map((elem) => {
    try {
      const jobs = (elem.json as { jobs: { title: string }[] }).jobs;
      return jobs;
    } catch (err) {
      console.log(err, elem.json);
      return [] as unknown as {
        title: string;
      }[];
    }
  });

  for (const jobChunk of jobChunks) {
    allJobs.push(...jobChunk);
  }
  return allJobs;
};
