import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    MessageSquare, 
    BellRing, 
    Clock, 
    CheckCircle, 
    ArrowRight, 
    Filter,
    FileText,
    TrendingUp,
    AlertCircle,
    Search
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'

export default function ConsultantNotifications() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState([])
    const [casesCount, setCasesCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    useEffect(() => {
        if (user) {
            fetchNotifications()
            
            // Subscribe to new notifications
            const channel = supabase
                .channel('global_notifs')
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'case_messages' 
                }, () => {
                    fetchNotifications()
                })
                .on('postgres_changes', { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'case_messages' 
                }, () => {
                    fetchNotifications()
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [user])

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            // [AUTO-REPAIR] Fix old cases missing consultant_id
            try {
                const { data: missingCases } = await supabase
                    .from('cases')
                    .select('id')
                    .is('consultant_id', null);
                
                if (missingCases && missingCases.length > 0) {
                    console.log("[AUTO-REPAIR] Found cases without consultant_id:", missingCases.length);
                    for (const c of missingCases) {
                        await supabase.from('cases').update({ consultant_id: user.id }).eq('id', c.id);
                    }
                }
            } catch (e) { console.warn("[AUTO-REPAIR] Failed to repair cases:", e); }

            // 1. Fetch case IDs for this consultant (Simple select, no joins to avoid RLS drops)
            const { data: casesData } = await supabase
                .from('cases')
                .select('id, tenant_id')
                .eq('consultant_id', user.id)

            const caseIds = casesData?.map(c => c.id) || []
            if (caseIds.length === 0) {
                setNotifications([])
                setLoading(false)
                return
            }

            // 2. Fetch messages for these cases
            const { data, error } = await supabase
                .from('case_messages')
                .select('id, content, created_at, read_at, case_id, sender_id')
                .in('case_id', caseIds)
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) throw error
            
            // 3. Resolve unique sender IDs to fetch profiles (More reliable for names)
            const senderIds = [...new Set(data?.map(n => n.sender_id))].filter(Boolean)
            const profilesMap = {}
            
            if (senderIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, commercial_name')
                    .in('id', senderIds)
                
                profilesData?.forEach(p => {
                    const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
                    profilesMap[p.id] = fullName || p.commercial_name || 'Client'
                })
            }

            // 4. Process and set state
            const processed = (data || []).map(n => {
                const profileName = profilesMap[n.sender_id] || 'Client'

                return {
                    ...n,
                    is_read: !!n.read_at,
                    content: n.content.replace(/\[SYSTEM\]/i, '').trim(),
                    clientName: profileName
                }
            })

            setNotifications(processed)
        } catch (err) {
            console.error('Error fetching notifications:', err)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (caseId) => {
        const now = new Date().toISOString()
        await supabase
            .from('case_messages')
            .update({ read_at: now })
            .eq('case_id', caseId)
            .neq('sender_id', user.id)
            .is('read_at', null)
            
        setNotifications(prev => prev.map(n => n.case_id === caseId ? { ...n, is_read: true, read_at: now } : n))
    }

    const [filter, setFilter] = useState('all')

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read
        return true
    })

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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                                    <BellRing className="h-5 w-5 text-white animate-pulse" />
                                </div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Vibrations Clients</h1>
                            </div>
                            <p className="text-gray-500 font-medium">Suivez en temps réel chaque signe envoyé par vos clients.</p>
                        </div>

                        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                            <button 
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                                    filter === 'all' 
                                        ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                                        : 'text-gray-400 font-bold hover:bg-gray-50'
                                }`}
                            >
                                Tout
                            </button>
                            <button 
                                onClick={() => setFilter('unread')}
                                className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                                    filter === 'unread' 
                                        ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                                        : 'text-gray-400 font-bold hover:bg-gray-50'
                                }`}
                            >
                                Non lus
                            </button>
                            <div className="w-px h-4 bg-gray-100 mx-1"></div>
                            <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
                                <Filter className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading && notifications.length === 0 ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-gray-50"></div>
                            ))
                        ) : filteredNotifications.length === 0 ? (
                            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/40 p-20 text-center">
                                <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MessageSquare className="h-10 w-10 text-gray-200" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 mb-2">Silence radio...</h2>
                                <p className="text-gray-400 max-w-sm mx-auto">
                                    {filter === 'unread' 
                                        ? "Vous avez lu tous vos messages ! Félicitations." 
                                        : "Aucun message ou signe récent de la part de vos clients. Profitez-en pour avancer sur vos dossiers !"}
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map((notif) => {
                                const isAction = notif.content.startsWith('📝') || notif.content.startsWith('📁') || notif.content.startsWith('🔐') || notif.content.startsWith('👤') || notif.content.startsWith('🏆') || notif.content.startsWith('❌')
                                
                                const getClientTheme = (id) => {
                                    const themes = [
                                        { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
                                        { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
                                        { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
                                        { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
                                        { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
                                        { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100' },
                                        { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100' }
                                    ]
                                    const hash = (id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
                                    return themes[hash % themes.length]
                                }

                                const theme = getClientTheme(notif.case_id)

                                return (
                                    <div 
                                        key={notif.id}
                                        className={`group relative overflow-hidden bg-white rounded-3xl border-2 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-purple-100 ${
                                            notif.is_read ? 'border-gray-50' : 'border-purple-100 shadow-xl shadow-purple-50'
                                        }`}
                                    >
                                        {!notif.is_read && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-600"></div>
                                        )}

                                        <div className="p-6 flex items-start gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${theme.bg} ${theme.text}`}>
                                                {isAction ? <FileText className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                                            </div>

                                            <div className="flex-1 min-w-0 pr-12">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border}`}>
                                                        {notif.clientName}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400">
                                                        • {new Date(notif.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {!notif.is_read && <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse"></span>}
                                                </div>
                                                <p className={`text-sm leading-relaxed whitespace-pre-line ${notif.is_read ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                                                    {notif.content}
                                                </p>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    markAsRead(notif.case_id)
                                                    
                                                    // Smart Redirection logic
                                                    const content = notif.content
                                                    let targetUrl = `/consultant/case/${notif.case_id}`
                                                    
                                                    if (content.includes('Indicateur')) {
                                                        const match = content.match(/Indicateur\s+(\d+)/i)
                                                        targetUrl += `?tab=suivi_rno${match ? `&indicatorId=${match[1]}` : ''}`
                                                    } else if (content.includes('Quiz')) {
                                                        const match = content.match(/Critère\s+(\d+)/i)
                                                        targetUrl += `?tab=suivi_rno${match ? `&criterionId=${match[1]}` : ''}`
                                                    } else if (!notif.content.startsWith('📝') && !notif.content.startsWith('📁')) {
                                                        // Likely a chat message
                                                        targetUrl += `?tab=messagerie`
                                                    }
                                                    
                                                    navigate(targetUrl)
                                                }}
                                                className="absolute right-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-purple-600 hover:text-white transition-all group-hover:bg-purple-100 group-hover:text-purple-600"
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
