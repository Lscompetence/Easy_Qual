import fs from 'fs';

let content = fs.readFileSync('src/pages/client/ClientDashboard.jsx', 'utf-8');

if (!content.includes('Check,')) {
    content = content.replace("import { ChevronUp, ChevronDown, ChevronRight, AlertTriangle, Info,", "import { Check, Trash2, Upload, ChevronUp, ChevronDown, ChevronRight, AlertTriangle, Info,");
    fs.writeFileSync('src/pages/client/ClientDashboard.jsx', content, 'utf-8');
    console.log('Fixed Check, Trash2, Upload');
} else {
    console.log('Already imported');
}
