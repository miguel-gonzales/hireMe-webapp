export const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
  },
} as const;

export const loginResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
  },
} as const;
