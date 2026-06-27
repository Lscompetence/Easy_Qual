import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Bell, ArrowLeft, Search, Calendar, Filter, Activity, CreditCard, UserPlus, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'

export default function AdminActivities() {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all') // 'all', 'credits', 'users', 'cases'
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
        fetchAll()

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
        <div className="min-h-screen bg-slate-50 font-sans">
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-[60]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16 gap-4">
                        <Logo size="small" />
                        <span className="hidden xs:inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                            Admin
                        </span>
                    </div>
                </div>
            </header>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <button 
                            onClick={() => navigate('/admin/dashboard')}
                            className="text-gray-500 hover:text-blue-600 flex items-center gap-2 mb-4 text-sm font-bold transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" /> Retour au Tableau de bord
                        </button>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Activity className="h-8 w-8 text-blue-600" />
                            Historique des Activités
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm max-w-2xl">
                            Consultez en temps réel toutes les actions importantes de la plateforme (achats de crédits, inscriptions, nouveaux dossiers...).
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Rechercher une activité..."
                                className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                            <Activity className="h-12 w-12 text-gray-300 mb-3" />
                            <p className="font-bold">Aucune activité trouvée</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filtered.map(activity => (
                                <div key={activity.id} className="p-6 hover:bg-slate-50 transition-colors flex items-start gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                                        {getIconForType(activity.title)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <h3 className="font-black text-gray-900 text-base">{activity.title}</h3>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm w-fit">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(activity.created_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 font-medium leading-relaxed bg-white/50 rounded-lg">
                                            {activity.content}
                                        </p>
                                        <div className="mt-3">
                                            <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-md border ${getBadgeColor(activity.title)}`}>
                                                {activity.title?.split(' ')[0] || 'Système'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
