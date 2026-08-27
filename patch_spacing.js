const fs = require('fs');
let content = fs.readFileSync('src/app/(customer)/page.tsx', 'utf8');

// Hero section
content = content.replace(/pt-24 pb-24 lg:pt-24 lg:pb-24/g, 'pt-12 pb-16 lg:pt-16 lg:pb-16');
content = content.replace(/mb-10/g, 'mb-6');
content = content.replace(/mb-8/g, 'mb-6');
content = content.replace(/mb-6/g, 'mb-4');

// All standard sections
content = content.replace(/py-24/g, 'py-12 md:py-16');

// Section headers
content = content.replace(/mb-16/g, 'mb-10');
content = content.replace(/mb-12/g, 'mb-8');
content = content.replace(/mt-12/g, 'mt-8');

// Grids
content = content.replace(/gap-12/g, 'gap-8');

fs.writeFileSync('src/app/(customer)/page.tsx', content, 'utf8');
console.log('Patched page.tsx spacing');
