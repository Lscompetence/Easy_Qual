import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'
import { MessageSquare, Search, Clock, ArrowRight, User } from 'lucide-react'

export default function ConsultantMessages() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [conversations, setConversations] = useState([])
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')


    const fetchConversations = useCallback(async () => {
        try {
            // Get all cases for this consultant
            const { data: casesData } = await supabase
                .from('cases')
                .select('id, tenants(commercial_name, first_name, last_name)')
            
            if (!casesData) return

            // For each case, fetch the last message and unread count
            const convs = await Promise.all(casesData.map(async (c) => {
                const { data: lastMsg } = await supabase
                    .from('case_messages')
                    .select('content, created_at, sender_id, read_at')
                    .eq('case_id', c.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                const { count: unreadCount } = await supabase
                    .from('case_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('case_id', c.id)
                    .is('read_at', null)
                    .neq('sender_id', user.id)

                return {
                    case_id: c.id,
                    clientName: c.tenants?.commercial_name || `${c.tenants?.first_name} ${c.tenants?.last_name}`,
                    lastMessage: lastMsg?.content || 'Aucun message encore.',
                    lastTime: lastMsg?.created_at,
                    unreadCount: unreadCount || 0
                }
            }))

            // Sort by last message time
            setConversations(convs.sort((a, b) => new Date(b.lastTime || 0) - new Date(a.lastTime || 0)))
        } catch (err) {
            console.error('Error fetching conversations:', err)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (user) {
            fetchConversations()
            
            const channel = supabase
                .channel('global_chat_sync')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'case_messages' }, () => {
                    fetchConversations()
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [user, fetchConversations])


    const filteredConvs = conversations.filter(c => 
        c.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="bg-gray-50 min-h-screen flex font-sans">
            <ConsultantSidebar isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
            
            <div className="flex-1 flex flex-col min-w-0">
                <ConsultantTopBar 
                    showMobileMenu={showMobileMenu} 
                    setShowMobileMenu={setShowMobileMenu}
                    showSearch={false}
                />

                <main className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto w-full">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Centre de Messagerie</h1>
                            <p className="text-gray-500 font-medium">Gérez vos conversations privées avec vos clients.</p>
                        </div>
                        
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Rechercher un client..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="grid grid-cols-1 gap-4">
                        {loading && conversations.length === 0 ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-28 bg-white rounded-3xl animate-pulse border border-gray-50 shadow-sm"></div>
                            ))
                        ) : filteredConvs.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare className="h-8 w-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Aucune conversation trouvée</h3>
                                <p className="text-gray-400">Lancez une discussion depuis un dossier client.</p>
                            </div>
                        ) : (
                            filteredConvs.map((conv) => (
                                <div 
                                    key={conv.case_id}
                                    onClick={() => navigate(`/consultant/case/${conv.case_id}`)}
                                    className="group bg-white p-6 rounded-[32px] border-2 border-transparent hover:border-purple-100 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-all cursor-pointer flex items-center gap-5 relative overflow-hidden"
                                >
                                    {/* Unread Indicator */}
                                    {conv.unreadCount > 0 && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>
                                    )}

                                    {/* Avatar */}
                                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                                        conv.unreadCount > 0 ? 'bg-blue-50' : 'bg-gray-50'
                                    }`}>
                                        <User className={`h-8 w-8 ${conv.unreadCount > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <h3 className="text-lg font-black text-gray-900 truncate pr-4">{conv.clientName}</h3>
                                            {conv.lastTime && (
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {new Date(conv.lastTime).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                </div>
                                            )}
                                        </div>
                                        <p className={`text-sm line-clamp-1 transition-colors ${
                                            conv.unreadCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium'
                                        }`}>
                                            {conv.lastMessage}
                                        </p>
                                    </div>

                                    {/* Badge & Arrow */}
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        {conv.unreadCount > 0 && (
                                            <div className="h-6 min-w-[24px] px-1.5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-200">
                                                {conv.unreadCount}
                                            </div>
                                        )}
                                        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                            <ArrowRight className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
