import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const user = usersData.users.find(u => u.email === 'darshanp1819@gmail.com');
  if(user) {
     const { error } = await supabase.auth.admin.updateUserById(user.id, {
         user_metadata: { ...user.user_metadata, full_name: 'Darshan P' }
     });
     console.log('Update Error:', error);
  }
}
test();
