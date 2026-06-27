import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Filter, Plus, FileText, CheckCircle, AlertTriangle, MoreVertical, Building, Mail, Lock, RefreshCw, X, XCircle, Info } from 'lucide-react'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'
import NewCaseModal from '../../components/consultant/NewCaseModal'
import UpdateCaseModal from '../../components/consultant/UpdateCaseModal'
import DeleteModal from '../../components/DeleteModal'

export default function ConsultantCases() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [cases, setCases] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState(() => {
        const params = new URLSearchParams(location.search)
        return params.get('search') || ''
    })
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

    // Update Modal State
    const [updateModalOpen, setUpdateModalOpen] = useState(false)
    const [caseToUpdate, setCaseToUpdate] = useState(null)

    // Email Access Modal State
    const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false)
    const [selectedCaseForEmail, setSelectedCaseForEmail] = useState(null)
    const [emailSending, setEmailSending] = useState(false)
    const [toasts, setToasts] = useState([])

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9)
        setToasts(prev => [...prev, { id, message, type, created_at: new Date().toISOString() }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 4000)
    }, [])

    const renderLocalToasts = () => {
        return (
            <div className="fixed top-20 right-5 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none">
                {toasts.map(t => {
                    const iconMap = {
                        success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
                        error: <XCircle className="h-5 w-5 text-rose-400" />,
                        warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
                        info: <Info className="h-5 w-5 text-indigo-400" />
                    }
                    const borderMap = {
                        success: 'border-l-4 border-l-emerald-500 border-slate-800/80',
                        error: 'border-l-4 border-l-rose-500 border-slate-800/80',
                        warning: 'border-l-4 border-l-amber-500 border-slate-800/80',
                        info: 'border-l-4 border-l-indigo-500 border-slate-800/80'
                    }
                    const titleMap = {
                        success: 'Succès',
                        error: 'Erreur',
                        warning: 'Avertissement',
                        info: 'Notification'
                    }
                    const icon = iconMap[t.type] || iconMap.info
                    const borderClass = borderMap[t.type] || borderMap.info
                    const title = titleMap[t.type] || titleMap.info
                    const timeStr = t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                    return (
                        <div
                            key={t.id}
                            className={`pointer-events-auto flex gap-4 bg-slate-900/95 text-white p-4 rounded-xl shadow-2xl border border-slate-800/50 backdrop-blur-md animate-in slide-in-from-top duration-300 w-80 sm:w-96 transition-all ${borderClass}`}
                        >
                            <div className="flex-shrink-0 mt-0.5">
                                {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-sm font-bold tracking-wide text-slate-200">
                                        {title}
                                    </span>
                                    {timeStr && (
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            {timeStr}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-medium break-words">
                                    {t.message}
                                </div>
                            </div>
                            <button
                                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                                className="flex-shrink-0 text-slate-500 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
                                aria-label="Fermer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )
                })}
            </div>
        )
    }

    const handleInitiateSendEmail = (caseItem) => {
        setSelectedCaseForEmail(caseItem)
        setShowEmailConfirmModal(true)
        setOpenMenuId(null) // Close dropdown
    }

    const confirmSendEmail = async () => {
        if (!selectedCaseForEmail) return

        const tenant = selectedCaseForEmail.tenants
        if (!tenant || !tenant.client_email) {
            showToast("Email client manquant dans ce dossier.", "error")
            return
        }

        try {
            setEmailSending(true)
            
            const { data, error } = await supabase.functions.invoke('invite-client', {
                body: {
                    email: tenant.client_email,
                    password: tenant.initial_password,
                    tenant_id: selectedCaseForEmail.tenant_id,
                    tenant_name: tenant.name,
                    first_name: selectedCaseForEmail.client_first_name || '',
                    last_name: selectedCaseForEmail.client_last_name || ''
                }
            })

            if (error) throw error
            if (data?.error) throw new Error(data.error)

            showToast(`Les accès ont été envoyés avec succès à ${tenant.client_email} ✓`, "success")
            setShowEmailConfirmModal(false)
        } catch (err) {
            console.error('Error sending credentials:', err)
            showToast(`L'envoi des accès a échoué : ${err.message}`, "error")
        } finally {
            setEmailSending(false)
            setSelectedCaseForEmail(null)
        }
    }

    const handleUpdateClick = (c) => {
        setCaseToUpdate(c)
        setUpdateModalOpen(true)
        setOpenMenuId(null) // Close dropdown
    }

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



    const fetchWallet = useCallback(async () => {
        const { data } = await supabase
            .from('credits_wallet')
            .select('balance')
            .eq('consultant_id', user.id)
            .single()
        if (data) setWalletBalance(data.balance)
    }, [user])

    const fetchCases = useCallback(async () => {
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
    }, [])

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
    }, [user, fetchCases, fetchWallet])

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
                                                        {c.tenants?.client_email && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleInitiateSendEmail(c);
                                                                }}
                                                                className="flex items-center justify-center gap-1.5 w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-[0.98]"
                                                            >
                                                                <Mail className="h-3 w-3" />
                                                                Renvoyer les accès
                                                            </button>
                                                        )}
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
                                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-10 py-1 origin-top-right animate-in fade-in slide-in-from-top-1 duration-200">
                                                                {c.tenants?.client_email && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleInitiateSendEmail(c)
                                                                        }}
                                                                        className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 font-bold flex items-center gap-2 border-b border-gray-100 transition-colors"
                                                                    >
                                                                        <Mail className="h-4 w-4 text-purple-600" />
                                                                        Renvoyer les accès
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleUpdateClick(c)
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2 border-b border-gray-50"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                                    Modifier
                                                                </button>
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
            
            {/* Modal: Update Case */}
            <UpdateCaseModal
                isOpen={updateModalOpen}
                onClose={() => setUpdateModalOpen(false)}
                user={user}
                caseData={caseToUpdate}
                onSuccess={() => fetchCases()}
            />
            {/* Modal: Email Confirmation */}
            {showEmailConfirmModal && selectedCaseForEmail && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
                                <Mail className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Envoyer les accès ?</h3>
                            <p className="text-sm text-gray-500 mb-6 text-center">
                                Êtes-vous sûr de vouloir envoyer les identifiants de connexion à <span className="font-bold">{selectedCaseForEmail.tenants?.name}</span> ({selectedCaseForEmail.tenants?.client_email}) ?
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowEmailConfirmModal(false)
                                        setSelectedCaseForEmail(null)
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors text-sm"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmSendEmail}
                                    disabled={emailSending}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30 flex items-center justify-center text-sm disabled:opacity-50"
                                >
                                    {emailSending ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                            Envoi...
                                        </>
                                    ) : (
                                        'Envoyer'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {renderLocalToasts()}
        </div>
    )
}
