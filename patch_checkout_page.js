const fs = require('fs');
let content = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');

content = content.replace(
  `  const user = await getCurrentUser();
  if (!user) redirect('/login?error=Login+to+Proceed');
  
  const role = await getCurrentUserRole();
  if (role !== 'CUSTOMER') {
    redirect('/login?error=Please+login+with+a+customer+account+to+checkout');
  }
  
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!customer) {
    redirect('/account/profile');
  }`,
  `  const user = await getCurrentUser();
  const role = user ? await getCurrentUserRole() : null;
  
  let customer = null;
  if (user && role === 'CUSTOMER') {
    const supabase = await createClient();
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .single();
    customer = data;
  }`
);

fs.writeFileSync('src/app/checkout/page.tsx', content, 'utf8');
console.log('Patched checkout page');
