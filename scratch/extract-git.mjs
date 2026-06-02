import fs from 'fs';

const lines = fs.readFileSync('scratch/git-log.txt', 'utf8').split('\n');
const start = Math.max(0, 3600);
const end = Math.min(lines.length, 3800);

console.log(lines.slice(start, end).join('\n'));
