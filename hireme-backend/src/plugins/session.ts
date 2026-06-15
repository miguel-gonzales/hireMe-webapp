import fastifySession from '@fastify/session';
import fp from 'fastify-plugin';
import { env } from '../../config/env.js';

export default fp(async (fastify) => {
  await fastify.register(fastifySession, {
    secret: env.SESSION_SECRET,
    cookie: {
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8,
    },
    saveUninitialized: false,
  });
});
