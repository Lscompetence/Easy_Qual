import fs from 'fs';

const diff = fs.readFileSync('scratch/case-diff.txt', 'utf16le');
fs.writeFileSync('scratch/case-diff-utf8.txt', diff, 'utf8');
