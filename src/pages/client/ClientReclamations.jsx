import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { Plus, History, Trash2, Sparkles, XCircle, AlertCircle } from 'lucide-react'
import ClientSidebar from '../../components/client/ClientSidebar'
import ClientTopBar from '../../components/client/ClientTopBar'
import ReclamationForm from '../../components/shared/ReclamationForm'

export default function ClientReclamations() {
    const { user } = useAuth()
    const [reclamations, setReclamations] = useState([])
    const [loading, setLoading] = useState(true)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [activeTab, setActiveTab] = useState('new') // 'new' | 'history'
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [ticketToDelete, setTicketToDelete] = useState(null)

    useEffect(() => {
        if (user && activeTab === 'history') {
            fetchReclamations()
        }
    }, [user, activeTab])

    const fetchReclamations = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('reclamations')
                .select('*, profiles(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setReclamations(data || [])
        } catch (error) {
            console.error('Error fetching reclamations:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteTicket = (id) => {
        setTicketToDelete(id);
    }

    const confirmDelete = async () => {
        if (!ticketToDelete) return;
        try {
            const { error } = await supabase.from('reclamations').delete().eq('id', ticketToDelete);
            if (error) throw error;
            setReclamations(reclamations.filter(t => t.id !== ticketToDelete));
            setTicketToDelete(null);
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression.");
        }
    }



    return (
        <div className="bg-slate-50 min-h-screen font-sans flex text-slate-800">
            <ClientSidebar isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
            
            <div className="flex-1 flex flex-col min-w-0">
                <ClientTopBar 
                    breadcrumbs={[{ label: 'Mes Réclamations' }]}
                    setShowMobileMenu={setShowMobileMenu}
                />
                
                <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
                    {/* Tabs Navigation */}
                    <div className="flex border-b border-gray-200 mb-8">
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`flex items-center gap-2 py-4 px-6 border-b-2 font-bold transition-colors ${
                                activeTab === 'new' 
                                ? 'border-[#cc6d3e] text-[#cc6d3e]' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Plus className="h-5 w-5" />
                            Nouvelle réclamation
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 py-4 px-6 border-b-2 font-bold transition-colors ${
                                activeTab === 'history' 
                                ? 'border-[#cc6d3e] text-[#cc6d3e]' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <History className="h-5 w-5" />
                            Mon Historique
                        </button>
                    </div>

                    {activeTab === 'new' ? (
                        <div className="py-4">
                            <ReclamationForm user={user} onSuccess={() => setActiveTab('history')} />
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {loading ? (
                                <div className="p-8 text-center text-gray-500">Chargement...</div>
                            ) : reclamations.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center">
                                    <div className="h-16 w-16 bg-[#faf1ec] rounded-full flex items-center justify-center mb-4">
                                        <Sparkles className="h-8 w-8 text-[#cc6d3e]" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Aucun retour envoyé</h3>
                                    <p className="text-sm text-gray-500 max-w-sm mt-1 mb-6">Vous n'avez pas encore envoyé de réclamation, avis ou signalement de bug.</p>
                                    <button 
                                        onClick={() => setActiveTab('new')}
                                        className="px-6 py-2 bg-[#cc6d3e] text-white rounded-lg font-medium hover:bg-[#b2572b] transition-colors"
                                    >
                                        Soumettre une demande
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auteur</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nature</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sujet</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {reclamations.map((ticket) => {
                                                const name = (ticket.profiles?.first_name || ticket.profiles?.last_name)
                                                    ? `${ticket.profiles.first_name || ''} ${ticket.profiles.last_name || ''}`.trim()
                                                    : ticket.profiles?.commercial_name || 'Moi'
                                                const role = 'Client'
                                                
                                                const typeColors = {
                                                    reclamation: 'bg-red-50 text-red-700 border-red-100',
                                                    avis: 'bg-amber-50 text-amber-700 border-amber-100',
                                                    bug: 'bg-blue-50 text-blue-700 border-blue-100'
                                                }

                                                const typeLabels = {
                                                    reclamation: 'Réclamation',
                                                    avis: 'Avis / Idée',
                                                    bug: 'Bug Technique'
                                                }

                                                const statusColors = {
                                                    pending: 'bg-slate-100 text-slate-700 border-slate-200',
                                                    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                                    ignored: 'bg-slate-50 text-slate-400 border-slate-100'
                                                }

                                                const statusLabels = {
                                                    pending: 'En attente',
                                                    resolved: 'Résolu',
                                                    ignored: 'Ignoré'
                                                }

                                                return (
                                                    <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-slate-800">{name}</span>
                                                                <span className="text-[11px] text-slate-400">{ticket.profiles?.email || user.email}</span>
                                                                <span className="inline-self-start mt-1 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100 w-max">
                                                                    {role}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${typeColors[ticket.type] || ''}`}>
                                                                {typeLabels[ticket.type] || ticket.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 max-w-xs">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-slate-700 truncate">{ticket.title}</span>
                                                                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{ticket.content}</p>
                                                                <button 
                                                                    onClick={() => setSelectedTicket(ticket)}
                                                                    className="text-left text-[11px] font-black text-blue-600 hover:text-blue-700 mt-1 uppercase tracking-wider w-max"
                                                                >
                                                                    Voir détails
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                                            {new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 text-[11px] font-extrabold rounded-full border ${statusColors[ticket.status] || ''}`}>
                                                                {statusLabels[ticket.status] || ticket.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex items-center justify-end space-x-2">
                                                                <button
                                                                    onClick={() => handleDeleteTicket(ticket.id)}
                                                                    className="p-1.5 rounded-lg bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-colors"
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {selectedTicket && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        {/* Header avec bande colorée */}
                        <div className="relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#cc6d3e] to-[#b2572b]"></div>
                            <div className="flex items-center justify-between p-6 pb-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Détails de la demande</h3>
                                    <p className="text-xs font-medium text-slate-400 mt-1">
                                        Soumise le {new Date(selectedTicket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 pb-6">
                            {/* Badges section */}
                            <div className="flex items-center gap-2 mb-6 pb-6 border-b border-slate-100">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                    selectedTicket.type === 'reclamation' ? 'bg-red-50 text-red-700 border-red-100' :
                                    selectedTicket.type === 'avis' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                    {selectedTicket.type === 'reclamation' ? 'Réclamation' : selectedTicket.type === 'avis' ? 'Avis / Idée' : 'Bug Technique'}
                                </span>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                    selectedTicket.status === 'pending' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                                    selectedTicket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    'bg-slate-50 text-slate-400 border-slate-100'
                                }`}>
                                    {selectedTicket.status === 'pending' ? 'En attente' : selectedTicket.status === 'resolved' ? 'Résolu' : 'Ignoré'}
                                </span>
                            </div>

                            <div className="mb-6">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sujet</span>
                                <h4 className="text-lg font-bold text-slate-800 mt-1.5 leading-snug">{selectedTicket.title}</h4>
                            </div>

                            <div className="mb-8">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description détaillée</span>
                                <div className="mt-2 bg-gradient-to-br from-slate-50 to-[#faf1ec]/30 p-5 rounded-2xl border border-slate-100 shadow-sm relative">
                                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-[#cc6d3e] rounded-r-md opacity-50"></div>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed ml-2">{selectedTicket.content}</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button 
                                    onClick={() => setSelectedTicket(null)}
                                    className="px-6 py-2.5 bg-[#cc6d3e] text-white text-sm font-bold rounded-xl hover:bg-[#b2572b] shadow-sm hover:shadow transition-all active:scale-[0.98]"
                                >
                                    Fermer les détails
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {ticketToDelete && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header Background */}
                        <div className="bg-red-50/50 pt-10 pb-6 flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-100 rounded-full scale-150 opacity-50"></div>
                                <div className="relative bg-white p-4 rounded-full shadow-sm border border-red-50">
                                    <Trash2 className="h-8 w-8 text-red-600" strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 pt-6 text-center">
                            <h3 className="text-2xl font-black text-slate-900 mb-3">Supprimer la réclamation ?</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8 px-4">
                                Vous êtes sur le point de retirer définitivement cet élément.<br/>
                                Cette action ne peut pas être annulée.
                            </p>

                            <div className="bg-red-50/50 border border-red-200 border-dashed rounded-xl p-4 mb-8 text-left flex gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-1">Attention irréversible</h4>
                                    <p className="text-xs text-red-600/80 italic leading-relaxed">
                                        Cette action supprimera également tous les fichiers et échanges liés à cette réclamation.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setTicketToDelete(null)}
                                    className="flex-1 py-3.5 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-sm shadow-red-600/20 hover:shadow transition-all active:scale-[0.98]"
                                >
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
