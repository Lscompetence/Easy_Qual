import { useState } from 'react'
import { Calendar as CalendarIcon, Clock, Video, Plus, ChevronLeft, ChevronRight, MoreHorizontal, Users, Link as LinkIcon } from 'lucide-react'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'

export default function AgendaVisios() {
    // Mock Data for "Prochainement"
    const upcomingEvents = [
        {
            id: 1,
            type: 'MENTORAT',
            time: 'DANS 30 MIN',
            title: 'Point Mensuel - Skillz',
            platform: 'Google Meet',
            attendees: ['SA'],
            color: 'blue'
        },
        {
            id: 2,
            type: 'AUDIT BLANC',
            time: 'DEMAIN 10H',
            title: 'Préparation Audit - EduTech',
            platform: 'Zoom',
            attendees: [],
            color: 'purple'
        }
    ]

    // Mock Data for Calendar Grid
    const weekDays = [
        { name: 'LUN 16', events: [{ id: 1, title: '14:00 Mentorat', color: 'bg-blue-50 text-blue-700 border-blue-100' }] },
        { name: 'MAR 17', events: [] },
        {
            name: 'MER 18', events: [
                { id: 2, title: '10:00 Audit Blanc', color: 'bg-purple-50 text-purple-700 border-purple-100' },
                { id: 3, title: '15:30 Suivi', color: 'bg-blue-50 text-blue-700 border-blue-100' }
            ]
        },
        { name: 'JEU 19', events: [{ id: 4, title: '11:00 Lancement', color: 'bg-blue-100 text-blue-800 border-blue-200' }] }, // Highlighted in image
        { name: 'VEN 20', events: [{ id: 5, title: '09:00 Admin', color: 'bg-gray-50 text-gray-500 border-gray-100' }] },
    ]

    return (
        <div className="bg-gray-50 min-h-screen font-sans flex text-slate-800">
            <ConsultantSidebar />

            <div className="flex-1 ml-64 flex flex-col">
                <ConsultantTopBar onNewFolder={() => { }} />

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Agenda Visios</h1>
                            <p className="mt-1 text-sm text-gray-500">Gérez vos sessions de mentorat et audits blancs.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                                <LinkIcon className="h-4 w-4" />
                                Synchroniser Google
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Planifier Visio
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN: Upcoming */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px]">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-6">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                    Prochainement
                                </h3>

                                <div className="space-y-4">
                                    {upcomingEvents.map((evt, idx) => (
                                        <div
                                            key={evt.id}
                                            className={`p-4 rounded-xl border transition-all hover:shadow-md ${idx === 0
                                                    ? 'bg-blue-50 border-blue-100'
                                                    : 'bg-white border-gray-100'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${evt.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                                                    }`}>
                                                    {evt.type} • {evt.time}
                                                </span>
                                                {idx !== 0 && (
                                                    <button className="text-gray-300 hover:text-gray-500">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {idx === 0 && (
                                                    <button className="px-3 py-1 bg-white text-blue-600 text-[10px] font-bold rounded border border-blue-100 shadow-sm hover:bg-blue-50">
                                                        Rejoindre
                                                    </button>
                                                )}
                                            </div>

                                            <h4 className="font-bold text-gray-900 mb-2">{evt.title}</h4>

                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-3">
                                                <Video className="h-3 w-3" />
                                                {evt.platform}
                                            </div>

                                            {evt.attendees.length > 0 && (
                                                <div className="flex items-center -space-x-2">
                                                    {evt.attendees.map((att, i) => (
                                                        <div key={i} className="h-6 w-6 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-blue-800">
                                                            {att}
                                                        </div>
                                                    ))}
                                                    <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-400">
                                                        <Plus className="h-3 w-3" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Calendar Grid */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px]">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-bold text-gray-900">Février 2026</h3>
                                    <div className="flex items-center gap-2">
                                        <button className="p-1 rounded-full hover:bg-gray-100 text-gray-400"><ChevronLeft className="h-4 w-4" /></button>
                                        <button className="p-1 rounded-full hover:bg-gray-100 text-gray-400"><ChevronRight className="h-4 w-4" /></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-5 gap-4">
                                    {weekDays.map((day, i) => (
                                        <div key={i} className="flex flex-col gap-4">
                                            <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                                {day.name}
                                            </div>
                                            <div className="flex-1 space-y-3 min-h-[300px] border-l border-gray-50 pl-2 border-dashed">
                                                {day.events.map((e, j) => (
                                                    <div key={j} className={`p-2 rounded text-[10px] font-bold border truncate ${e.color} cursor-pointer hover:opacity-80 transition-opacity`}>
                                                        {e.title}
                                                    </div>
                                                ))}
                                                {/* Dotted lines or empty slots filler could go here */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
