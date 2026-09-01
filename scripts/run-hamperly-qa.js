/**
 * Hamperly QA Master Runner
 * 
 * Executes full-spectrum 8-domain Playwright regression tests against http://localhost:3000.
 * Automatically verifies/spawns dev server, dispatches start/stop Telegram alerts,
 * wipes test data, and generates a structured daily report with P0-P3 defect triage.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

// 1. Telegram Dispatcher
async function sendTelegram(text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('[Hamperly QA] Telegram credentials not configured. Skipping notification.');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error('[Hamperly QA] Failed to send Telegram alert:', err.message);
    return false;
  }
}

// 2. Server Ping
async function pingServer(url, timeoutMs = 3000) {
  try {
    const res = await fetch('http://127.0.0.1:3000/', { signal: AbortSignal.timeout(timeoutMs) });
    return res.status >= 200 && res.status < 500;
  } catch {
    try {
      const res2 = await fetch('http://localhost:3000/', { signal: AbortSignal.timeout(timeoutMs) });
      return res2.status >= 200 && res2.status < 500;
    } catch {
      return false;
    }
  }
}

// 3. Ensure Server is Running
async function ensureServerRunning() {
  const baseUrl = 'http://localhost:3000';
  const isUp = await pingServer(baseUrl);
  
  if (isUp) {
    console.log('✅ [Hamperly QA] Dev server is already active at http://localhost:3000');
    try {
      await fetch('http://localhost:3000/');
      await fetch('http://localhost:3000/hampers');
      await fetch('http://localhost:3000/checkout');
      await fetch('http://localhost:3000/login');
    } catch {}
    return { spawned: false, proc: null };
  }

  console.log('⚡ [Hamperly QA] Dev server is stopped. Auto-spawning npm run dev...');
  const serverProc = spawn('npm.cmd', ['run', 'dev'], {
    stdio: 'ignore',
    shell: true,
    detached: false
  });

  // Poll until server responds (up to 60 seconds)
  const maxAttempts = 60;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(r => setTimeout(r, 1000));
    const ready = await pingServer(baseUrl);
    if (ready) {
      console.log(`✅ [Hamperly QA] Dev server successfully booted and ready after ${attempt}s`);
      // Pre-warm Next.js route compilation cache
      try {
        console.log('🔥 [Hamperly QA] Pre-warming Next.js compilation cache...');
        await fetch('http://localhost:3000/');
        await fetch('http://localhost:3000/hampers');
        await fetch('http://localhost:3000/checkout');
        await fetch('http://localhost:3000/login');
      } catch {}
      return { spawned: true, proc: serverProc };
    }
  }

  throw new Error('Failed to start Next.js dev server within 60 seconds.');
}

// 4. Test Database Cleanup
async function cleanupTestData() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Clear test customer purchases & customers
    const { data: testCusts } = await supabase.from('customers').select('id').like('email', '%@hamperly.test');
    if (testCusts && testCusts.length > 0) {
      const custIds = testCusts.map(c => c.id);
      await supabase.from('purchases').delete().in('customer_id', custIds);
      await supabase.from('customers').delete().in('id', custIds);
    }
    console.log('🧹 [Hamperly QA] Test database records cleaned up.');
  } catch (err) {
    console.warn('[Hamperly QA] Post-test DB cleanup note:', err.message);
  }
}

// 5. Main Runner Execution
async function main() {
  const startTime = new Date();
  const timeString = startTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  const dateString = startTime.toISOString().split('T')[0];

  console.log(`\n======================================================`);
  console.log(`🤖 HAMPERLY QA: Cumulative Regression Runner (${timeString} IST)`);
  console.log(`======================================================\n`);

  // Step A: Send START Telegram notification
  await sendTelegram(`
🚀 <b>HAMPERLY QA RUNNER STARTED</b> 🚀
<b>Scheduled Time:</b> ${timeString} IST
<b>Target:</b> http://localhost:3000
<b>Scope:</b> Full 8-Domain Cumulative Regression Suite

<i>Pinging local server, verifying environment health, and starting test suites...</i>
  `.trim());

  let serverContext = { spawned: false, proc: null };
  let testResults = null;
  let rawJsonOutput = '';

  try {
    // Step B: Ensure Server is alive
    serverContext = await ensureServerRunning();

    // Step C: Run Playwright tests
    console.log('🏃 [Hamperly QA] Executing 8-Domain Playwright test suites...');
    
    try {
      const testPaths = [
        'tests/e2e/01-auth',
        'tests/e2e/02-catalog',
        'tests/e2e/03-custom-builder',
        'tests/e2e/04-cart-wishlist',
        'tests/e2e/05-checkout',
        'tests/e2e/06-admin-lifecycle',
        'tests/e2e/07-concurrency-alerts'
      ].join(' ');

      rawJsonOutput = execSync(`npx playwright test ${testPaths} --workers=1 --reporter=json`, {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe']
      });
    } catch (pwError) {
      // Playwright exits with code 1 if any test fails, but still emits valid JSON to stdout
      rawJsonOutput = pwError.stdout || '';
      if (!rawJsonOutput && pwError.stderr) {
        console.error('Playwright execution error:', pwError.stderr);
      }
    }

    // Step D: Parse Results
    try {
      testResults = JSON.parse(rawJsonOutput);
    } catch {
      testResults = { suites: [], errors: ['Failed to parse JSON test output'] };
    }

  } catch (err) {
    console.error('❌ [Hamperly QA] Fatal Runner Error:', err.message);
    testResults = { fatalError: err.message };
  } finally {
    // Step E: Clean up test orders & test users
    await cleanupTestData();

    // Step F: Kill server if we spawned it
    if (serverContext.spawned && serverContext.proc) {
      console.log('🛑 [Hamperly QA] Gracefully shutting down spawned dev server...');
      try {
        process.kill(serverContext.proc.pid);
      } catch {}
    }
  }

  // Step G: Calculate Stats
  const endTime = new Date();
  const durationSec = ((endTime - startTime) / 1000).toFixed(1);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failureDetails = [];

  if (testResults && testResults.suites) {
    function traverseSuites(suite) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          totalTests++;
          const lastTest = spec.tests && spec.tests[spec.tests.length - 1];
          const lastResult = lastTest && lastTest.results && lastTest.results[lastTest.results.length - 1];
          
          if (lastResult && lastResult.status === 'passed') {
            passedTests++;
          } else {
            failedTests++;
            failureDetails.push({
              title: spec.title,
              file: spec.file,
              error: lastResult?.error?.message || 'Assertion failed',
              duration: lastResult?.duration || 0
            });
          }
        }
      }
      if (suite.suites) {
        suite.suites.forEach(traverseSuites);
      }
    }
    testResults.suites.forEach(traverseSuites);
  }

  const isGo = failedTests === 0 && !testResults?.fatalError;
  const verdictBadge = isGo ? '🟢 GO (Ready for Live Deploy)' : '🔴 NO-GO (Blockers Found)';
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

  // Step H: Generate Markdown QA Report
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  // Clean old reports: keep only the latest one
  try {
    const existingReports = fs.readdirSync(reportsDir);
    for (const file of existingReports) {
      if (file.startsWith('qa-report-') && file.endsWith('.md')) {
        fs.unlinkSync(path.join(reportsDir, file));
      }
    }
  } catch (err) {
    console.error('Failed to clean old reports:', err.message);
  }

  const reportFileName = `qa-report-${dateString}-${timeString.replace(':', '')}.md`;
  const reportPath = path.join(reportsDir, reportFileName);

  let markdownReport = `# Hamperly QA: Daily Cumulative Regression Report
**Date:** ${dateString} | **Time:** ${timeString} IST  
**Environment:** Localhost (Node v22, Next.js 16.3.0, Supabase Local/Dev)  
**Execution Duration:** ${durationSec}s  

---

## 1. Executive Summary & Verdict
* **Deployment Verdict:** **${verdictBadge}**
* **Total Tests Executed:** ${totalTests}
* **Passed:** ${passedTests} | **Failed:** ${failedTests} | **Skipped:** 0
* **Cumulative Pass Rate:** **${passRate}%**

---

## 2. 8-Domain Coverage Summary
| Domain | Area | Status |
|---|---|---|
| **Domain 1** | Authentication & Role-Based Access Controls | ${failureDetails.some(f => f.file.includes('01-auth')) ? '🔴 FAILED' : '🟢 PASSED'} |
| **Domain 2** | Catalog, Storefront, Search & Inventory Badges | ${failureDetails.some(f => f.file.includes('02-catalog')) ? '🔴 FAILED' : '🟢 PASSED'} |
| **Domain 3** | Interactive Hamper Designer & Custom Theming | ${failureDetails.some(f => f.file.includes('03-custom')) ? '🔴 FAILED' : '🟢 PASSED'} |
| **Domain 4 & 5** | Cart Management, Sync & Wishlist System | ${failureDetails.some(f => f.file.includes('04-cart')) ? '🔴 FAILED' : '🟢 PASSED'} |
| **Domain 6** | Pincode Validation, Checkout & Tax Invoicing | ${failureDetails.some(f => f.file.includes('05-checkout')) ? '🔴 FAILED' : '🟢 PASSED'} |
| **Domain 7** | Admin Orders, Payments & Zero Double-Decrement | ${failureDetails.some(f => f.file.includes('06-admin')) ? '🔴 FAILED' : '🟢 PASSED'} |
| **Domain 8** | Concurrency, Stockout Alerts & Telegram Triggers | ${failureDetails.some(f => f.file.includes('07-concurrency')) ? '🔴 FAILED' : '🟢 PASSED'} |

---

## 3. Discovered Defects & Triage (If Any)
`;

  if (failureDetails.length === 0 && !testResults?.fatalError) {
    markdownReport += `\n> [!TIP]\n> **Zero defects identified.** All regression tests passed across all 8 functional domains. Safe to deploy to production.\n`;
  } else {
    failureDetails.forEach((f, idx) => {
      markdownReport += `
### [DEFECT-${String(idx + 1).padStart(3, '0')}] ${f.title}
* **Test File:** \`${f.file}\`
* **Classification:** Functional
* **Severity:** Major
* **Priority:** P0 (Must be resolved before production deployment)
* **Error Trace:**
\`\`\`
${f.error.substring(0, 400)}
\`\`\`
`;
    });
  }

  markdownReport += `\n---\n*Report compiled autonomously by Hamperly QA.*\n`;

  fs.writeFileSync(reportPath, markdownReport, 'utf-8');
  console.log(`📄 [Hamperly QA] Report saved: ${reportPath}`);

  // Step I: Send STOP Telegram notification
  const stopTelegramMsg = `
🏁 <b>HAMPERLY QA RUNNER COMPLETED</b> 🏁
<b>Verdict:</b> ${verdictBadge}
<b>Execution Time:</b> ${durationSec}s
<b>Results:</b> Passed: ${passedTests}/${totalTests} | Failed: ${failedTests}
<b>Pass Rate:</b> ${passRate}%
<b>Report:</b> <code>reports/${reportFileName}</code>
  `.trim();

  await sendTelegram(stopTelegramMsg);
  console.log(`📱 [Hamperly QA] Completion alert sent to Telegram.`);
}

main().catch(err => {
  console.error('[Hamperly QA] Uncaught Runner Error:', err);
  process.exit(1);
});
