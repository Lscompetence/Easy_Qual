import fs from 'fs';

let content = fs.readFileSync('src/pages/consultant/CaseDetails.jsx', 'utf8');

// Replace handleSaveEvent
content = content.replace(
    `.update({ ...eventData, updated_at: new Date().toISOString() })`,
    `.update({ ...eventData })`
);
content = content.replace(
    `showStatus('error', 'Erreur', 'Erreur lors de l\\'enregistrement.')`,
    `showStatus('error', 'Erreur', error?.message || 'Erreur lors de l\\'enregistrement.')`
);

// Replace handleDeleteEvent
content = content.replace(
    `showStatus('error', 'Erreur', 'Erreur lors de la suppression.')`,
    `showStatus('error', 'Erreur', error?.message || 'Erreur lors de la suppression.')`
);

// Replace handleUpdateEventStatus
content = content.replace(
    `.update({ status: newStatus, updated_at: new Date().toISOString() })`,
    `.update({ status: newStatus })`
);
content = content.replace(
    `showStatus('error', 'Erreur', 'Erreur lors de la mise à jour.')`,
    `showStatus('error', 'Erreur', error?.message || 'Erreur lors de la mise à jour.')`
);

fs.writeFileSync('src/pages/consultant/CaseDetails.jsx', content, 'utf8');
console.log("Updated CaseDetails.jsx events functions");
