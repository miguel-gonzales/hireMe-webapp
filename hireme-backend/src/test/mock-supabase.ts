import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export function createMockSupabase() {
  const passwordHash = bcrypt.hashSync('password123', 10);
  const users = [
    {
      id: 'admin-user-1',
      email: 'admin@recruitment.test',
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const applications: Array<Record<string, unknown>> = [];
  const storage = new Map<string, { file: Buffer; contentType: string }>();

  function createApplicationsQuery() {
    const filter: Record<string, unknown> = {};

    const query: any = {
      select(fields: string) {
        return this;
      },
      order(_field: string, _opts: Record<string, unknown>) {
        const result = [...applications].sort((a, b) => {
          const left = String(a.created_at);
          const right = String(b.created_at);
          return right.localeCompare(left);
        });
        return Promise.resolve({ data: result, error: null });
      },
      eq(field: string, value: unknown) {
        filter[field] = value;
        return this;
      },
      insert(rows: Array<Record<string, unknown>>) {
        const first = rows[0];
        const now = new Date().toISOString();
        const record = {
          ...first,
          id: crypto.randomUUID(),
          status: 'In Review',
          resume_storage_path: '',
          created_at: now,
          updated_at: now,
        };
        applications.push(record);
        return {
          select: () => ({
            single: async () => ({ data: record, error: null }),
          }),
        };
      },
      update(values: Record<string, unknown>) {
        return {
          eq(field: string, value: unknown) {
            filter[field] = value;
            return {
              select: () => ({
                single: async () => {
                  const record = applications.find((item) => item.id === filter.id);
                  if (!record) {
                    return { data: null, error: { status: 406, message: 'No rows' } };
                  }
                  Object.assign(record, values, { updated_at: new Date().toISOString() });
                  return { data: record, error: null };
                },
              }),
            };
          },
        };
      },
      single: async () => {
        if (filter.id) {
          const record = applications.find((item) => item.id === filter.id);
          if (!record) {
            return { data: null, error: { status: 406, message: 'No rows' } };
          }
          return { data: record, error: null };
        }
        return { data: null, error: { status: 406, message: 'No rows' } };
      },
    };

    return query;
  }

  function createRecruitingUsersQuery() {
    const filter: Record<string, unknown> = {};

    return {
      select(_fields: string) {
        return this;
      },
      eq(field: string, value: unknown) {
        filter[field] = value;
        return this;
      },
      limit() {
        return this;
      },
      maybeSingle: async () => {
        const email = String(filter.email ?? '');
        const user = users.find((record) => record.email === email) ?? null;
        return { data: user, error: null };
      },
    };
  }

  function createStorageBucket() {
    return {
      upload: async (path: string, file: Buffer, opts: { contentType: string }) => {
        storage.set(path, { file, contentType: opts.contentType });
        return { data: null, error: null };
      },
      createSignedUrl: async (path: string, expiresIn: number) => {
        if (!storage.has(path)) {
          return { data: null, error: { status: 404, message: 'Not found' } };
        }
        return {
          data: { signedUrl: `https://mocked.storage/${path}?expires_in=${expiresIn}` },
          error: null,
        };
      },
    };
  }

  return {
    from(table: string) {
      if (table === 'recruiting_users') {
        return createRecruitingUsersQuery();
      }
      if (table === 'applications') {
        return createApplicationsQuery();
      }
      return {
        select: async () => ({ data: null, error: null }),
      };
    },
    storage: {
      from: (_bucket: string) => createStorageBucket(),
    },
  };
}
