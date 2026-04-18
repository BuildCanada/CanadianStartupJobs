# Canadian Startup Jobs
A community-driven job board connecting top talent with Canadian-owned and operated startups.

## Overview
Canadian Startup Jobs focuses on promoting local innovation, helping founders hire within Canada, and giving job seekers access to authentic, homegrown opportunities across tech, design, marketing, and more.

CanadianStartupJobs is built to strengthen Canada’s startup ecosystem by making it easier for:
- **Founders** to showcase their startups and hire verified Canadian talent.
- **Job seekers** to discover opportunities at innovative, homegrown companies.
- **Communities** to highlight the impact of Canadian entrepreneurship.

## For Contributors

see `/docs`

## Features (Planned)
- Search and filter jobs
- Verified Canadian-owned startups only
- Simple job posting and management dashboard for founders
- Public API for regional innovation hubs and directories, such as university accelerators

## Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js (for backend services)

### Database Setup

Start PostgreSQL using Docker Compose:

```bash
docker-compose up -d postgres
```

This will start a PostgreSQL 16 database with the following default configuration:
- **User**: `postgres`
- **Password**: `postgres`
- **Database**: `canadian_startup_jobs`
- **Port**: `5432`

You can customize these settings by creating a `.env` file in the project root with:

```env
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_database
POSTGRES_PORT=5432
```

The database data will be persisted in a Docker volume. To stop the database:

```bash
docker-compose down
```

To remove the database and all data:

```bash
docker-compose down -v
```