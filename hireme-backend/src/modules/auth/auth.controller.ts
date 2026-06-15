import { FastifyReply, FastifyRequest } from 'fastify';
import { validateAdminCredentials } from './auth.service.js';

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as { email: string; password: string };
  const user = await validateAdminCredentials(request.server, body.email, body.password);
  if (!user) {
    reply.unauthorized('Invalid credentials');
    return;
  }

  const session = request.session as any;
  session.user = { id: user.id, email: user.email };
  reply.send({ message: 'Login successful' });
}

export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
  const session = request.session as any;
  session.user = null;
  reply.send({ message: 'Logout successful' });
}
