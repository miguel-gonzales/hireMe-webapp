import { FastifyReply, FastifyRequest } from 'fastify';
import * as fastifyMultipart from '@fastify/multipart';
import {
  createApplication,
  getApplicationById,
  listApplications,
  updateApplicationStatus,
} from './applications.service.js';

export async function createApplicationHandler(request: FastifyRequest, reply: FastifyReply) {
  const parts = request.parts();
  const fields: Record<string, string> = {};
  let resumePart: fastifyMultipart.MultipartFile | undefined;

  for await (const part of parts) {
    if (part.type === 'file') {
      resumePart = part;
      continue;
    }

    fields[part.fieldname] = part.value as string;
  }

  if (!resumePart) {
    reply.badRequest('A PDF resume is required');
    return;
  }

  if (resumePart.mimetype !== 'application/pdf') {
    reply.badRequest('Invalid file format: PDF only');
    return;
  }

  const chunk = await resumePart.toBuffer();

  const englishLevels = [
    'Beginner (A1/A2)',
    'Intermediate (B1/B2)',
    'Advanced (C1)',
    'Native / Fluent (C2)',
  ] as const;

  if (!englishLevels.includes(fields.english_level as any)) {
    reply.badRequest('Invalid English level');
    return;
  }

  const payload = {
    full_name: fields.full_name,
    email: fields.email,
    phone: fields.phone,
    age: Number(fields.age),
    country: fields.country,
    city: fields.city,
    english_level: fields.english_level as typeof englishLevels[number],
  };

  if (
    !payload.full_name ||
    !payload.email ||
    !payload.phone ||
    Number.isNaN(payload.age) ||
    !payload.country ||
    !payload.city ||
    !payload.english_level
  ) {
    reply.badRequest('Missing required application fields');
    return;
  }

  const response = await createApplication(request.server, payload, chunk, resumePart.mimetype);
  reply.code(201).send(response);
}

export async function listApplicationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const applications = await listApplications(request.server);
  reply.send(applications);
}

export async function getApplicationHandler(request: FastifyRequest, reply: FastifyReply) {
  const id = (request.params as { id: string }).id;
  const application = await getApplicationById(request.server, id);
  if (!application) {
    reply.notFound('Application not found');
    return;
  }
  reply.send(application);
}

export async function updateApplicationStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const id = (request.params as { id: string }).id;
  const status = (request.body as { status: string }).status;
  const application = await updateApplicationStatus(request.server, id, status);
  if (!application) {
    reply.notFound('Application not found');
    return;
  }
  reply.send(application);
}
