export const applicationCreateBodySchema = {
  type: 'object',
  required: [
    'full_name',
    'email',
    'phone',
    'age',
    'country',
    'city',
    'english_level',
  ],
  properties: {
    full_name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string', minLength: 1 },
    age: { type: 'integer', minimum: 16, maximum: 100 },
    country: { type: 'string', minLength: 1 },
    city: { type: 'string', minLength: 1 },
    english_level: {
      type: 'string',
      enum: [
        'Beginner (A1/A2)',
        'Intermediate (B1/B2)',
        'Advanced (C1)',
        'Native / Fluent (C2)',
      ],
    },
  },
} as const;

export const applicationRowSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    full_name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string' },
    age: { type: 'integer' },
    country: { type: 'string' },
    city: { type: 'string' },
    english_level: { type: 'string' },
    status: { type: 'string' },
    resume_url: { type: 'string', format: 'uri' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
  required: [
    'id',
    'full_name',
    'email',
    'phone',
    'age',
    'country',
    'city',
    'english_level',
    'status',
    'resume_url',
    'created_at',
    'updated_at',
  ],
} as const;

export const applicationListResponseSchema = {
  type: 'array',
  items: applicationRowSchema,
} as const;

export const applicationStatusUpdateSchema = {
  type: 'object',
  required: ['status'],
  properties: {
    status: {
      type: 'string',
      enum: ['In Review', 'Accepted', 'Rejected'],
    },
  },
} as const;
