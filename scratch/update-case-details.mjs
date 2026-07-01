import fs from 'fs';

let content = fs.readFileSync('src/pages/consultant/CaseDetails.jsx', 'utf8');

const eventFunctions = `
    const handleSaveEvent = async (eventData) => {
        try {
            if (editingEvent) {
                const { error } = await supabase
                    .from('case_events')
                    .update({ ...eventData, updated_at: new Date().toISOString() })
                    .eq('id', editingEvent.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('case_events')
                    .insert({ ...eventData, case_id: id, status: 'pending' })
                if (error) throw error
            }
            setShowEventModal(false)
            setEditingEvent(null)
            fetchCaseData()
            showStatus('success', 'Succès', editingEvent ? 'Étape modifiée.' : 'Étape ajoutée.')
        } catch (error) {
            console.error(error)
            showStatus('error', 'Erreur', 'Erreur lors de l\\'enregistrement.')
        }
    }

    const handleDeleteEvent = async (eventId) => {
        showStatus('warning', 'Confirmation', 'Voulez-vous vraiment supprimer cette étape ?', async () => {
            try {
                const { error } = await supabase.from('case_events').delete().eq('id', eventId)
                if (error) throw error
                fetchCaseData()
                showStatus('success', 'Succès', 'Étape supprimée.')
            } catch (error) {
                console.error(error)
                showStatus('error', 'Erreur', 'Erreur lors de la suppression.')
            }
        }, 'Supprimer', 'Annuler')
    }

    const handleUpdateEventStatus = async (eventId, newStatus) => {
        try {
            const { error } = await supabase
                .from('case_events')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', eventId)
            if (error) throw error
            fetchCaseData()
        } catch (error) {
            console.error(error)
            showStatus('error', 'Erreur', 'Erreur lors de la mise à jour.')
        }
    }
`;

// Insert the functions before "return ("
content = content.replace('    if (!caseData)', eventFunctions + '\n    if (!caseData)');

const newPlanificationTab = `
                    {/* --- PLANIFICATION TAB --- */}
                    {activeTab === 'planification' && (
                        <div className="max-w-3xl mx-auto py-8 animate-fadeIn">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">Planification</h2>
                                    <p className="text-sm text-gray-500 mt-1">Gérez les étapes et jalons de ce dossier</p>
                                </div>
                                <button
                                    onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
                                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
                                >
                                    <Plus className="h-5 w-5" />
                                    Ajouter une étape
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                                {events && events.length > 0 ? (
                                    <div className="relative border-l-2 border-gray-100 ml-3 md:ml-6 space-y-10">
                                        {events.map((event) => {
                                            const isDone = event.status === 'done';
                                            
                                            let connectorColor = 'bg-gray-50 border-gray-200';
                                            let dotColor = 'bg-gray-300';
                                            
                                            if (event.event_type === 'meeting') {
                                                connectorColor = 'bg-blue-50 border-blue-200';
                                                dotColor = 'bg-blue-300';
                                            } else if (event.event_type === 'deadline') {
                                                connectorColor = 'bg-orange-50 border-orange-200';
                                                dotColor = 'bg-orange-300';
                                            } else if (event.event_type === 'audit') {
                                                connectorColor = 'bg-purple-50 border-purple-200';
                                                dotColor = 'bg-purple-300';
                                            }

                                            return (
                                                <div key={event.id} className="relative pl-8 sm:pl-10">
                                                    {/* Connector Dot */}
                                                    <div className={\`absolute -left-[9px] top-0 h-5 w-5 rounded-full border-2 flex items-center justify-center \${connectorColor} \${event.status === 'in_progress' ? 'animate-pulse' : ''}\`}>
                                                        {isDone ? (
                                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                                        ) : (
                                                            <span className={\`h-2 w-2 rounded-full \${dotColor}\`}></span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                                                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                                            {event.title}
                                                            <button
                                                                onClick={() => { setEditingEvent(event); setShowEventModal(true) }}
                                                                className="text-gray-300 hover:text-blue-600 transition-colors"
                                                            >
                                                                <Edit2 className="h-3 w-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteEvent(event.id)}
                                                                className="text-gray-300 hover:text-red-600 transition-colors"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            {!isDone && (
                                                                <button
                                                                    onClick={() => handleUpdateEventStatus(event.id, 'done')}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all shadow-sm text-xs font-bold"
                                                                >
                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                    Marquer fait
                                                                </button>
                                                            )}
                                                            {isDone && (
                                                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                    Bien réalisé
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500 mb-3">
                                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                                            {new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(event.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>

                                                    {event.description && (
                                                        <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                            {event.description}
                                                        </p>
                                                    )}

                                                    {event.visio_link && (
                                                        <div className="mt-3">
                                                            <a href={event.visio_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 font-bold hover:text-blue-700 hover:underline">
                                                                <Video className="h-4 w-4" />
                                                                Rejoindre la visioconférence
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                            <Calendar className="h-8 w-8 text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Aucune étape planifiée</h3>
                                        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">Commencez par ajouter le premier événement ou jalon de ce dossier pour structurer votre accompagnement.</p>
                                        <button
                                            onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
                                            className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all inline-flex items-center gap-2"
                                        >
                                            <Plus className="h-5 w-5" />
                                            Ajouter une étape
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {showEventModal && (
                        <EventModal
                            isOpen={showEventModal}
                            onClose={() => {
                                setShowEventModal(false)
                                setEditingEvent(null)
                            }}
                            onSave={handleSaveEvent}
                            eventToEdit={editingEvent}
                        />
                    )}
`;

const startIndex = content.indexOf("{/* VUE PLANIFICATION (Permanent Meeting Mockup) */}");
const endIndex = content.indexOf("</div >", startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    content = before + newPlanificationTab + '\n                ' + after;
    fs.writeFileSync('src/pages/consultant/CaseDetails.jsx', content, 'utf8');
    console.log("Updated CaseDetails.jsx");
} else {
    console.log("Could not find blocks to replace.");
}
