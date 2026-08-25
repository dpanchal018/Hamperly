const fs = require("fs");
let c = fs.readFileSync("src/lib/supabase/server.ts", "utf8");

c = c.replace(
  "export async function createClient() {",
  "export async function createClient(keepLoggedIn: boolean = true) {"
);

const originalSetAll = `        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )`;

const newSetAll = `        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const finalOptions = { ...options }
              if (!keepLoggedIn) {
                delete finalOptions.maxAge
                delete finalOptions.expires
              }
              cookieStore.set(name, value, finalOptions)
            })`;

c = c.replace(originalSetAll, newSetAll);
fs.writeFileSync("src/lib/supabase/server.ts", c, "utf8");
console.log("Patched server.ts");
