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
         password: 'TestPassword123!'
     });
     console.log('Update Password Error:', error);
     
     // Test login
     const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
     const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
         email: 'darshanp1819@gmail.com',
         password: 'TestPassword123!'
     });
     console.log('Login Error:', loginError);
     console.log('Login Success:', !!loginData.user);
  }
}
test();
