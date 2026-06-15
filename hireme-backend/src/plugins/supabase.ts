import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  fastify.decorate('supabase', client);
});
