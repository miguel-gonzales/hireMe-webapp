import fastify from 'fastify';
import sensiblePlugin from './plugins/sensible.js';
import cookiePlugin from './plugins/cookie.js';
import sessionPlugin from './plugins/session.js';
import corsPlugin from './plugins/cors.js';
import multipartPlugin from './plugins/multipart.js';
import supabasePlugin from './plugins/supabase.js';
import authRoutes from './modules/auth/auth.routes.js';
import applicationsRoutes from './modules/applications/applications.routes.js';

export function buildApp() {
  const app = fastify({
    logger: true,
  });

  app.register(sensiblePlugin);
  app.register(cookiePlugin);
  app.register(sessionPlugin);
  app.register(corsPlugin);
  app.register(multipartPlugin);
  app.register(supabasePlugin);

  app.register(authRoutes, { prefix: '/v1/auth' });
  app.register(applicationsRoutes, { prefix: '/v1' });

  app.get('/v1', async () => {
    return { message: 'RecruitmentWA API v1 is running' };
  });

  app.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      reply.status(400).send({ error: error.message });
      return;
    }

    if (error.statusCode) {
      reply.status(error.statusCode).send({ error: error.message });
      return;
    }

    request.log.error(error);
    reply.status(500).send({ error: 'Internal Server Error' });
  });

  return app;
}
