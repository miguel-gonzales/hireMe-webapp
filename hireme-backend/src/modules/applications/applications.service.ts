import { FastifyInstance } from 'fastify';
import { env } from '../../../config/env.js';
import { ApplicationRow, ApplicationResponse } from '../../shared/types.js';

const CHECKLIST_BUCKET = env.SUPABASE_RESUMES_BUCKET;

export async function createApplication(
  fastify: FastifyInstance,
  data: Omit<ApplicationRow, 'id' | 'status' | 'created_at' | 'updated_at' | 'resume_storage_path'>,
  file: Buffer,
  contentType: string
): Promise<ApplicationResponse> {
  const application = await fastify.supabase
    .from('applications')
    .insert([
      {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        age: data.age,
        country: data.country,
        city: data.city,
        english_level: data.english_level,
        resume_storage_path: '',
      },
    ])
    .select('*')
    .single();

  if (application.error) {
    fastify.log.error(application.error);
    throw fastify.httpErrors.internalServerError('Unable to create application');
  }

  const appRecord = application.data;
  const objectPath = `${appRecord.id}/resume.pdf`;

  const uploadResult = await fastify.supabase.storage
    .from(CHECKLIST_BUCKET)
    .upload(objectPath, file, {
      contentType,
      upsert: true,
    });

  if (uploadResult.error) {
    fastify.log.error(uploadResult.error);
    throw fastify.httpErrors.internalServerError('Unable to upload resume');
  }

  const updateResult = await fastify.supabase
    .from('applications')
    .update({ resume_storage_path: objectPath })
    .eq('id', appRecord.id)
    .select('*')
    .single();

  if (updateResult.error) {
    fastify.log.error(updateResult.error);
    throw fastify.httpErrors.internalServerError('Unable to finalize application');
  }

  return toResponse(fastify, updateResult.data);
}

export async function listApplications(
  fastify: FastifyInstance
): Promise<ApplicationResponse[]> {
  const result = await fastify.supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (result.error) {
    fastify.log.error(result.error);
    throw fastify.httpErrors.internalServerError('Unable to load applications');
  }

  return Promise.all(result.data.map((row) => toResponse(fastify, row)));
}

export async function getApplicationById(
  fastify: FastifyInstance,
  id: string
): Promise<ApplicationResponse | null> {
  const result = await fastify.supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();

  if (result.error) {
    if (result.status === 406) {
      return null;
    }
    fastify.log.error(result.error);
    throw fastify.httpErrors.internalServerError('Unable to load application');
  }

  return toResponse(fastify, result.data);
}

export async function updateApplicationStatus(
  fastify: FastifyInstance,
  id: string,
  status: string
): Promise<ApplicationResponse | null> {
  const result = await fastify.supabase
    .from('applications')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (result.error) {
    if (result.status === 406) {
      return null;
    }
    fastify.log.error(result.error);
    throw fastify.httpErrors.internalServerError('Unable to update status');
  }

  return toResponse(fastify, result.data);
}

async function toResponse(fastify: FastifyInstance, row: ApplicationRow): Promise<ApplicationResponse> {
  const urlResult = await fastify.supabase.storage
    .from(CHECKLIST_BUCKET)
    .createSignedUrl(row.resume_storage_path, env.RESUME_SIGNED_URL_EXPIRES_IN);

  if (urlResult.error || !urlResult.data?.signedUrl) {
    throw fastify.httpErrors.internalServerError('Unable to generate resume URL');
  }

  return {
    ...row,
    resume_url: urlResult.data.signedUrl,
  };
}
