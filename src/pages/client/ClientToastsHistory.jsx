import { useState, useEffect, useCallback } from 'react'
import {
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Info,
    MessageSquare,
    ClipboardList,
    FileCheck,
    User,
    RefreshCw
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'
import ClientSidebar from '../../components/client/ClientSidebar'
import ClientTopBar from '../../components/client/ClientTopBar'

export default function ClientToastsHistory() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [indicators, setIndicators] = useState([])
    const [indicatorStates, setIndicatorStates] = useState({})
    const [myCase, setMyCase] = useState(null)
    const [consultantName, setConsultantName] = useState('')

    const fetchNotifications = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            // 1. Get tenant + case
            const { data: tenants } = await supabase
                .from('tenants')
                .select('id')
                .eq('owner_id', user.id)

            if (!tenants || tenants.length === 0) { setLoading(false); return }

            const { data: cases } = await supabase
                .from('cases')
                .select('id, tenant_id, consultant_id')
                .eq('tenant_id', tenants[0].id)
                .order('created_at', { ascending: false })
                .limit(1)

            if (!cases || cases.length === 0) { setLoading(false); return }
            const caseData = cases[0]
            setMyCase(caseData)

            if (caseData.consultant_id) {
                const { data: p } = await supabase
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', caseData.consultant_id)
                    .single()
                if (p) setConsultantName(`${p.first_name || ''} ${p.last_name || ''}`.trim())
            }

            // 2. Fetch consultant actions from case_notifications (type starts with 'consultant_')
            const { data: notifData } = await supabase
                .from('case_notifications')
                .select('id, type, content, created_at')
                .eq('case_id', caseData.id)
                .like('type', 'consultant_%')
                .order('created_at', { ascending: false })
                .limit(100)

            // 3. Fetch indicator states for sidebar
            const { data: states } = await supabase
                .from('case_indicator_states')
                .select('indicator_id, status')
                .eq('case_id', caseData.id)
            const statesMap = {}
            states?.forEach(s => { statesMap[s.indicator_id] = { status: s.status } })
            setIndicatorStates(statesMap)

            // Combine and sort by date desc
            const items = (notifData || []).map(n => ({
                id: n.id,
                message: n.content,
                type: n.type,
                category: 'action',
                created_at: n.created_at
            }))

            setNotifications(items)
        } catch (err) {
            console.error('Error fetching notifications:', err)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        // Clear old localStorage history (it contained client's own actions by mistake)
        if (user) {
            localStorage.removeItem(`eq_client_toast_history_${user.id}`)
        }
        fetchNotifications()
    }, [fetchNotifications, user])

    // Fetch indicators for sidebar
    useEffect(() => {
        if (!user) return
        supabase
            .from('indicators')
            .select('id, code, label, criterion_id, criteria (id, label)')
            .order('id', { ascending: true })
            .then(({ data }) => { if (data) setIndicators(data) })
    }, [user])

    // Real-time: listen for new consultant notifications
    useEffect(() => {
        if (!myCase?.id) return
        const channel = supabase
            .channel(`client_history_realtime:${myCase.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'case_notifications',
                filter: `case_id=eq.${myCase.id}`
            }, (payload) => {
                if (payload.new.type?.startsWith('consultant_')) {
                    setNotifications(prev => [{
                        id: payload.new.id,
                        message: payload.new.content,
                        type: payload.new.type,
                        category: 'action',
                        created_at: payload.new.created_at
                    }, ...prev])
                }
            })
            .subscribe()
        return () => supabase.removeChannel(channel)
    }, [myCase?.id])

    // Gravité déduite du contenu réel (le type est souvent 'consultant_verdict' générique).
    // ⚠️ 'non conforme' contient 'conforme' : on teste les négatifs EN PREMIER.
    const getSeverity = (type, message) => {
        const m = (message || '').toLowerCase()
        if (m.includes('non conforme') || type?.includes('failed') || type?.includes('failure') || type?.includes('error')) return 'danger'
        if (m.includes('non applicable')) return 'warning'
        if (m.includes('conforme') || m.includes('validé') || type?.includes('success')) return 'success'
        if (type?.includes('remark') || type?.includes('comment') || type?.includes('message') || m.includes('remarque')) return 'info'
        return 'default'
    }

    const getIcon = (severity) => {
        switch (severity) {
            case 'danger':  return <XCircle className="h-6 w-6" />
            case 'warning': return <AlertTriangle className="h-6 w-6" />
            case 'success': return <CheckCircle className="h-6 w-6" />
            case 'info':    return <MessageSquare className="h-6 w-6" />
            default:        return <FileCheck className="h-6 w-6" />
        }
    }

    const getTheme = (severity) => {
        switch (severity) {
            case 'danger':
                return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', label: 'bg-rose-100 text-rose-700 border-rose-200' }
            case 'warning':
                return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'bg-amber-100 text-amber-700 border-amber-200' }
            case 'success':
                return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
            case 'info':
                return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', label: 'bg-blue-100 text-blue-700 border-blue-200' }
            default:
                return { bg: 'bg-[#faf1ec]', text: 'text-[#cc6d3e]', border: 'border-[#f5e2d6]', label: 'bg-[#fdf5f0] text-[#cc6d3e] border-[#f5e2d6]' }
        }
    }

    const getTypeLabel = (type) => {
        const labels = {
            consultant_indicator_update: 'Statut mis à jour',
            consultant_file_feedback: 'Retour sur fichier',
            consultant_comment: 'Commentaire',
            consultant_status_update: 'Statut dossier',
            consultant_message: 'Message',
        }
        return labels[type] || 'Action consultant'
    }

    return (
        <div className="bg-gray-50 min-h-screen flex font-sans">
            <ClientSidebar
                caseData={myCase}
                indicators={indicators}
                indicatorStates={indicatorStates}
                consultantName={consultantName}
                isOpen={showMobileMenu}
                onClose={() => setShowMobileMenu(false)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <ClientTopBar
                    breadcrumbs={[
                        { label: 'Formation', path: '/client/dashboard' },
                        { label: 'Historique Toasts' }
                    ]}
                    consultantName={consultantName}
                    setShowMobileMenu={setShowMobileMenu}
                />

                <main className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 bg-[#cc6d3e] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100">
                                    <ClipboardList className="h-5 w-5 text-white" />
                                </div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Activités de mon consultant</h1>
                            </div>
                            <p className="text-gray-500 font-medium">
                                Toutes les actions réalisées par votre consultant sur votre dossier de formation.
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
                                <div className="h-8 w-8 border-2 border-[#cc6d3e] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">Chargement...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/40 p-20 text-center">
                                <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Clock className="h-10 w-10 text-gray-200" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 mb-2">Aucune activité pour l'instant</h2>
                                <p className="text-gray-400 max-w-sm mx-auto">
                                    Les actions de votre consultant sur votre dossier apparaîtront ici.
                                </p>
                            </div>
                        ) : (
                            notifications.map((item) => {
                                const severity = getSeverity(item.type, item.message)
                                const theme = getTheme(severity)
                                const timeStr = item.created_at
                                    ? new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                    : ''
                                const dateStr = item.created_at
                                    ? new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : ''

                                return (
                                    <div
                                        key={item.id}
                                        className={`group relative overflow-hidden bg-white rounded-3xl border-2 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-orange-50 ${severity === 'danger' ? 'border-rose-200' : 'border-gray-50'}`}
                                    >
                                        {/* Barre latérale de couleur selon la gravité */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.text.replace('text-', 'bg-')}`} />
                                        <div className="p-6 flex items-start gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${theme.bg} ${theme.text}`}>
                                                {getIcon(severity)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${theme.label}`}>
                                                        {consultantName || 'Consultant'}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-gray-50 text-gray-500 border-gray-100`}>
                                                        {getTypeLabel(item.type)}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400">
                                                        • {dateStr} à {timeStr}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 mt-1">
                                                    {(item.message || '')
                                                        // Retire l'emoji de statut en tête : la couleur de l'icône suffit
                                                        .replace(/^[^\p{L}\p{N}]+/u, '')
                                                        .split('\n').map((line, idx) => (
                                                        <div key={idx} className="text-sm leading-relaxed text-gray-600 group-hover:text-gray-900 font-medium break-words transition-colors">
                                                            {line.trim()}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
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
