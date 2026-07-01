import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    ClipboardList,
    Clock,
    CheckCircle,
    ArrowRight,
    FileText,
    Upload,
    User,
    HelpCircle,
    XCircle,
    RefreshCw
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'

// ANO-01 — Les notifications consultant lisent case_notifications (type client_*)
// La messagerie est un canal humain exclusif → ConsultantMessages.jsx

export default function ConsultantNotifications() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    const fetchNotifications = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            // 1. Fetch case IDs for this consultant
            const { data: casesData } = await supabase
                .from('cases')
                .select('id, tenants(name)')
                .eq('consultant_id', user.id)

            const caseIds = casesData?.map(c => c.id) || []
            const caseNameMap = {}
            casesData?.forEach(c => { caseNameMap[c.id] = c.tenants?.name || 'Client' })

            if (caseIds.length === 0) { setNotifications([]); setLoading(false); return }

            // 2. Fetch client actions from case_notifications (type client_*)
            const { data, error } = await supabase
                .from('case_notifications')
                .select('id, case_id, type, content, created_at')
                .in('case_id', caseIds)
                .like('type', 'client_%')
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) throw error

            const processed = (data || []).map(n => ({
                ...n,
                clientName: caseNameMap[n.case_id] || 'Client',
                is_new: true
            }))

            setNotifications(processed)

            // Mark as seen
            localStorage.setItem(`eq_last_actions_seen_${user.id}`, new Date().toISOString())
        } catch (err) {
            console.error('Error fetching notifications:', err)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (user) {
            fetchNotifications()

            // Real-time: listen to new client actions
            const channel = supabase
                .channel('consultant_notifs_realtime')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'case_notifications'
                }, (payload) => {
                    if (payload.new.type?.startsWith('client_')) {
                        fetchNotifications()
                    }
                })
                .subscribe()

            return () => { supabase.removeChannel(channel) }
        }
    }, [user, fetchNotifications])

    const getIcon = (type) => {
        if (type?.includes('file_upload') || type?.includes('quiz')) return <Upload className="h-6 w-6" />
        if (type?.includes('indicator')) return <FileText className="h-6 w-6" />
        if (type?.includes('profile') || type?.includes('password')) return <User className="h-6 w-6" />
        if (type?.includes('quiz_success')) return <CheckCircle className="h-6 w-6" />
        if (type?.includes('quiz_fail') || type?.includes('failed')) return <XCircle className="h-6 w-6" />
        return <HelpCircle className="h-6 w-6" />
    }

    const getTheme = (type) => {
        if (type?.includes('success') || type?.includes('upload') || type?.includes('file')) {
            return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
        }
        if (type?.includes('fail') || type?.includes('failed')) {
            return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', badge: 'bg-rose-100 text-rose-700 border-rose-200' }
        }
        if (type?.includes('profile') || type?.includes('password')) {
            return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', badge: 'bg-blue-100 text-blue-700 border-blue-200' }
        }
        return { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' }
    }

    const getTypeLabel = (type) => {
        const labels = {
            client_indicator_update: 'Mise à jour indicateur',
            client_file_upload: 'Dépôt de fichier',
            client_quiz_success: 'Quiz validé ✅',
            client_quiz_failed: 'Quiz échoué ❌',
            client_profile_update: 'Profil modifié',
            client_password_change: 'Mot de passe changé',
        }
        return labels[type] || 'Action client'
    }

    const getTargetUrl = (notif) => {
        let url = `/consultant/case/${notif.case_id}`
        if (notif.type?.includes('file') || notif.type?.includes('indicator') || notif.type?.includes('quiz')) {
            url += '?tab=suivi_rno'
        } else if (notif.type?.includes('profile') || notif.type?.includes('password')) {
            url += '?tab=infocentre'
        }
        return url
    }

    return (
        <div className="bg-gray-50 min-h-screen flex font-sans">
            <ConsultantSidebar isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                <ConsultantTopBar
                    showMobileMenu={showMobileMenu}
                    setShowMobileMenu={setShowMobileMenu}
                    showSearch={false}
                />

                <main className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <ClipboardList className="h-5 w-5 text-white" />
                                </div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Actions de vos clients</h1>
                            </div>
                            <p className="text-gray-500 font-medium">
                                Toutes les actions de vos clients sur leurs dossiers (dépôts, mises à jour, quiz…)
                            </p>
                        </div>
                        <button
                            onClick={fetchNotifications}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Actualiser
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
                                <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">Chargement...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/40 p-20 text-center">
                                <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Clock className="h-10 w-10 text-gray-200" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 mb-2">Aucune action pour l'instant</h2>
                                <p className="text-gray-400 max-w-sm mx-auto">
                                    Les actions de vos clients sur leurs dossiers apparaîtront ici.
                                </p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const theme = getTheme(notif.type)
                                const timeStr = notif.created_at
                                    ? new Date(notif.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                    : ''
                                const dateStr = notif.created_at
                                    ? new Date(notif.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : ''

                                return (
                                    <div
                                        key={notif.id}
                                        className="group relative overflow-hidden bg-white rounded-3xl border-2 border-gray-50 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-indigo-50"
                                    >
                                        <div className="p-6 flex items-start gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${theme.bg} ${theme.text}`}>
                                                {getIcon(notif.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${theme.badge}`}>
                                                        {notif.clientName}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-gray-50 text-gray-500 border-gray-100">
                                                        {getTypeLabel(notif.type)}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400">
                                                        • {dateStr} à {timeStr}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 mt-1">
                                                    {(notif.content || '').split('\n').map((line, idx) => (
                                                        <div key={idx} className="text-sm leading-relaxed text-gray-600 group-hover:text-gray-900 font-medium break-words transition-colors">
                                                            {line.trim()}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => navigate(getTargetUrl(notif))}
                                                className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-indigo-600 hover:text-white transition-all group-hover:bg-indigo-100 group-hover:text-indigo-600"
                                                title="Voir le dossier"
                                            >
                                                <ArrowRight className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
