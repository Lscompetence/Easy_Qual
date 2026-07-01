import fs from 'fs';

let content = fs.readFileSync('src/pages/consultant/CaseDetails.jsx', 'utf8');

const mockupCode = `
                                    <div className="space-y-8">
                                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mb-6">
                                            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-bold text-blue-900">Exemple de Planification</h4>
                                                <p className="text-xs text-blue-700 mt-1">Vous n'avez pas encore planifié d'étapes pour ce dossier. Voici un exemple de plan type. Cliquez sur "Ajouter une étape" pour commencer.</p>
                                            </div>
                                        </div>
                                        <div className="relative border-l-2 border-gray-100 ml-3 md:ml-6 space-y-10 opacity-70 pointer-events-none">
                                            {/* Step 1: Kick-off (Done) */}
                                            <div className="relative pl-10">
                                                <div className="absolute -left-[9px] top-0 h-5 w-5 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                                </div>
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                                    <h3 className="text-base font-bold text-gray-900">Réunion de Lancement</h3>
                                                    <span className="text-xs font-bold px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 mt-2 sm:mt-0">
                                                        Bien réalisé
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-2">Définition des objectifs et planning prévisionnel.</p>
                                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                                                    <Calendar className="h-3 w-3" /> 10 Janv. 2026
                                                </div>
                                            </div>

                                            {/* Step 2: Suivi (In progress) */}
                                            <div className="relative pl-10">
                                                <div className="absolute -left-[9px] top-0 h-5 w-5 rounded-full border-2 bg-blue-50 border-blue-200 flex items-center justify-center">
                                                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                                    <h3 className="text-base font-bold text-gray-900">Mentorat : Suivi Mi-Parcours</h3>
                                                    <button className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded shadow-sm mt-2 sm:mt-0">
                                                        Lancer Visio
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-2">Revue des indicateurs bloquants (C2, C3).</p>
                                                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded border border-blue-100">
                                                    <Calendar className="h-3 w-3" /> 16 Fév. 2026 – 14:00
                                                </div>
                                            </div>

                                            {/* Step 3: Audit Blanc (Future) */}
                                            <div className="relative pl-10">
                                                <div className="absolute -left-[9px] top-0 h-5 w-5 rounded-full bg-purple-50 border-2 border-purple-200 flex items-center justify-center">
                                                    <span className="h-2 w-2 rounded-full bg-purple-300"></span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                                    <h3 className="text-base font-bold text-gray-900">Audit Blanc</h3>
                                                    <button className="text-xs font-bold text-purple-600 border border-purple-200 bg-white px-3 py-1.5 rounded mt-2 sm:mt-0">
                                                        Planifier
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-2">Simulation complète de l'audit de surveillance.</p>
                                                <div className="flex items-center gap-1.5 text-xs text-purple-500 font-medium">
                                                    <Info className="h-3 w-3" /> En attente de validation des indicateurs
                                                </div>
                                            </div>

                                            {/* Step 4: Audit de Surveillance (Final) */}
                                            <div className="relative pl-10">
                                                <div className="absolute -left-[9px] top-0 h-5 w-5 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center">
                                                    <span className="h-2 w-2 rounded-full bg-gray-300"></span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                                    <h3 className="text-base font-bold text-gray-900">Audit de Surveillance</h3>
                                                </div>
                                                <p className="text-sm text-gray-500">Date prévisionnelle : Mars 2026</p>
                                            </div>
                                        </div>
                                    </div>
`;

// Replace the empty state text center div with the mockupCode
const targetStart = content.indexOf('<div className="text-center py-16">');
const targetEnd = content.indexOf(')}', targetStart);

if (targetStart !== -1 && targetEnd !== -1) {
    const before = content.substring(0, targetStart);
    const after = content.substring(targetEnd);
    content = before + mockupCode + '\n                                ' + after;
    fs.writeFileSync('src/pages/consultant/CaseDetails.jsx', content, 'utf8');
    console.log("Updated CaseDetails.jsx");
} else {
    console.log("Target not found");
}
