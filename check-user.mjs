import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data } = await supabase.auth.admin.listUsers();
  const user = data.users.find(u => u.email === 'darshanp1819@gmail.com');
  console.log(user ? user.user_metadata : 'User not found');
}
check();
