import fs from 'fs';

let content = fs.readFileSync('src/pages/consultant/CaseDetails.jsx', 'utf8');

const generatePlanFunction = `
    const handleGenerateDefaultPlan = async () => {
        try {
            showStatus('info', 'Génération en cours', 'Création du plan type...');
            
            const defaultEvents = [
                {
                    case_id: id,
                    title: "Réunion de Lancement",
                    description: "Définition des objectifs et planning prévisionnel.",
                    event_type: "meeting",
                    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'done'
                },
                {
                    case_id: id,
                    title: "Mentorat : Suivi Mi-Parcours",
                    description: "Revue des indicateurs bloquants (C2, C3).",
                    event_type: "meeting",
                    event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'pending',
                    visio_link: \`https://meet.jit.si/EasyQual-Visio-\${id}\`
                },
                {
                    case_id: id,
                    title: "Audit Blanc",
                    description: "Simulation complète de l'audit de surveillance. En attente de validation des indicateurs.",
                    event_type: "audit",
                    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'pending'
                },
                {
                    case_id: id,
                    title: "Audit de Surveillance",
                    description: "Date prévisionnelle.",
                    event_type: "deadline",
                    event_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'pending'
                }
            ];

            const { error } = await supabase.from('case_events').insert(defaultEvents);
            if (error) throw error;
            
            fetchCaseData(); // Refresh to load the new events
            setTimeout(() => {
                showStatus('success', 'Succès', 'Le plan type a été généré avec succès !');
            }, 500);
            
        } catch (error) {
            console.error("Error generating plan:", error);
            showStatus('error', 'Erreur', 'Impossible de générer le plan.');
        }
    }
`;

// Insert the function near handleDeleteEvent
content = content.replace("const handleUpdateEventStatus = async", generatePlanFunction + "\n    const handleUpdateEventStatus = async");

// Now update the empty state to add a button to trigger this
const oldBanner = `<div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mb-6">
                                            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-bold text-blue-900">Exemple de Planification</h4>
                                                <p className="text-xs text-blue-700 mt-1">Vous n'avez pas encore planifié d'étapes pour ce dossier. Voici un exemple de plan type. Cliquez sur "Ajouter une étape" pour commencer.</p>
                                            </div>
                                        </div>`;

const newBanner = `<div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                                            <div className="flex items-start gap-3">
                                                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-blue-900">Modèle de Planification</h4>
                                                    <p className="text-xs text-blue-700 mt-1 max-w-lg">Voici un aperçu d'un plan type. Vous pouvez créer votre propre plan à partir de zéro, ou générer directement ce modèle et le modifier par la suite.</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleGenerateDefaultPlan}
                                                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all flex-shrink-0"
                                            >
                                                Générer ce plan type
                                            </button>
                                        </div>`;

content = content.replace(oldBanner, newBanner);

fs.writeFileSync('src/pages/consultant/CaseDetails.jsx', content, 'utf8');
console.log("Updated CaseDetails.jsx with generator");
