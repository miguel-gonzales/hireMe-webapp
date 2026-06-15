import { FastifyPluginAsync } from 'fastify';
import { loginHandler } from './auth.controller.js';
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
};

export default authRoutes;
