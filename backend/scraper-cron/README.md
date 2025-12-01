# Scraper Cron

Service to scrape data from data sources as listed in resourceList.md

## How It Works

Scrapes company directories from `sources.ts`,  discovers job board URLs, then batch scrapes them using Firecrawl with a structured job schema. Results are written to `new_jobs.json`.

## Uses

Used a mixture of playwright, open ai, and firecrawl to accomplish this. Firecrawl isn't great at pagination so we opted to use playwright + open ai for the heavy lifting.

## Environment Variables

Copy `.env.example` to `.env` and fill in:
- `FIRE_CRAWL_API_KEY` - Firecrawl API key for web scraping
- `OPENAI_API_KEY` - OpenAI API key for AI extraction
- `REDIS_URL` - Redis connection URL (or use `REDIS_HOST` and `REDIS_PORT`)

## Startup

```bash
npm install
npm run dev
```

Scrapes job boards from company directories and outputs to `new_jobs.json`.



    parallelizaton/queueing
    setting this up to run on a cron
    working onfault tolerance
    saving to jobs to the db
    filtering jobs/companies being parsed - probably most important to make sure they are actually startups.
