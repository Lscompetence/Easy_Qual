import fs from 'fs';

const log = fs.readFileSync('scratch/git-log.txt', 'utf8').split('\n');
const start = 4710;
const end = 4850;

console.log(log.slice(start, end).join('\n'));
