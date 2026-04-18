# @canadian-startup-jobs/db


Currently skeleton - feel free to throw this out and create a new one.
Database package for the Canadian Startup Jobs monorepo. This package provides a shared Drizzle ORM connection to PostgreSQL that can be used across multiple services.

## Installation

From other packages in the monorepo, you can import this package:

```typescript
import { db, schema } from "@canadian-startup-jobs/db";
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (copy `.env.example` to `.env` and adjust if needed):
```bash
cp .env.example .env
```

3. Build the package:
```bash
npm run build
```

## Usage

### Basic Query Example

```typescript
import { db } from "@canadian-startup-jobs/db";
import { users } from "@canadian-startup-jobs/db/schema";

// Query example
const allUsers = await db.select().from(users);
```

### Using in Other Services

In your service's `package.json`, add this package as a dependency:

```json
{
  "dependencies": {
    "@canadian-startup-jobs/db": "workspace:*"
  }
}
```

Then import and use:

```typescript
import { db } from "@canadian-startup-jobs/db";
```

## Database Migrations

Generate migrations:
```bash
npm run db:generate
```

Push schema changes directly (for development):
```bash
npm run db:push
```

Run migrations:
```bash
npm run db:migrate
```

Open Drizzle Studio (database GUI):
```bash
npm run db:studio
```

## Environment Variables

The package uses the following environment variables (with defaults matching docker-compose.yml):

- `POSTGRES_HOST` (default: `localhost`)
- `POSTGRES_PORT` (default: `5432`)
- `POSTGRES_USER` (default: `postgres`)
- `POSTGRES_PASSWORD` (default: `postgres`)
- `POSTGRES_DB` (default: `canadian_startup_jobs`)

Alternatively, you can use a `DATABASE_URL` connection string.

## Schema

Define your database schema in `src/schema/index.ts` or create separate schema files and export them from the index.

