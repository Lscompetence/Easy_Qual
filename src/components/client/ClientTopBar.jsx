import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { MessageSquare, Check, Menu, Bell, Info, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react'

export default function ClientTopBar({ breadcrumbs = [], consultantName = '', onContact, setShowMobileMenu }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()
    const [caseId, setCaseId] = useState(null)
    const [toasts, setToasts] = useState([])
    const [consultant, setConsultant] = useState(null)

    // Badge: unread messages from consultant
    const [unreadMsgCount, setUnreadMsgCount] = useState(0)

    // Fetch case of the logged-in client
    useEffect(() => {
        if (!user) return
        const fetchCaseId = async () => {
            const { data: tenants } = await supabase
                .from('tenants')
                .select('id')
                .eq('owner_id', user.id)
            if (tenants && tenants.length > 0) {
                const { data: cases } = await supabase
                    .from('cases')
                    .select('id, consultant_id')
                    .eq('tenant_id', tenants[0].id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                if (cases && cases.length > 0) {
                    setCaseId(cases[0].id)
                    
                    if (cases[0].consultant_id) {
                        const { data: p } = await supabase
                            .from('profiles')
                            .select('first_name, last_name, avatar_url')
                            .eq('id', cases[0].consultant_id)
                            .single()
                        if (p) {
                            setConsultant({
                                name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
                                avatar_url: p.avatar_url
                            })
                        }
                    }
                }
            }
        }
        fetchCaseId()
    }, [user])

    // Fetch initial unread message count from DB
    useEffect(() => {
        if (!caseId || !user) return
        const fetchUnread = async () => {
            const { count } = await supabase
                .from('case_messages')
                .select('id', { count: 'exact', head: true })
                .eq('case_id', caseId)
                .neq('sender_id', user.id)
                .is('read_at', null)
                .not('content', 'ilike', '[SYSTEM]%')
            setUnreadMsgCount(count || 0)
        }
        fetchUnread()
    }, [caseId, user])

    // Reset badge when user is on the messages page
    useEffect(() => {
        if (location.pathname === '/client/messages') {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- reset volontaire du badge à l'arrivée sur la page messages
            setUnreadMsgCount(0)
        }
    }, [location.pathname])

    // Show toast + save to history (for CONSULTANT actions from DB)
    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9)
        const newToast = { id, message, type, created_at: new Date().toISOString() }
        setToasts(prev => [...prev, newToast])

        // Save to Client Local Toast History — ONLY consultant actions
        if (user) {
            try {
                const stored = localStorage.getItem(`eq_client_toast_history_${user.id}`)
                const history = stored ? JSON.parse(stored) : []
                const updated = [newToast, ...history].slice(0, 50)
                localStorage.setItem(`eq_client_toast_history_${user.id}`, JSON.stringify(updated))
                window.dispatchEvent(new Event('client_toast_history_updated'))
            } catch (e) {
                console.error("Error updating client toast history:", e)
            }
        }
        // No auto-dismiss
    }, [user])

    // Show toast only — does NOT save to history (for client's own actions or messages)
    const showToastOnly = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9)
        setToasts(prev => [...prev, { id, message, type, created_at: new Date().toISOString() }])
        // No auto-dismiss
    }, [])

    // Listen to custom local events (client's own actions) — only show, don't save to history
    useEffect(() => {
        const handleCustomToast = (e) => {
            if (e.detail) showToastOnly(e.detail.message, e.detail.type)
        }
        window.addEventListener('eq_show_client_toast', handleCustomToast)
        return () => window.removeEventListener('eq_show_client_toast', handleCustomToast)
    }, [showToastOnly])

    // Database Realtime Notifications Subscription
    useEffect(() => {
        if (!caseId) return

        const channel = supabase
            .channel(`client_topbar_notifs:${caseId}`)
            // 1. Listen to Consultant Actions → toast + saved to Historique Toasts
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'case_notifications',
                filter: `case_id=eq.${caseId}`
            }, (payload) => {
                const isConsultantAction = payload.new.type?.startsWith('consultant')
                if (isConsultantAction) {
                    showToast(payload.new.content, 'success')
                }
            })
            // 2. Listen to human messages from consultant → toast + badge cloche
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'case_messages',
                filter: `case_id=eq.${caseId}`
            }, (payload) => {
                const isFromMe = payload.new.sender_id === user.id
                // Filter [SYSTEM] and [Remarque] — remarques are already notified via case_notifications (consultant_remark)
                const isSystem = /^\[SYSTEM\]/i.test(payload.new.content || '')
                const isRemarque = /^\[Remarque/i.test(payload.new.content || '')
                const isMessagesPage = location.pathname === '/client/messages'

                if (!isFromMe && !isSystem && !isRemarque && !isMessagesPage) {
                    // Increment bell badge
                    setUnreadMsgCount(prev => prev + 1)
                    // Show toast (not saved to history — messages are NOT consultant actions)
                    showToastOnly(`💬 Nouveau message de votre consultant :\n${payload.new.content}`, 'info')
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [caseId, showToast, showToastOnly, user, location.pathname])

    const renderToasts = () => {
        return (
            <div className="fixed top-[76px] right-5 z-[9999] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: '24rem', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                {toasts.map(t => {
                    const isMessage = t.message?.startsWith('💬')
                    const iconMap = {
                        success: <CheckCircle className="h-5 w-5 text-[#cc6d3e]" />,
                        error: <XCircle className="h-5 w-5 text-rose-400" />,
                        warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
                        info: <Info className="h-5 w-5 text-[#cc6d3e]" />
                    }
                    const borderMap = {
                        success: 'border-l-4 border-l-[#cc6d3e] border-slate-800/80',
                        error: 'border-l-4 border-l-rose-500 border-slate-800/80',
                        warning: 'border-l-4 border-l-amber-500 border-slate-800/80',
                        info: isMessage
                            ? 'border-l-4 border-l-blue-400 border-slate-800/80'
                            : 'border-l-4 border-l-[#cc6d3e] border-slate-800/80'
                    }
                    const titleMap = {
                        success: 'Action consultant',
                        error: 'Erreur',
                        warning: 'Avertissement',
                        info: isMessage ? 'Nouveau message' : 'Notification'
                    }
                    const icon = iconMap[t.type] || iconMap.info
                    const borderClass = borderMap[t.type] || borderMap.info
                    const title = titleMap[t.type] || titleMap.info
                    const timeStr = t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    // Messages → navigate to messagerie | Actions consultant → navigate to historique
                    const navTarget = isMessage ? '/client/messages' : '/client/toasts-history'

                    return (
                        <div
                            key={t.id}
                            className={`pointer-events-auto flex gap-3 bg-slate-900/95 text-white rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-5 duration-300 w-80 sm:w-96 overflow-hidden ${borderClass}`}
                        >
                            {/* Clickable body */}
                            <button
                                onClick={() => {
                                    if (isMessage) setUnreadMsgCount(0)
                                    navigate(navTarget)
                                }}
                                className="flex-1 flex gap-3 p-4 text-left hover:bg-slate-800/40 transition-colors min-w-0"
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
                                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-semibold break-words">
                                        {t.message.length > 120 ? `${t.message.substring(0, 120)}...` : t.message}
                                    </div>
                                </div>
                            </button>
                            {/* Dismiss button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setToasts(prev => prev.filter(x => x.id !== t.id)); }}
                                className="flex-shrink-0 self-start mt-3 mr-3 text-slate-500 hover:text-white hover:bg-rose-600 transition-all p-1.5 rounded-lg"
                                aria-label="Fermer"
                                title="Fermer"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setShowMobileMenu(true)}
                    className="lg:hidden p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                    <Menu className="h-6 w-6" />
                </button>

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm">
                    {breadcrumbs.map((crumb, i) => (
                        <div key={i} className="flex items-center gap-2">
                            {i > 0 && <span className="text-gray-300 font-light">›</span>}
                            {crumb.path ? (
                                <button
                                    onClick={() => navigate(crumb.path)}
                                    className="text-gray-400 hover:text-[#cc6d3e] transition-colors font-medium cursor-pointer"
                                >
                                    {crumb.label}
                                </button>
                            ) : (
                                <span className="text-gray-800 font-bold">{crumb.label}</span>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            {/* Right: Actions & Consultant info */}
            <div className="flex items-center gap-4">
                {/* 🔔 Bell — Messages du consultant UNIQUEMENT */}
                <button
                    onClick={() => {
                        setUnreadMsgCount(0)
                        navigate('/client/messages')
                    }}
                    className={`relative p-2 transition-all rounded-xl border group shadow-sm cursor-pointer ${
                        unreadMsgCount > 0
                            ? 'bg-[#faf1ec] border-[#f5e2d6] text-[#cc6d3e]'
                            : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-[#cc6d3e] hover:bg-[#faf1ec] hover:border-[#f5e2d6]'
                    }`}
                    title="Messages de votre consultant"
                >
                    <Bell className={`h-5 w-5 transition-transform group-hover:scale-110 ${unreadMsgCount > 0 ? 'animate-bounce' : ''}`} />
                    {unreadMsgCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#cc6d3e] text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-orange-600/20 border-2 border-white animate-in zoom-in duration-300">
                            {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                        </span>
                    )}
                </button>

                {(consultant?.name || consultantName) && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 rounded-full border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Consultant</span>
                        <div className="h-6 w-6 rounded-full bg-[#cc6d3e] flex items-center justify-center text-white text-[9px] font-black relative overflow-visible">
                            {consultant?.avatar_url ? (
                                <img 
                                    src={consultant.avatar_url} 
                                    alt="Consultant Avatar" 
                                    className="h-full w-full object-cover rounded-full" 
                                />
                            ) : (
                                <span>{(consultant?.name || consultantName)[0]?.toUpperCase()}</span>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border border-white flex items-center justify-center">
                                <Check className="h-1.5 w-1.5 text-white stroke-[5px]" />
                            </div>
                        </div>
                        <span className="text-xs font-black text-gray-800">{consultant?.name || consultantName}</span>
                    </div>
                )}
                
                {onContact && (
                    <button
                        onClick={onContact}
                        className="flex items-center gap-2 px-4 py-1.5 bg-[#faf1ec] hover:bg-[#f8e9df] text-[#cc6d3e] rounded-full text-xs font-black transition-all border border-[#f5e2d6] shadow-sm cursor-pointer"
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Contacter
                    </button>
                )}
            </div>
            {renderToasts()}
        </header>
    )
}
