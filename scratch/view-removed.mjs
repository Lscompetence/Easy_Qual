import fs from 'fs';

let content = '';
try {
    content = fs.readFileSync('scratch/removed.txt', 'utf16le');
    if (!content.includes('EVENT MODAL REMOVED')) {
        content = fs.readFileSync('scratch/removed.txt', 'utf8');
    }
} catch (e) {
    content = fs.readFileSync('scratch/removed.txt', 'utf8');
}

fs.writeFileSync('scratch/removed-utf8.txt', content, 'utf8');
console.log("Converted.");
