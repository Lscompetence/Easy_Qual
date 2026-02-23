import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { Video, Calendar as CalendarIcon, Clock, User, ArrowRight, ExternalLink, Plus } from 'lucide-react'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'
import { useNavigate } from 'react-router-dom'

export default function AgendaVisios() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [clientRows, setClientRows] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) fetchData()
    }, [user])

    const fetchData = async () => {
        try {
            setLoading(true)

            // 1. Fetch ALL cases for this consultant
            const { data: casesData, error: casesError } = await supabase
                .from('cases')
                .select('id, category, status, tenants(name)')
                .order('created_at', { ascending: false })

            if (casesError) throw casesError

            const caseIds = casesData.map(c => c.id)

            // 2. Fetch ALL Audit Blanc events across cases
            let auditBlancEvents = []
            if (caseIds.length > 0) {
                const { data: eventsData, error: eventsError } = await supabase
                    .from('case_events')
                    .select('*')
                    .in('case_id', caseIds)
                    .ilike('title', '%audit blanc%')
                    .order('event_date', { ascending: true })

                if (eventsError) throw eventsError
                auditBlancEvents = eventsData || []
            }

            // 3. Merge: for each case, attach its Audit Blanc event (if any)
            const rows = casesData.map(c => {
                const auditEvent = auditBlancEvents.find(e => e.case_id === c.id)
                return {
                    caseId: c.id,
                    clientName: c.tenants?.name || 'Client Inconnu',
                    category: c.category,
                    status: c.status,
                    auditEvent: auditEvent || null
                }
            })

            setClientRows(rows)
        } catch (error) {
            console.error('Error fetching agenda data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Stats
    const stats = {
        total: clientRows.length,
        scheduled: clientRows.filter(r => r.auditEvent).length,
        missingLink: clientRows.filter(r => r.auditEvent && !r.auditEvent.visio_link).length,
        notScheduled: clientRows.filter(r => !r.auditEvent).length
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
                                <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Dossiers clients</p>
                            </div>
                        </div>

                        {/* Card 2: Audits Blancs planifiés */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                                    <Video className="h-6 w-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.scheduled}</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Audits Blancs planifiés</p>
                            </div>
                        </div>

                        {/* Card 3: Not scheduled */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                                    <Clock className="h-6 w-6" />
                                </div>
                                {stats.notScheduled > 0 && (
                                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full uppercase">À planifier</span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.notScheduled}</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Non planifiés</p>
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
                                <p className="text-xs font-medium text-gray-500 mt-1">Liens Visio manquants</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-gray-900">Audits Blancs — Tous les clients</h3>
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
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="4" className="text-center py-10 text-sm text-gray-400">Chargement...</td></tr>
                                    ) : clientRows.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-10 text-sm text-gray-400">Aucun dossier client.</td></tr>
                                    ) : (
                                        clientRows.map((row) => {
                                            const hasEvent = !!row.auditEvent
                                            const hasLink = hasEvent && !!row.auditEvent.visio_link

                                            return (
                                                <tr
                                                    key={row.caseId}
                                                    onClick={() => navigate(`/consultant/case/${row.caseId}`)}
                                                    className="group hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-b-0"
                                                >
                                                    {/* Client */}
                                                    <td className="py-5 pl-4">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold mr-4 uppercase shadow-sm">
                                                                {row.clientName?.substring(0, 2) || 'UK'}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-0.5">
                                                                    {row.clientName}
                                                                </span>
                                                                <span className="text-xs text-gray-400 font-medium">
                                                                    <span className="font-semibold text-gray-500 uppercase text-[10px] mr-1">
                                                                        {row.category === 'multi-site' ? 'Multi-site' : 'Mono-site'}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Date */}
                                                    <td className="py-5">
                                                        {hasEvent ? (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                                {new Date(row.auditEvent.event_date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-300 italic">Non planifié</span>
                                                        )}
                                                    </td>

                                                    {/* Statut Lien */}
                                                    <td className="py-5">
                                                        {hasEvent ? (
                                                            hasLink ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                                    ● Lien Ajouté
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                                                                    ● Lien Manquant
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400">
                                                                — Pas d'audit
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Action */}
                                                    <td className="py-5 text-right pr-2">
                                                        {hasLink ? (
                                                            <a
                                                                href={row.auditEvent.visio_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                                            >
                                                                <Video className="h-3 w-3" /> Lancer Visio
                                                            </a>
                                                        ) : hasEvent ? (
                                                            <span className="text-xs font-bold text-blue-600 flex items-center justify-end gap-1">
                                                                Ajouter lien <ArrowRight className="h-3 w-3" />
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-amber-600 flex items-center justify-end gap-1">
                                                                <Plus className="h-3 w-3" /> Planifier
                                                            </span>
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
