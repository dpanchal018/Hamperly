const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const darshanAuth = users.users.find(u => u.email === "darshan018@hamperly.com");
  console.log("Auth User ID:", darshanAuth?.id);

  const { data: customers } = await supabase.from("customers").select("*").eq("email", "darshan018@hamperly.com");
  console.log("Customer Records for Darshan:", customers);

  const { data: purchases, error } = await supabase.from("purchases").select("*");
  console.log("All Purchases Count:", purchases ? purchases.length : 0);
  
  if (purchases && purchases.length > 0) {
    console.log("Sample Purchase Customer IDs:");
    purchases.slice(0, 5).forEach(p => console.log(p.customer_id));
  }
}
run();
