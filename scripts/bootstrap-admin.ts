import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function bootstrapAdmin() {
  console.log('Bootstrapping Admin User...');
  const email = 'admin@hamperly.local';
  const password = 'AdminPassword123!';

  // 1. Create or get user
  let userId;
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  
  const existingAdmin = existingUsers?.users?.find(u => u.email === email);
  if (existingAdmin) {
    console.log(`Admin user already exists with ID: ${existingAdmin.id}`);
    userId = existingAdmin.id;
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError) {
      console.error('Failed to create admin user:', createError);
      process.exit(1);
    }
    console.log(`Created new admin user with ID: ${newUser.user.id}`);
    userId = newUser.user.id;
  }

  // 2. Assign ADMIN role
  console.log('Assigning ADMIN role...');
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: 'ADMIN' });

  if (roleError) {
    console.error('Failed to assign ADMIN role:', roleError);
    process.exit(1);
  }

  console.log('Bootstrap complete! You can now log in with:');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

bootstrapAdmin();
