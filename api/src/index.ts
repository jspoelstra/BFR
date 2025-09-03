import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import { loadConfig } from './config.js';
import { createRepositories } from './repositories/index.js';
import { prisma } from './database.js';

const config = loadConfig();

// Create Fastify instance with Pino logging and request ID generation
const fastify = Fastify({
  logger: {
    level: config.LOG_LEVEL,
    genReqId: () => randomUUID(),
  },
});

// Create repositories and make them available globally
const repositories = createRepositories();

// Decorate Fastify instance with repositories for dependency injection
fastify.decorate('repositories', repositories);

// Add database connection to Fastify
fastify.decorate('prisma', prisma);

// Add request ID to all responses
fastify.addHook('onRequest', async (request, reply) => {
  reply.header('x-request-id', request.id);
});

// Health check endpoint
fastify.get('/healthz', async (request, reply) => {
  request.log.info({ requestId: request.id }, 'Health check requested');
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1 as test`;
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'bfr-api',
      version: '1.0.0',
      requestId: request.id,
      database: 'connected',
    };
  } catch (error) {
    request.log.error(error, 'Database connection failed');
    reply.status(503);
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'bfr-api',
      version: '1.0.0',
      requestId: request.id,
      database: 'disconnected',
      error: 'Database connection failed',
    };
  }
});

// Audit log test endpoint to verify audit repository works
fastify.post('/audit-test', async (request, reply) => {
  try {
    const audit = await repositories.audit.create({
      action: 'api_test',
      details: { endpoint: '/audit-test', timestamp: new Date().toISOString() },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    request.log.info({ auditId: audit.id }, 'Test audit log created');
    
    return {
      status: 'ok',
      message: 'Audit log created successfully',
      auditId: audit.id,
    };
  } catch (error) {
    request.log.error(error, 'Failed to create audit log');
    reply.status(500);
    return {
      status: 'error',
      message: 'Failed to create audit log',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ 
      port: config.PORT, 
      host: '0.0.0.0' 
    });
    
    fastify.log.info({
      port: config.PORT,
      environment: config.NODE_ENV,
    }, 'BFR API server started successfully');
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully`);
  
  try {
    await fastify.close();
    await prisma.$disconnect();
    fastify.log.info('Server closed successfully');
    process.exit(0);
  } catch (err) {
    fastify.log.error(err, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start();