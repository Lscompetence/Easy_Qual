import fs from 'fs';

const log = fs.readFileSync('scratch/git-log.txt', 'utf8');

// Find the commit where 'activeTab === \'planification\'' changed.
const chunks = log.split(/^commit /m);
for (const chunk of chunks) {
    if (chunk.includes("activeTab === 'planification'") && chunk.includes("Salle de Réunion Permanente")) {
        console.log("Found the commit!");
        fs.writeFileSync('scratch/old-planification.txt', chunk);
        break;
    }
}
console.log("Done");
