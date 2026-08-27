const fs = require('fs');

const files = [
  'src/app/(customer)/products/page.tsx',
  'src/app/(customer)/hampers/page.tsx',
  'src/app/(customer)/build/page.tsx', // might not exist but let's try
  'src/app/(customer)/occasions/page.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/pt-32 pb-24/g, 'pt-24 pb-16');
    content = content.replace(/mb-20/g, 'mb-10');
    content = content.replace(/pb-16/g, 'pb-8');
    content = content.replace(/gap-16/g, 'gap-8');
    content = content.replace(/mb-6/g, 'mb-4');
    content = content.replace(/mb-8 pb-4/g, 'mb-6 pb-2');
    content = content.replace(/py-32/g, 'py-16');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Patched spacing in ${file}`);
  }
});
