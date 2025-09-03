import { z } from 'zod';

// Configuration schema with Zod validation
const configSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
});

type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    console.error('Invalid configuration:', error);
    process.exit(1);
  }
}