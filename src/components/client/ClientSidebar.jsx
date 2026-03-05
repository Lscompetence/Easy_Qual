import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'
import { LogOut, ChevronDown, ChevronRight, CheckCircle, Circle, Video, MessageSquare, LayoutDashboard, GraduationCap } from 'lucide-react'

export default function ClientSidebar({ caseData, indicators, indicatorStates, consultantName = '', unreadCount = 0 }) {
    const { user, profile, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [formationOpen, setFormationOpen] = useState(true)

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

    effectiveIndicators.forEach(ind => {
        const cid = ind.criterion_id
        if (!criteriaMap[cid]) {
            criteriaMap[cid] = {
                id: cid,
                label: ind.criteria?.label || `Critère ${cid}`,
                items: []
            }
        }
        criteriaMap[cid].items.push(ind)
    })
    const criteriaList = Object.values(criteriaMap)

    // Calc progress per criterion
    const getCriterionProgress = (criterion) => {
        const done = criterion.items.filter(ind =>
            indicatorStates?.[ind.id]?.status === 'done' || indicatorStates?.[ind.id]?.status === 'non_applicable'
        ).length
        return { done, total: criterion.items.length }
    }

    // Overall progress
    const totalIndicators = indicators?.length || 0
    const doneCount = Object.values(indicatorStates || {}).filter(s => s?.status === 'done' || s?.status === 'non_applicable').length
    const progressPct = totalIndicators > 0 ? Math.round((doneCount / totalIndicators) * 100) : 0

    const tenantName = profile?.commercial_name || 'Mon Organisme'
    const tenantInitial = tenantName[0]?.toUpperCase() || 'O'

    return (
        <aside className="w-[200px] bg-white h-screen sticky top-0 flex flex-col z-50 flex-shrink-0 border-r border-gray-100 text-[13px] font-sans">
            {/* Logo */}
            <div className="h-14 flex items-center px-4 border-b border-gray-50 gap-2">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-[#cc6d3e] rounded-lg flex items-center justify-center shadow-lg shadow-[#cc6d3e]/20">
                        <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-black text-gray-900 text-base tracking-tight">Easy<span className="text-[#cc6d3e]">'</span>Qual</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                {/* Vue d'ensemble */}
                <div className="px-3 mb-2">
                    <Link
                        to="/client/dashboard"
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-black transition-all ${location.pathname === '/client/dashboard'
                            ? 'bg-[#faf1ec] text-[#b35d32] shadow-sm shadow-[#cc6d3e]/10 border border-[#f5e2d6]/50'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                    >
                        <LayoutDashboard className={`h-4 w-4 flex-shrink-0 ${location.pathname === '/client/dashboard' ? 'text-[#cc6d3e]' : ''}`} />
                        Vue d'ensemble
                    </Link>
                </div>

                {/* MA FORMATION */}
                <div className="px-3 mt-3">
                    <button
                        onClick={() => setFormationOpen(!formationOpen)}
                        className="w-full flex items-center justify-between px-1 py-1 mb-2 mt-1"
                    >
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ma Formation</span>
                        <div className="flex items-center gap-2">
                            {progressPct > 0 && (
                                <span className="text-[10px] font-black text-[#cc6d3e] bg-[#faf1ec] px-1.5 py-0.5 rounded-md">
                                    {progressPct}%
                                </span>
                            )}
                            {formationOpen ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
                        </div>
                    </button>

                    {formationOpen && (
                        <div className="relative ml-2 pl-3 space-y-1">
                            {/* Vertical line connector */}
                            {criteriaList.length > 0 && (
                                <div className="absolute left-0 top-2 bottom-2 w-[1px] bg-gray-100" />
                            )}

                            {criteriaList.length === 0 ? (
                                <p className="text-xs text-gray-400 px-2 py-1 italic">Aucun critère</p>
                            ) : (
                                criteriaList.map((criterion, idx) => {
                                    const { done, total } = getCriterionProgress(criterion)
                                    const allDone = done === total && total > 0
                                    const isActive = location.pathname === `/client/criterion/${criterion.id}`
                                    return (
                                        <Link
                                            key={criterion.id}
                                            to={`/client/criterion/${criterion.id}`}
                                            className={`group flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all relative ${isActive ? 'bg-[#faf1ec] text-[#b35d32]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                                }`}
                                        >
                                            {/* Dot on line */}
                                            <div className={`absolute -left-[14.5px] h-2 w-2 rounded-full border-2 bg-white z-10 ${allDone ? 'border-emerald-500' :
                                                isActive ? 'border-[#cc6d3e]' : 'border-gray-200 group-hover:border-gray-300'
                                                }`} />

                                            {allDone ? (
                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                            ) : (
                                                <Circle className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-[#cc6d3e]' : 'text-gray-300 group-hover:text-gray-400'}`} />
                                            )}
                                            <span className={`truncate text-[11px] font-bold ${allDone ? 'text-emerald-600' :
                                                isActive ? 'text-[#b35d32]' : 'text-gray-500'
                                                }`}>
                                                C{idx + 1} : {criterion.label}
                                            </span>
                                        </Link>
                                    )
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* ACCOMPAGNEMENT */}
                <div className="px-3 mt-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Accompagnement</p>
                    <div className="space-y-0.5">
                        <Link
                            to="/client/sessions"
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${location.pathname === '/client/sessions' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                }`}
                        >
                            <Video className="h-3.5 w-3.5 flex-shrink-0" />
                            Sessions & Visios
                        </Link>
                        <Link
                            to="/client/messages"
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all relative ${location.pathname === '/client/messages'
                                ? 'bg-[#faf1ec] text-[#cc6d3e] shadow-sm shadow-[#cc6d3e]/5 border border-[#cc6d3e]/10'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                }`}
                        >
                            <MessageSquare className={`h-4 w-4 flex-shrink-0 ${location.pathname === '/client/messages' ? 'text-[#cc6d3e]' : 'text-gray-400'}`} />
                            <span className="flex-1">Message au consultant</span>
                            {unreadCount > 0 && (
                                <span className="h-4.5 w-4.5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm -mr-1">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom user + logout */}
            <div className="p-3 border-t border-gray-100">
                {/* User card */}
                <div className="bg-gray-50 rounded-xl p-3 mb-2">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="h-9 w-9 rounded-full bg-[#f5e2d6] flex items-center justify-center text-[#b35d32] font-black text-sm flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                            {profile?.avatar_url
                                ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                                : tenantInitial
                            }
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-gray-900 truncate leading-tight">{tenantName}</p>
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                {consultantName ? `Responsable : ${consultantName}` : (profile?.email || user?.email || '')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            to="/client/profile"
                            className="flex-1 text-center py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-600 hover:border-[#cc6d3e] hover:text-[#b35d32] hover:bg-[#faf1ec] transition-all shadow-sm"
                        >
                            Mon Profil
                        </Link>
                        <button
                            onClick={async () => { await logout(); navigate('/login?role=client') }}
                            className="h-7 w-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm flex-shrink-0"
                            title="Déconnexion"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    )
}

