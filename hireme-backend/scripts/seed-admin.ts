import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function seed() {
  const hash = await bcrypt.hash(env.DEFAULT_ADMIN_PASSWORD, 10);
  const { error } = await supabase.from('recruiting_users').upsert(
    [
      { email: 'admin1@hireme-app.com', password_hash: hash },
      { email: 'admin2@hireme-app.com', password_hash: hash },
    ],
    { onConflict: 'email' }
  );

  if (error) {
    console.error('Admin seed failed', error);
    process.exit(1);
  }

  console.log('Admin users seeded');
}

seed();
