# BFR API Service

TypeScript/Fastify API service for the BFR Trainer application.

## Features

- **Fastify Framework**: Fast and lightweight web framework
- **TypeScript**: Type-safe development with ES modules
- **Zod Configuration**: Runtime config validation
- **Pino Logging**: Structured logging with request IDs
- **Health Check**: Built-in health endpoint

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env
   ```

3. Set up database:
   - Install PostgreSQL locally or use a hosted service
   - Create a database for the application
   - Update `DATABASE_URL` in `.env` file

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`.

## Endpoints

### Health Check
- **GET** `/healthz` - Returns API health status with request ID

Example response:
```json
{
  "status": "ok",
  "timestamp": "2025-09-03T03:14:37.044Z",
  "service": "bfr-api",
  "version": "1.0.0",
  "requestId": "req-1"
}
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server (requires build first)

## Configuration

Environment variables (see `.env.example`):

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production/test)
- `LOG_LEVEL` - Logging level (fatal/error/warn/info/debug/trace)
- `DATABASE_URL` - PostgreSQL connection string (required)

### Database Setup

1. Install PostgreSQL locally or use a hosted service
2. Create a database for the application
3. Set the `DATABASE_URL` environment variable:
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   ```

### Database Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations in development
- `npm run db:reset` - Reset database and run all migrations
- `npm run db:deploy` - Deploy migrations to production
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Development

This API uses:
- **ES Modules** with TypeScript
- **Request ID generation** for tracing
- **Graceful shutdown** handling
- **Structured logging** with Pino