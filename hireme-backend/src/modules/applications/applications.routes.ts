import { FastifyPluginAsync } from 'fastify';
import {
  createApplicationHandler,
  getApplicationHandler,
  listApplicationsHandler,
  updateApplicationStatusHandler,
} from './applications.controller.js';
import {
  applicationListResponseSchema,
  applicationRowSchema,
  applicationStatusUpdateSchema,
} from './applications.schema.js';
import { requireAuth } from '../../shared/hooks.js';

const applicationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/applications', createApplicationHandler);

  fastify.get('/admin/applications', { preHandler: requireAuth, schema: { response: { 200: applicationListResponseSchema } } }, listApplicationsHandler);

  fastify.get('/admin/applications/:id', { preHandler: requireAuth, schema: { response: { 200: applicationRowSchema } } }, getApplicationHandler);

  fastify.patch(
    '/admin/applications/:id/status',
    {
      preHandler: requireAuth,
      schema: {
        body: applicationStatusUpdateSchema,
        response: {
          200: applicationRowSchema,
        },
      },
    },
    updateApplicationStatusHandler
  );
};

export default applicationsRoutes;
