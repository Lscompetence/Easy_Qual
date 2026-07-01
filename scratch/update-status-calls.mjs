import fs from 'fs';

// 1. Update ClientDashboard.jsx
const clientPath = 'C:\\\\Users\\\\d-nia\\\\Documents\\\\Application Web\\\\EasyQual\\\\src\\\\pages\\\\client\\\\ClientDashboard.jsx';
let clientContent = fs.readFileSync(clientPath, 'utf8');

clientContent = clientContent.replace(
    /isLoading=\{statusModal\.isLoading\}/g,
    'isLoading={statusModal.isLoading}\n                    criterionId={currentCriterion?.id}'
);

fs.writeFileSync(clientPath, clientContent, 'utf8');
console.log('ClientDashboard updated');

// 2. Update ResourceManager.jsx
const resPath = 'C:\\\\Users\\\\d-nia\\\\Documents\\\\Application Web\\\\EasyQual\\\\src\\\\components\\\\consultant\\\\ResourceManager.jsx';
let resContent = fs.readFileSync(resPath, 'utf8');

resContent = resContent.replace(
    /<StatusModal \{\.\.\.statusModal\} onClose=\{\(\) => setStatusModal\(prev => \(\{ \.\.\.prev, isOpen: false \}\)\)\} \/>/g,
    '<StatusModal {...statusModal} criterionId={activeCriterion?.id} onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))} />'
);

fs.writeFileSync(resPath, resContent, 'utf8');
console.log('ResourceManager updated');

