const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const originalStock = {
  "Blue Coffee Hamper": 6,
  "Bow Boys Hamper": 0,
  "Bow Girls Hamper": 6,
  "Dry Fruits Hamper": 6,
  "Glass Boys Hamper": 6,
  "Glass Straw Hamper": 7,
  "Golden Boys Hamper": 6,
  "Golden Girls Hamper": 5,
  "Kids PVC Bag White & Blue Tumbler": 7,
  "Pink Hamper": 6,
  "PVC Girls Bag Dark Fantasy": 10,
  "Snacks Hamper": 9,
  "White Box DIY Jar": 7,
  "White Box DIY Tumbler + Mug": 8,
  "White Box Evil Eye": 7,
  "White Box White Tumbler + Dark Chocolate": 10,
  "Yellow Green Girls Hamper": 0
};

async function wipe() {
  console.log('Starting Go-Live Data Wipe...');
  
  // 1. Delete all purchase items
  console.log('Clearing purchase_items...');
  const { error: piErr } = await supabase.from('purchase_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (piErr) console.error(piErr);

  // 2. Delete all payment logs
  console.log('Clearing payment_logs...');
  const { error: plErr } = await supabase.from('payment_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (plErr) console.error(plErr);

  // 3. Delete all purchases
  console.log('Clearing purchases...');
  const { error: pErr } = await supabase.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (pErr) console.error(pErr);

  // 4. Delete all bulk test customers from public.customers
  console.log('Clearing test customers...');
  const { error: cErr } = await supabase.from('customers').delete().like('email', '%@hamperly.test');
  if (cErr) console.error(cErr);

  // 5. Delete all bulk test users from auth.users
  console.log('Clearing test auth users...');
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUsers = users.filter(u => u.email && u.email.endsWith('@hamperly.test'));
  for (const tu of testUsers) {
    await supabase.auth.admin.deleteUser(tu.id);
  }
  console.log(`Deleted ${testUsers.length} test auth users.`);

  // 6. Restore Inventory
  console.log('Restoring hamper inventory...');
  for (const [name, stock] of Object.entries(originalStock)) {
    const { error: hErr } = await supabase.from('hampers').update({ stock_quantity: stock }).eq('name', name);
    if (hErr) console.error(`Error restoring ${name}:`, hErr);
  }
  
  console.log('Go-Live Data Wipe Complete!');
}

wipe().catch(console.error);
