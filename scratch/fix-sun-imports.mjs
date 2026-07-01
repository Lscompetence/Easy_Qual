import fs from 'fs';

let content = fs.readFileSync('src/pages/client/ClientDashboard.jsx', 'utf-8');

if (!content.includes('Sun,')) {
    content = content.replace("import { Check, Trash2, Upload, ChevronUp, ChevronDown, ChevronRight, AlertTriangle, Info,", "import { Sun, Flag, Ban, Check, Trash2, Upload, ChevronUp, ChevronDown, ChevronRight, AlertTriangle, Info,");
    fs.writeFileSync('src/pages/client/ClientDashboard.jsx', content, 'utf-8');
    console.log('Fixed Sun, Flag, Ban');
} else {
    console.log('Already imported');
}
