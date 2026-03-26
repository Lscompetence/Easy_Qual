import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Plus, FileText, CheckCircle, AlertTriangle, MoreVertical, Building, Mail, Lock, RefreshCw } from 'lucide-react'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'
import NewCaseModal from '../../components/consultant/NewCaseModal'
import DeleteModal from '../../components/DeleteModal'

export default function ConsultantCases() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [cases, setCases] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    const [showCreateModal, setShowCreateModal] = useState(false)

    const [walletBalance, setWalletBalance] = useState(0)
    const [openMenuId, setOpenMenuId] = useState(null)

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [caseToDelete, setCaseToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleted, setIsDeleted] = useState(false)

    const handleDeleteClick = (c) => {
        setCaseToDelete(c)
        setDeleteModalOpen(true)
        setIsDeleted(false) // Reset success state
        setOpenMenuId(null) // Close dropdown
    }

    const confirmDelete = async () => {
        if (!caseToDelete) return
        setIsDeleting(true)
        try {
            const caseId = caseToDelete.id

            // 1. Delete dependent data manually (Cascading Delete)
            // Messages
            await supabase.from('case_messages').delete().eq('case_id', caseId)
            // Events
            await supabase.from('case_events').delete().eq('case_id', caseId)
            // Indicator States
            await supabase.from('case_indicator_states').delete().eq('case_id', caseId)
            // Uploads/Comments
            await supabase.from('criterion_quiz_uploads').delete().eq('case_id', caseId)

            // 2. Delete the Case
            const { error } = await supabase
                .from('cases')
                .delete()
                .eq('id', caseId)

            if (error) throw error

            // 3. Update UI
            setIsDeleted(true) // Show success state in modal
            setCases(prev => prev.filter(c => c.id !== caseId))
        } catch (error) {
            console.error('Error deleting case:', error)
            alert("Erreur lors de la suppression : " + error.message)
            setDeleteModalOpen(false)
        } finally {
            setIsDeleting(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchCases()
            fetchWallet()

            // Realtime subscription for cases list
            const channel = supabase
                .channel(`consultant_cases_${user.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'cases'
                }, (payload) => {
                    console.log('Case list realtime sync:', payload.new.id)
                    setCases(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c))
                })
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'cases'
                }, () => {
                    // Refetch if a new case is added (to get relations correctly)
                    fetchCases()
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [user])

    const fetchWallet = async () => {
        const { data } = await supabase
            .from('credits_wallet')
            .select('balance')
            .eq('consultant_id', user.id)
            .single()
        if (data) setWalletBalance(data.balance)
    }

    const fetchCases = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('cases')
                .select(`
                    *,
                    tenants (name, siret, logo_url, client_email, initial_password)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setCases(data || [])
        } catch (error) {
            console.error('Error fetching cases:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredCases = cases.filter(c => {
        const matchesSearch = c.tenants?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.category?.toLowerCase().includes(searchQuery.toLowerCase())

        // Filter Logic:
        // 'all'           -> everything
        // 'validated'     -> only validated (Terminé)
        // 'not_completed' -> anything NOT validated
        // 'active'        -> cases with progress > 0 and not validated (En cours)
        const matchesStatus =
            filterStatus === 'all' ? true :
                filterStatus === 'validated' ? c.status === 'validated' :
                    filterStatus === 'not_completed' ? c.status !== 'validated' :
                        filterStatus === 'active' ? (c.status !== 'validated' && (c.status === 'active' || (c.progress || 0) > 0)) : true

        return matchesSearch && matchesStatus
    })

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-blue-50 text-blue-700'
            case 'validated': return 'bg-green-50 text-green-700'
            case 'draft': return 'bg-gray-100 text-gray-600'
            default: return 'bg-amber-50 text-amber-700'
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'Non Terminé'
            case 'validated': return 'Terminé'
            case 'draft': return '—'
            default: return '—'
        }
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans flex text-slate-800">
            <ConsultantSidebar isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                <ConsultantTopBar
                    onNewFolder={() => setShowCreateModal(true)}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    showMobileMenu={showMobileMenu}
                    setShowMobileMenu={setShowMobileMenu}
                />

                <main className="p-4 sm:p-6 lg:p-8 max-w-[2000px] mx-auto w-full">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Dossiers Clients</h1>
                            <p className="text-sm text-gray-500 mt-1">Gérez l'ensemble de vos dossiers d'accompagnement.</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                        {[
                            { id: 'all', label: 'Tout' },
                            { id: 'not_completed', label: 'Non Terminé' },
                            { id: 'validated', label: 'Validé' },
                            { id: 'active', label: 'En cours' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterStatus(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize whitespace-nowrap transition-colors ${filterStatus === tab.id
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                                    : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto overflow-y-auto max-h-[700px] custom-scrollbar">
                            <table className="w-full">
                                <thead className="bg-gray-50/50">
                                    <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <th className="px-6 py-4">Client</th>
                                        <th className="px-6 py-4">Type de Site</th>
                                        <th className="px-6 py-4">Audits</th>
                                        <th className="px-6 py-4 text-center">Accès Plateforme</th>
                                        <th className="px-6 py-4">Progression</th>
                                        <th className="px-6 py-4 text-right">Statut</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Chargement...</td></tr>
                                    ) : filteredCases.length === 0 ? (
                                        <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Aucun dossier trouvé.</td></tr>
                                    ) : (
                                        filteredCases.map((c) => (
                                            <tr
                                                key={c.id}
                                                // Removed onClick on tr to avoid conflict with dropdown
                                                className="group hover:bg-gray-50 transition-colors cursor-pointer relative"
                                            >
                                                <td className="px-6 py-4" onClick={() => navigate(`/consultant/case/${c.id}`)}>
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mr-4 uppercase shadow-sm">
                                                            {c.tenants?.name?.substring(0, 2) || 'UK'}
                                                        </div>
                                                        <div>
                                                            <span className="block text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                                                {c.tenants?.name}
                                                            </span>
                                                            <span className="text-xs text-gray-400">SIRET: {c.tenants?.siret}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4" onClick={() => navigate(`/consultant/case/${c.id}`)}>
                                                    <div className="flex items-center gap-2">
                                                        <Building className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-600 capitalize">
                                                            {c.category === 'multi-site' ? 'Multi-site' : 'Mono-site'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4" onClick={() => navigate(`/consultant/case/${c.id}`)}>
                                                    <div className="flex flex-wrap gap-1">
                                                        {c.audit_type && c.audit_type.map((type, idx) => (
                                                            <span key={idx} className="px-2 py-1 rounded bg-orange-50 text-orange-700 text-[10px] font-bold uppercase border border-orange-100">
                                                                {type.replace('Audit ', '')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 min-w-[240px]">
                                                    <div className="flex flex-col gap-2 items-center justify-center pr-4">
                                                        <div
                                                            className="flex items-center gap-2 w-full bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl"
                                                        >
                                                            <div className="flex-shrink-0 bg-white p-1.5 rounded-lg shadow-sm border border-slate-100">
                                                                <Mail className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                                                                {c.tenants?.client_email || 'Non défini'}
                                                            </span>


                                                        </div>
                                                        <div className="flex items-center gap-2 w-full bg-amber-50 border border-amber-200/50 px-3 py-1.5 rounded-xl">
                                                            <div className="flex-shrink-0 bg-white p-1.5 rounded-lg shadow-sm border border-amber-100">
                                                                <Lock className="h-4 w-4 text-amber-600" />
                                                            </div>
                                                            <span className="text-xs font-mono font-black text-amber-800 whitespace-nowrap">
                                                                {c.tenants?.initial_password || '—'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 w-1/5" onClick={() => navigate(`/consultant/case/${c.id}`)}>
                                                    <div className="flex flex-col gap-1 pr-4">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Progression</span>
                                                            <span className="text-xs font-black text-slate-700">{c.progress || 0}%</span>
                                                        </div>
                                                        <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${(c.progress || 0) >= 100 ? 'bg-emerald-500' :
                                                                    (c.progress || 0) >= 50 ? 'bg-indigo-500' : 'bg-blue-500'
                                                                    }`}
                                                                style={{ width: `${c.progress || 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right" onClick={() => navigate(`/consultant/case/${c.id}`)}>
                                                    {c.status === 'validated' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-100 shadow-sm">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block"></span> Validé
                                                        </span>
                                                    ) : (c.status === 'active' || (c.progress > 0)) ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 shadow-sm">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span> En cours
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 font-bold px-4">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right relative">
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setOpenMenuId(openMenuId === c.id ? null : c.id)
                                                            }}
                                                            className="text-gray-400 hover:text-purple-600 transition-colors p-2 hover:bg-purple-50 rounded-full"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>

                                                        {openMenuId === c.id && (
                                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-10 py-1 origin-top-right">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDeleteClick(c)
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                                    Supprimer
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination (Mock) */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span>Affichage de {filteredCases.length} dossiers</span>
                            <div className="flex gap-2">
                                <button disabled className="px-3 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">Précédent</button>
                                <button disabled className="px-3 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">Suivant</button>
                            </div>
                        </div>
                    </div>

                </main>
            </div>

            {/* Modal: Create Case */}
            <NewCaseModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                user={user}
                walletBalance={walletBalance}
                onSuccess={() => {
                    fetchCases()
                    fetchWallet()
                }}
            />

            {/* Modal: Delete Confirmation */}
            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Supprimer ce dossier ?"
                message={`Vous êtes sur le point de retirer le dossier "${caseToDelete?.tenants?.name || ''}".`}
                itemType={caseToDelete?.tenants?.name}
                isDeleting={isDeleting}
                isDeleted={isDeleted}
            />
        </div>
    )
}
