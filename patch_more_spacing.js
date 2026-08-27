const fs = require('fs');

const files = [
  'src/app/(customer)/personalize/page.tsx',
  'src/app/(customer)/review/page.tsx',
  'src/app/checkout/page.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/pt-32 pb-24/g, 'pt-24 pb-16');
    content = content.replace(/mb-20/g, 'mb-10');
    content = content.replace(/pb-16/g, 'pb-8');
    content = content.replace(/gap-16/g, 'gap-8');
    content = content.replace(/py-32/g, 'py-16');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Patched spacing in ${file}`);
  }
});
