const fs = require("fs");
let c = fs.readFileSync("src/actions/analytics.actions.ts", "utf8");

const oldHelpers = `function getStartOfDay() {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.toISOString();
}
function getStartOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0,0,0,0);
  return d.toISOString();
}
function getStartOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0,0,0,0);
  return d.toISOString();
}
function getStartOfYear() {
  const d = new Date();
  d.setMonth(0, 1);
  d.setHours(0,0,0,0);
  return d.toISOString();
}`;

const newHelpers = `// Timezone-safe helpers for IST (UTC+5:30)
function getISTNow() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset);
}

function toUTCSnapshot(istTime: Date) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(istTime.getTime() - istOffset).toISOString();
}

function getStartOfDay() {
  const d = getISTNow();
  d.setUTCHours(0,0,0,0);
  return toUTCSnapshot(d);
}

function getStartOfWeek() {
  const d = getISTNow();
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0,0,0,0);
  return toUTCSnapshot(d);
}

function getStartOfMonth() {
  const d = getISTNow();
  d.setUTCDate(1);
  d.setUTCHours(0,0,0,0);
  return toUTCSnapshot(d);
}

function getStartOfYear() {
  const d = getISTNow();
  d.setUTCMonth(0, 1);
  d.setUTCHours(0,0,0,0);
  return toUTCSnapshot(d);
}`;

c = c.replace(oldHelpers, newHelpers);

fs.writeFileSync("src/actions/analytics.actions.ts", c, "utf8");
console.log("Patched timezone helpers");
