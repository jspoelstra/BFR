import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import { loadConfig } from './config.js';

const config = loadConfig();

// Create Fastify instance with Pino logging and request ID generation
const fastify = Fastify({
  logger: {
    level: config.LOG_LEVEL,
    genReqId: () => randomUUID(),
  },
});

// Add request ID to all responses
fastify.addHook('onRequest', async (request, reply) => {
  reply.header('x-request-id', request.id);
});

// Health check endpoint
fastify.get('/healthz', async (request, reply) => {
  request.log.info({ requestId: request.id }, 'Health check requested');
  
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'bfr-api',
    version: '1.0.0',
    requestId: request.id,
  };
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