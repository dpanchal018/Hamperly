const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Hamperly Validation Pipeline...\n');

try {
  console.log('⏳ STEP 1: Running Local QA Validations...');
  // Check if server is running, if not, this will fail or we could start it.
  // Assuming the user runs this while dev server is up.
  execSync('npm run hamperly-qa', { stdio: 'inherit' });
  console.log('✅ Local QA Passed!\n');

  console.log('🕸️ STEP 2: Triggering Live Site Bug Crawler...');
  execSync('npm run test:live', { stdio: 'inherit' });
  console.log('✅ Live Site Validation Passed!\n');
  
  console.log('🎉 PIPELINE COMPLETE! Reports are available in /validation-reports/live-site/html');
} catch (error) {
  console.error('\n❌ PIPELINE FAILED!');
  console.error('Check the logs above for details. Execution stopped.');
  process.exit(1);
}
