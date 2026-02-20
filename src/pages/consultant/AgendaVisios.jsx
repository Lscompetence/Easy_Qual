import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { Video, Calendar as CalendarIcon, Clock, User, ArrowRight, ExternalLink } from 'lucide-react'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'
import { useNavigate } from 'react-router-dom'

export default function AgendaVisios() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [visios, setVisios] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) fetchVisios()
    }, [user])

    const fetchVisios = async () => {
        try {
            setLoading(true)
            const { data: casesData, error: casesError } = await supabase.from('cases').select('id, tenants(name)')
            if (casesError) throw casesError
            const caseIds = casesData.map(c => c.id)

            // Fetch ONLY Audit Blanc events
            const { data: eventsData, error: eventsError } = await supabase
                .from('case_events')
                .select('*')
                .in('case_id', caseIds)
                .ilike('title', '%audit blanc%') // Filter strictly for Audit Blanc
                .neq('status', 'done')
                .order('event_date', { ascending: true })

            if (eventsError) throw eventsError

            const formattedVisios = eventsData.map(event => {
                const caseInfo = casesData.find(c => c.id === event.case_id)
                return {
                    ...event,
                    clientName: caseInfo?.tenants?.name || 'Client Inconnu'
                }
            })
            setVisios(formattedVisios)
        } catch (error) {
            console.error('Error fetching visios:', error)
        } finally {
            setLoading(false)
        }
    }

    // Stats for Top Cards
    const stats = {
        total: visios.length,
        thisWeek: visios.filter(v => {
            const d = new Date(v.event_date)
            const now = new Date()
            const nextWeek = new Date()
            nextWeek.setDate(now.getDate() + 7)
            return d >= now && d <= nextWeek
        }).length,
        missingLink: visios.filter(v => !v.visio_link).length
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans flex text-slate-800">
            <ConsultantSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <ConsultantTopBar />

                <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[2000px] mx-auto w-full">

                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Agenda Visios</h1>
                        <p className="mt-1 text-sm text-gray-500">Gérez vos sessions d'Audit Blanc et liens visio.</p>
                    </div>

                    {/* KPI Cards Row - Matching Dashboard Style */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1: Total à venir */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                                    <Video className="h-6 w-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Audits Blancs à venir</p>
                            </div>
                        </div>

                        {/* Card 2: Cette semaine */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full uppercase">7 Jours</span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.thisWeek}</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Prévus cette semaine</p>
                            </div>
                        </div>

                        {/* Card 3: Liens manquants */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-50 rounded-lg text-red-600">
                                    <ExternalLink className="h-6 w-6" />
                                </div>
                                {stats.missingLink > 0 && (
                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full uppercase">Action requise</span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.missingLink}</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Liens Visio manquants</p>
                            </div>
                        </div>
                    </div>

                    {/* Table Section - Matching Dashboard Style */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-gray-900">Audits Blancs à Planifier / Lancer</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                                        <th className="pb-3 pl-2">Client</th>
                                        <th className="pb-3">Date Prévue</th>
                                        <th className="pb-3">Statut Lien</th>
                                        <th className="pb-3 text-right pr-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="space-y-4">
                                    {loading ? (
                                        <tr><td colSpan="4" className="text-center py-4 text-sm text-gray-500">Chargement...</td></tr>
                                    ) : visios.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-4 text-sm text-gray-500">Aucun audit blanc en attente.</td></tr>
                                    ) : (
                                        visios.map((event) => (
                                            <tr
                                                key={event.id}
                                                onClick={() => navigate(`/consultant/case/${event.case_id}`)}
                                                className="group hover:bg-gray-50 transition-colors rounded-lg cursor-pointer"
                                            >
                                                <td className="py-6 pl-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold mr-4 uppercase shadow-sm">
                                                            {event.clientName?.substring(0, 2) || 'UK'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-0.5">
                                                                {event.clientName}
                                                            </span>
                                                            <span className="text-xs text-gray-400 font-medium">
                                                                {event.title}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                        {new Date(event.event_date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                                                    </div>
                                                </td>
                                                <td className="py-6">
                                                    {event.visio_link ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                            ● Lien Ajouté
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                                                            ● Lien Manquant
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-6 text-right pr-2">
                                                    {event.visio_link ? (
                                                        <a
                                                            href={event.visio_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                                        >
                                                            <Video className="h-3 w-3" /> Lancer Visio
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs font-bold text-blue-600 flex items-center justify-end gap-1">
                                                            Voir Dossier <ArrowRight className="h-3 w-3" />
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    )
}
