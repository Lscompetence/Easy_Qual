import fs from 'fs';

let content = fs.readFileSync('src/pages/consultant/CaseDetails.jsx', 'utf8');

content = content.replace(/fetchCaseData\(\)/g, 'fetchCaseDetails()');

fs.writeFileSync('src/pages/consultant/CaseDetails.jsx', content, 'utf8');
console.log("Replaced fetchCaseData with fetchCaseDetails");
