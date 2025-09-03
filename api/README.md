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

3. Start development server:
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

## Development

This API uses:
- **ES Modules** with TypeScript
- **Request ID generation** for tracing
- **Graceful shutdown** handling
- **Structured logging** with Pino