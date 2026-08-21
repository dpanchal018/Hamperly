const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(walkDir(fullPath));
        } else if (entry.name === 'page.tsx') {
            files.push(fullPath);
        }
    }
    return files;
}

const adminDir = path.join(process.cwd(), 'src', 'app', 'admin');
const files = walkDir(adminDir);

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("import { supabase } from '@/lib/supabase';")) {
        content = content.replace("import { supabase } from '@/lib/supabase';", "import { createClient } from '@/lib/supabase/server';");
        content = content.replace(/(await requireAdmin\(\);)/, "$1\n  const supabase = await createClient();");
        fs.writeFileSync(file, content);
        console.log("Updated", file);
    }
}
