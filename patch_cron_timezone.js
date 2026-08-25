const fs = require("fs");
let c = fs.readFileSync("src/app/api/cron/daily-summary/route.ts", "utf8");

const target = `    // Calculate Today's Date boundaries (UTC or server time)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();`;

const replacement = `    // Calculate Today's Date boundaries strictly for IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    
    const istStart = new Date(istNow);
    istStart.setUTCHours(0, 0, 0, 0);
    
    const istEnd = new Date(istNow);
    istEnd.setUTCHours(23, 59, 59, 999);
    
    const startISO = new Date(istStart.getTime() - istOffset).toISOString();
    const endISO = new Date(istEnd.getTime() - istOffset).toISOString();`;

c = c.replace(target, replacement);

// Also fix the telegram message to say it's using IST
c = c.replace(
  "const dateStr = startOfDay.toLocaleDateString",
  "const dateStr = istNow.toLocaleDateString"
);

fs.writeFileSync("src/app/api/cron/daily-summary/route.ts", c, "utf8");
console.log("Patched cron timezone");
