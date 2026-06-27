/* eslint-disable */
import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'
import { LogOut, ChevronDown, ChevronRight, CheckCircle, Circle, Video, MessageSquare, LayoutDashboard, GraduationCap, X, LifeBuoy, Archive, FileText, ClipboardList } from 'lucide-react'
import FeedbackModal from '../shared/FeedbackModal'
import { getCriterionColor } from '../../utils/theme'

export default function ClientSidebar({ caseData, indicators, indicatorStates, consultantName = '', unreadCount = 0, upcomingCount = 0, isOpen, onClose }) {
    const { user, profile, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [formationOpen, setFormationOpen] = useState(true)
    const [feedbackOpen, setFeedbackOpen] = useState(false)

    // ─── Badge "Historique toasts" : notifications consultant non lues ──────────
    const [unreadNotifs, setUnreadNotifs] = useState(0)
    const pathRef = useRef(location.pathname)
    pathRef.current = location.pathname
    const seenKey = user ? `eq_client_notifs_seen_${user.id}` : null

    useEffect(() => {
        if (!user) return
        let channel
        let active = true

        const computeUnread = async (cid) => {
            const lastSeen = (seenKey && localStorage.getItem(seenKey)) || '1970-01-01T00:00:00Z'
            const { count } = await supabase
                .from('case_notifications')
                .select('*', { count: 'exact', head: true })
                .eq('case_id', cid)
                .like('type', 'consultant_%')
                .gt('created_at', lastSeen)
            if (active) setUnreadNotifs(count || 0)
        }

        const init = async () => {
            let caseId = caseData?.id
            if (!caseId) {
                const { data: tenants } = await supabase.from('tenants').select('id').eq('owner_id', user.id)
                if (!tenants || tenants.length === 0) return
                const { data: cases } = await supabase
                    .from('cases').select('id')
                    .eq('tenant_id', tenants[0].id)
                    .order('created_at', { ascending: false }).limit(1)
                if (!cases || cases.length === 0) return
                caseId = cases[0].id
            }
            await computeUnread(caseId)

            channel = supabase
                .channel(`client_sidebar_notifs:${caseId}`)
                .on('postgres_changes', {
                    event: 'INSERT', schema: 'public', table: 'case_notifications',
                    filter: `case_id=eq.${caseId}`
                }, (payload) => {
                    if (!payload.new.type?.startsWith('consultant_')) return
                    // Si le client consulte déjà la page, on marque comme vu au lieu d'incrémenter
                    if (pathRef.current === '/client/toasts-history') {
                        if (seenKey) localStorage.setItem(seenKey, new Date().toISOString())
                    } else {
                        setUnreadNotifs(prev => prev + 1)
                    }
                })
                .subscribe()
        }
        init()
        return () => { active = false; if (channel) supabase.removeChannel(channel) }
    }, [user, caseData?.id])

    // Remise à zéro du badge dès que le client ouvre l'historique
    useEffect(() => {
        if (location.pathname === '/client/toasts-history' && seenKey) {
            localStorage.setItem(seenKey, new Date().toISOString())
            setUnreadNotifs(0)
        }
    }, [location.pathname, seenKey])

    // Group indicators by criterion
    const criteriaMap = {}

    // Use Fallback if indicators is empty to ensure Sidebar is never empty
    const effectiveIndicators = (indicators && indicators.length > 0) ? indicators : [
        { id: -1, criterion_id: 1, label: "Information du public", criteria: { id: 1, label: "Information du public" } },
        { id: -2, criterion_id: 2, label: "Objectifs & public", criteria: { id: 2, label: "Objectifs & public" } },
        { id: -3, criterion_id: 3, label: "Adaptation aux publics", criteria: { id: 3, label: "Adaptation aux publics" } },
        { id: -4, criterion_id: 4, label: "Moyens pédagogiques", criteria: { id: 4, label: "Moyens pédagogiques" } },
        { id: -5, criterion_id: 5, label: "Qualification formateurs", criteria: { id: 5, label: "Qualification formateurs" } },
        { id: -6, criterion_id: 6, label: "Inscription socio-éco", criteria: { id: 6, label: "Inscription socio-éco" } },
        { id: -7, criterion_id: 7, label: "Amélioration continue", criteria: { id: 7, label: "Amélioration continue" } }
    ]

    // Criterion labels override to match the target image exactly
    const CRITERION_LABELS = {
        1: "Information du public",
        2: "Objectifs & public",
        3: "Adaptation aux publics",
        4: "Moyens pédagogiques",
        5: "Qualification formateurs",
        6: "Inscription socio-éco",
        7: "Amélioration continue"
    }

    effectiveIndicators.forEach(ind => {
        const cid = ind.criterion_id
        if (!criteriaMap[cid]) {
            criteriaMap[cid] = {
                id: cid,
                label: CRITERION_LABELS[cid] || ind.criteria?.label || `Critère ${cid}`,
                items: []
            }
        }
        criteriaMap[cid].items.push(ind)
    })
    const criteriaList = Object.values(criteriaMap).sort((a, b) => a.id - b.id)

    // Calc progress per criterion
    const getCriterionProgress = (criterion) => {
        const done = criterion.items.filter(ind =>
            indicatorStates?.[ind.id]?.status === 'done' || indicatorStates?.[ind.id]?.status === 'not_applicable' || indicatorStates?.[ind.id]?.status === 'non_applicable'
        ).length
        return { done, total: criterion.items.length }
    }

    // Overall progress
    const totalIndicators = indicators?.length || 0
    const doneCount = Object.values(indicatorStates || {}).filter(s => s?.status === 'done' || s?.status === 'not_applicable' || s?.status === 'non_applicable').length
    const progressPct = totalIndicators > 0 ? Math.round((doneCount / totalIndicators) * 100) : 0

    const tenantName = (profile?.first_name || profile?.last_name)
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        : profile?.commercial_name || 'Mon Profil'
    const tenantInitial = tenantName[0]?.toUpperCase() || 'C'

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 lg:sticky lg:top-0 w-[240px] bg-white h-screen flex flex-col z-50 flex-shrink-0 border-r border-gray-100 text-[13px] font-sans transition-transform duration-300 transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-[#cc6d3e] rounded-xl flex items-center justify-center shadow-lg shadow-[#cc6d3e]/20">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-black text-gray-900 text-lg tracking-tight">Easy<span className="text-[#cc6d3e]">'</span>Qual</span>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={onClose} className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    {/* Vue d'ensemble */}
                    <div className="px-4 mb-2">
                        <Link
                            to="/client/dashboard"
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all ${location.pathname === '/client/dashboard'
                                ? 'bg-[#faf1ec] text-[#cc6d3e] shadow-sm shadow-[#cc6d3e]/5 border border-[#f5e2d6]'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <LayoutDashboard className={`h-5 w-5 flex-shrink-0 ${location.pathname === '/client/dashboard' ? 'text-[#cc6d3e]' : ''}`} />
                            Vue d'ensemble
                        </Link>
                    </div>

                    {/* MA FORMATION */}
                    <div className="px-4 mt-6">
                        <button
                            onClick={() => setFormationOpen(!formationOpen)}
                            className="w-full flex items-center justify-between px-1 py-2 mb-2"
                        >
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Ma Formation</span>
                            <div className="flex items-center gap-2">
                                {progressPct > 0 && (
                                    <span className="text-[10px] font-black text-[#cc6d3e] bg-[#faf1ec] px-2 py-0.5 rounded-full border border-[#f5e2d6]">
                                        {progressPct}%
                                    </span>
                                )}
                                {formationOpen ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
                            </div>
                        </button>

                        {formationOpen && (
                            <div className="relative ml-2 pl-4 space-y-1">
                                {/* Vertical line connector */}
                                <div className="absolute left-0 top-2 bottom-2 w-[1.5px] bg-gray-100" />

                                {criteriaList.map((criterion, idx) => {
                                    const { done, total } = getCriterionProgress(criterion)
                                    const allDone = done === total && total > 0
                                    const isActive = location.pathname === `/client/criterion/${criterion.id}`
                                    return (
                                        <Link
                                            key={criterion.id}
                                            to={`/client/criterion/${criterion.id}`}
                                            className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all relative ${!isActive ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50' : ''}`}
                                            style={isActive ? { backgroundColor: getCriterionColor(criterion.id).light, color: getCriterionColor(criterion.id).primary, borderColor: getCriterionColor(criterion.id).border, borderWidth: '1px' } : {}}
                                        >
                                            {/* Dot on line */}
                                            <div className={`absolute -left-[17.5px] h-2.5 w-2.5 rounded-full border-2 bg-white z-10 transition-colors ${allDone ? 'border-emerald-500' :
                                                (!isActive ? 'border-gray-200 group-hover:border-gray-300' : '')
                                                }`} style={isActive && !allDone ? { borderColor: getCriterionColor(criterion.id).primary } : {}} />

                                            {allDone ? (
                                                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                            ) : (
                                                <Circle className={`h-4 w-4 flex-shrink-0 ${!isActive ? 'text-gray-300 group-hover:text-gray-400' : ''}`} style={isActive ? { color: getCriterionColor(criterion.id).primary } : {}} />
                                            )}
                                            <span className={`truncate text-xs font-bold ${allDone ? 'text-emerald-600' : (!isActive ? 'text-gray-500' : '')}`} style={isActive && !allDone ? { color: getCriterionColor(criterion.id).primary } : {}}>
                                                C{criterion.id} : {criterion.label}
                                            </span>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* ACCOMPAGNEMENT */}
                    <div className="px-4 mt-8">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Accompagnement</p>
                        <div className="space-y-1">
                            <Link
                                to="/client/sessions"
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all relative ${location.pathname === '/client/sessions' ? 'bg-[#faf1ec] text-[#cc6d3e] border border-[#f5e2d6]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Video className={`h-5 w-5 flex-shrink-0 ${location.pathname === '/client/sessions' ? 'text-[#cc6d3e]' : 'text-gray-400'}`} />
                                <span className="flex-1 text-xs">Sessions & Visios</span>
                                {upcomingCount > 0 && (
                                    <span className="h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-red-500/20">
                                        {upcomingCount}
                                    </span>
                                )}
                            </Link>
                            <Link
                                to="/client/messages"
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all relative ${location.pathname === '/client/messages'
                                    ? 'bg-[#faf1ec] text-[#cc6d3e] border border-[#f5e2d6]'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <MessageSquare className={`h-5 w-5 flex-shrink-0 ${location.pathname === '/client/messages' ? 'text-[#cc6d3e]' : 'text-gray-400'}`} />
                                <span className="flex-1">Message au consultant</span>
                                {unreadCount > 0 && (
                                    <span className="h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-red-500/20">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>

                            <Link
                                to="/client/reclamations"
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all relative ${location.pathname === '/client/reclamations'
                                    ? 'bg-[#faf1ec] text-[#cc6d3e] border border-[#f5e2d6]'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Archive className={`h-5 w-5 flex-shrink-0 ${location.pathname === '/client/reclamations' ? 'text-[#cc6d3e]' : 'text-gray-400'}`} />
                                <span className="flex-1">Mes Réclamations</span>
                            </Link>

                            <Link
                                to="/client/questionnaires"
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all relative ${location.pathname === '/client/questionnaires'
                                    ? 'bg-[#faf1ec] text-[#cc6d3e] border border-[#f5e2d6]'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <FileText className={`h-5 w-5 flex-shrink-0 ${location.pathname === '/client/questionnaires' ? 'text-[#cc6d3e]' : 'text-gray-400'}`} />
                                <span className="flex-1">Questionnaires</span>
                            </Link>

                            <Link
                                to="/client/toasts-history"
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all relative ${location.pathname === '/client/toasts-history'
                                    ? 'bg-[#faf1ec] text-[#cc6d3e] border border-[#f5e2d6]'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <ClipboardList className={`h-5 w-5 flex-shrink-0 ${location.pathname === '/client/toasts-history' ? 'text-[#cc6d3e]' : 'text-gray-400'}`} />
                                <span className="flex-1">Historique toasts</span>
                                {unreadNotifs > 0 && (
                                    <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-red-500/20">
                                        {unreadNotifs > 99 ? '99+' : unreadNotifs}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom user + logout */}
                <div className="p-4 border-t border-gray-100">
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-[#f5e2d6] flex items-center justify-center text-[#cc6d3e] font-black text-lg flex-shrink-0 shadow-sm border border-white">
                                {profile?.avatar_url
                                    ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover rounded-xl" />
                                    : tenantInitial
                                }
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-gray-900 truncate">{tenantName}</p>
                                <p className="text-[11px] font-bold text-gray-500 truncate mt-0.5">Client</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                to="/client/profile"
                                className="flex-1 text-center py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-700 hover:border-[#cc6d3e] hover:text-[#cc6d3e] hover:bg-[#faf1ec] transition-all shadow-sm"
                            >
                                Mon Profil
                            </Link>
                            <button
                                onClick={async () => { await logout(); navigate('/login?role=client') }}
                                className="h-9 w-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm flex-shrink-0"
                                title="Déconnexion"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </>
    )
}

