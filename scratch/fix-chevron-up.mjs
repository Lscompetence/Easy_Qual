import fs from 'fs';

let content = fs.readFileSync('src/pages/client/ClientDashboard.jsx', 'utf-8');

if (!content.includes('ChevronUp,')) {
    content = content.replace("import { AlertTriangle, Info,", "import { ChevronUp, ChevronDown, ChevronRight, AlertTriangle, Info,");
    fs.writeFileSync('src/pages/client/ClientDashboard.jsx', content, 'utf-8');
    console.log('Fixed ChevronUp and ChevronDown');
} else {
    console.log('Already imported');
}
