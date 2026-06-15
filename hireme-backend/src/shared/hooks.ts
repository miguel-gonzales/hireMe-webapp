import { FastifyReply, FastifyRequest } from 'fastify';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const session = request.session as { user?: { id: string; email: string } } | undefined;
  if (!session?.user?.id) {
    reply.unauthorized('Authentication required');
    return;
  }
}
