import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { Video, Calendar as CalendarIcon, Clock, User, ArrowRight, ExternalLink, Plus, MessageSquare } from 'lucide-react'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'
import { useNavigate } from 'react-router-dom'

export default function AgendaVisios() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [events, setEvents] = useState([])
    const [casesCount, setCasesCount] = useState(0)
    const [casesWithoutMeetings, setCasesWithoutMeetings] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    useEffect(() => {
        if (user) fetchData()
    }, [user])

    const fetchData = async () => {
        try {
            setLoading(true)

            // 1. Fetch all cases for count
            const { data: casesData, error: casesError } = await supabase
                .from('cases')
                .select('id, category, status, tenants(name)')
                .order('created_at', { ascending: false })

            if (casesError) throw casesError

            // 2. Fetch events (we can just fetch all events from the user's cases where event_type is 'meeting' or visio_link is present)
            const caseIds = casesData.map(c => c.id)
            let fetchedEvents = []
            
            if (caseIds.length > 0) {
                const { data: eventsData, error: eventsError } = await supabase
                    .from('case_events')
                    .select(`
                        id, case_id, title, event_date, visio_link, event_type, status,
                        cases ( category, status, tenants(name) )
                    `)
                    .in('case_id', caseIds)
                    .order('event_date', { ascending: true })

                if (eventsError) throw eventsError
                
                fetchedEvents = eventsData.filter(e => e.event_type === 'meeting' || e.visio_link)
            }

            // Calculate which cases don't have ANY meeting
            const casesWithMeetings = new Set(fetchedEvents.map(e => e.case_id))
            const without = casesData.filter(c => !casesWithMeetings.has(c.id)).length

            setCasesCount(casesData.length)
            setCasesWithoutMeetings(without)
            setEvents(fetchedEvents)
        } catch (error) {
            console.error('Error fetching agenda data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Stats
    const stats = {
        totalCases: casesCount,
        scheduledMeetings: events.length,
        notScheduledCases: casesWithoutMeetings,
        missingLink: events.filter(e => !e.visio_link).length
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans flex text-slate-800">
            <ConsultantSidebar isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
            <div className="flex-1 flex flex-col min-w-0">
                <ConsultantTopBar
                    showMobileMenu={showMobileMenu}
                    setShowMobileMenu={setShowMobileMenu}
                />

                <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[2000px] mx-auto w-full">

                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Agenda Visios & Réunions</h1>
                        <p className="mt-1 text-sm text-gray-500">Gérez vos réunions planifiées avec vos clients et lancez vos visios.</p>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Card 1: Total clients */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                    <User className="h-6 w-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.totalCases}</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Dossiers clients</p>
                            </div>
                        </div>

                        {/* Card 2: Réunions planifiées */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                                    <CalendarIcon className="h-6 w-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.scheduledMeetings}</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Réunions au total</p>
                            </div>
                        </div>

                        {/* Card 3: Not scheduled */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                                    <Clock className="h-6 w-6" />
                                </div>
                                {stats.notScheduledCases > 0 && (
                                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full uppercase">À relancer</span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.notScheduledCases}</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Dossiers sans réunion</p>
                            </div>
                        </div>

                        {/* Card 4: Liens manquants */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-50 rounded-lg text-red-600">
                                    <ExternalLink className="h-6 w-6" />
                                </div>
                                {stats.missingLink > 0 && (
                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full uppercase">Action</span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.missingLink}</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Réunions sans lien Visio</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-gray-900">Agenda des Réunions & Visios</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                                        <th className="pb-3 pl-2">Client</th>
                                        <th className="pb-3">Réunion</th>
                                        <th className="pb-3">Date Prévue</th>
                                        <th className="pb-3">Statut Lien</th>
                                        <th className="pb-3 text-right pr-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center py-10 text-sm text-gray-400">Chargement...</td></tr>
                                    ) : events.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-16">
                                                <div className="flex flex-col items-center justify-center text-center">
                                                    <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                                        <CalendarIcon className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Aucune réunion planifiée</h3>
                                                    <p className="text-sm text-gray-500 max-w-sm mb-6">
                                                        Vous n'avez pas encore programmé de réunion ou d'audit blanc dans vos dossiers.
                                                    </p>
                                                    <button 
                                                        onClick={() => navigate('/consultant/cases')}
                                                        className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-sm"
                                                    >
                                                        Voir mes dossiers
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        events.map((ev) => {
                                            const clientName = ev.cases?.tenants?.name || 'Client Inconnu'
                                            const isPast = ev.event_date && new Date(ev.event_date) < new Date()
                                            return (
                                                <tr
                                                    key={ev.id}
                                                    onClick={() => navigate(`/consultant/case/${ev.case_id}`)}
                                                    className="group hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-b-0"
                                                >
                                                    {/* Client */}
                                                    <td className="py-5 pl-4">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold mr-4 uppercase shadow-sm flex-shrink-0">
                                                                {clientName.substring(0, 2) || 'UK'}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-0.5">
                                                                    {clientName}
                                                                </span>
                                                                <span className="text-xs text-gray-400 font-medium">
                                                                    <span className="font-semibold text-gray-500 uppercase text-[10px] mr-1">
                                                                        {ev.cases?.category === 'multi-site' ? 'Multi-site' : 'Mono-site'}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Réunion */}
                                                    <td className="py-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 rounded-lg bg-gray-100 text-gray-500">
                                                                <MessageSquare className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-700">
                                                                {ev.title || 'Réunion'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Date */}
                                                    <td className="py-5">
                                                        {ev.event_date ? (
                                                            <div className="flex flex-col">
                                                                <span className={`text-sm font-bold ${isPast ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                    {new Date(ev.event_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </span>
                                                                <span className="text-xs font-medium text-gray-500">
                                                                    à {new Date(ev.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic">Date à définir</span>
                                                        )}
                                                    </td>

                                                    {/* Statut Lien */}
                                                    <td className="py-5">
                                                        {ev.visio_link ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                                ● Lien disponible
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                                ● Lien manquant
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Action */}
                                                    <td className="py-5 text-right pr-2">
                                                        {ev.visio_link ? (
                                                            <a
                                                                href={ev.visio_link.startsWith('http') ? ev.visio_link : `https://${ev.visio_link}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                                                            >
                                                                <Video className="h-3 w-3" /> Rejoindre la Visio
                                                            </a>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    navigate(`/consultant/case/${ev.case_id}`)
                                                                }}
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                                            >
                                                                Ajouter un lien
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })
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
