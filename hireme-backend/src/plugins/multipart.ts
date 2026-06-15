import fastifyMultipart from '@fastify/multipart';
import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });
});
