import { FastifyPluginAsync } from 'fastify';
import { loginHandler, logoutHandler } from './auth.controller.js';
import { loginBodySchema, loginResponseSchema } from './auth.schema.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/login',
    {
      schema: {
        body: loginBodySchema,
        response: {
          200: loginResponseSchema,
        },
      },
    },
    loginHandler
  );

  fastify.post('/logout', { schema: { response: { 200: loginResponseSchema } } }, logoutHandler);
};

export default authRoutes;
