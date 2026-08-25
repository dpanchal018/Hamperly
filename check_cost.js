const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await supabase.from("purchase_items").select("*");
  console.log("Purchase items count:", data?.length);
  if (data?.length > 0) {
    console.log("Sample:", data[0]);
  }
}
run();
