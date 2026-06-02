import fs from 'fs';

let content = fs.readFileSync('src/pages/client/ClientDashboard.jsx', 'utf-8');

if (!content.includes('AlertTriangle,')) {
    content = content.replace("import { Info,", "import { AlertTriangle, Info,");
    fs.writeFileSync('src/pages/client/ClientDashboard.jsx', content, 'utf-8');
    console.log('Fixed AlertTriangle');
} else {
    console.log('AlertTriangle already imported');
}
