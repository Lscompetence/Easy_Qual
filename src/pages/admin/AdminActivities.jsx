import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Bell, ArrowLeft, Search, Calendar, Filter, Activity, CreditCard, UserPlus, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'

export default function AdminActivities() {
    const [activities, setActivities] = useState([])
    const [profiles, setProfiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType] = useState('all') // 'all', 'credits', 'users', 'cases'
    const navigate = useNavigate()

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('admin_notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(300);

            if (!error && data) {
                setActivities(data)
            }
            setLoading(false)
        }

        const fetchProfiles = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, email, avatar_url')
                .eq('role', 'consultant')
            if (data) {
                setProfiles(data)
            }
        }

        fetchAll()
        fetchProfiles()

        // Realtime
        const channel = supabase
            .channel('admin_notifications_all')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, (payload) => {
                setActivities(prev => [payload.new, ...prev])
            })
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [])

    const getIconForType = (title) => {
        const t = (title || '').toLowerCase()
        if (t.includes('crédit') || t.includes('paiement') || t.includes('achat')) return <CreditCard className="h-5 w-5 text-green-500" />
        if (t.includes('consultant') || t.includes('inscription')) return <UserPlus className="h-5 w-5 text-blue-500" />
        if (t.includes('dossier') || t.includes('réclamation')) return <FileText className="h-5 w-5 text-purple-500" />
        return <Bell className="h-5 w-5 text-gray-500" />
    }

    const getBadgeColor = (title) => {
        const t = (title || '').toLowerCase()
        if (t.includes('crédit') || t.includes('paiement') || t.includes('achat')) return 'bg-green-100 text-green-800 border-green-200'
        if (t.includes('consultant') || t.includes('inscription')) return 'bg-blue-100 text-blue-800 border-blue-200'
        if (t.includes('dossier') || t.includes('réclamation')) return 'bg-purple-100 text-purple-800 border-purple-200'
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const filtered = activities.filter(a => {
        const matchesSearch = (a.title?.toLowerCase().includes(searchTerm.toLowerCase()) || a.content?.toLowerCase().includes(searchTerm.toLowerCase()))
        
        let matchesFilter = true
        const t = (a.title || '').toLowerCase()
        if (filterType === 'credits') matchesFilter = t.includes('crédit') || t.includes('paiement') || t.includes('achat')
        if (filterType === 'users') matchesFilter = t.includes('consultant') || t.includes('inscription')
        if (filterType === 'cases') matchesFilter = t.includes('dossier') || t.includes('réclamation')

        return matchesSearch && matchesFilter
    })

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans">
            <header className="bg-white/80 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.02)] border-b border-slate-100 sticky top-0 z-[60]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16 gap-4">
                        <Logo size="small" />
                        <span className="hidden xs:inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-100">
                            Admin
                        </span>
                    </div>
                </div>
            </header>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <button 
                            onClick={() => navigate('/admin/dashboard')}
                            className="text-slate-500 hover:text-blue-600 flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-wider transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" /> Retour au Tableau de bord
                        </button>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <Activity className="h-8 w-8 text-blue-600" />
                            Historique des Activités
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm max-w-2xl">
                            Consultez en temps réel toutes les actions importantes de la plateforme (achats de crédits, inscriptions, nouveaux dossiers...).
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Rechercher une activité..."
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder-slate-400 shadow-sm"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                            <Activity className="h-12 w-12 text-slate-200 mb-3" />
                            <p className="font-bold">Aucune activité trouvée</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filtered.map(activity => {
                                const consultant = profiles.find(p => p.id === activity.metadata?.consultant_id)
                                return (
                                    <div key={activity.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-start gap-5">
                                        {/* Avatar / Icon wrapper */}
                                        {consultant ? (
                                            consultant.avatar_url ? (
                                                <img 
                                                    src={consultant.avatar_url} 
                                                    alt="Avatar" 
                                                    className="h-11 w-11 rounded-full border border-slate-100 object-cover bg-blue-50 shadow-sm flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-650 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-100">
                                                    {consultant.first_name?.[0]}{consultant.last_name?.[0] || consultant.email[0].toUpperCase()}
                                                </div>
                                            )
                                        ) : (
                                            <div className="p-3 bg-slate-50 text-slate-500 border border-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                {getIconForType(activity.title)}
                                            </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                <h3 className="font-black text-slate-800 text-base">{activity.title}</h3>
                                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm w-fit">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(activity.created_at).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-650 font-medium leading-relaxed">
                                                {activity.content}
                                            </p>
                                            <div className="mt-3">
                                                <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-md border ${getBadgeColor(activity.title)}`}>
                                                    {activity.title?.split(' ')[0] || 'Système'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
