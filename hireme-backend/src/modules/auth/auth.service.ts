import bcrypt from 'bcryptjs';
import { FastifyInstance } from 'fastify';
import { RecruitingUser } from '../../shared/types.js';

export async function validateAdminCredentials(
  fastify: FastifyInstance,
  email: string,
  password: string
): Promise<Pick<RecruitingUser, 'id' | 'email'> | null> {
  const { data, error } = await fastify.supabase
    .from('recruiting_users')
    .select('id, email, password_hash')
    .eq('email', email)
    .limit(1)
    .maybeSingle();

  if (error) {
    fastify.log.error(error);
    throw fastify.httpErrors.internalServerError('Unable to validate credentials');
  }

  if (!data) {
    return null;
  }

  const isValid = await bcrypt.compare(password, data.password_hash);
  if (!isValid) {
    return null;
  }

  return { id: data.id, email: data.email };
}
