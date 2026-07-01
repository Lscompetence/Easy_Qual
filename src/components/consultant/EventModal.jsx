/* eslint-disable */
import { useState, useEffect } from 'react'
import { X, Calendar, Video, Type, AlignLeft } from 'lucide-react'

export default function EventModal({ isOpen, onClose, onSave, eventToEdit, isSaving }) {
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        description: '',
        type: 'meeting',
        visio_link: ''
    })

    useEffect(() => {
        if (eventToEdit) {
            const dateObj = new Date(eventToEdit.event_date)
            setFormData({
                title: eventToEdit.title || '',
                date: dateObj.toISOString().split('T')[0],
                time: dateObj.toTimeString().slice(0, 5),
                description: eventToEdit.description || '',
                type: eventToEdit.event_type || 'meeting',
                visio_link: eventToEdit.visio_link || ''
            })
        } else {
            setFormData({
                title: '',
                date: '',
                time: '',
                description: '',
                type: 'meeting',
                visio_link: ''
            })
        }
    }, [eventToEdit, isOpen])

    const handleSubmit = (e) => {
        e.preventDefault()
        const fullDate = new Date(`${formData.date}T${formData.time || '00:00'}`)

        onSave({
            title: formData.title,
            description: formData.description,
            event_type: formData.type,
            visio_link: formData.visio_link,
            event_date: fullDate.toISOString()
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">
                        {eventToEdit ? 'Modifier l\'étape' : 'Nouvelle étape'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Titre</label>
                        <div className="relative">
                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ex: Audit Blanc"
                            />
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Heure</label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type d'événement</label>
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                            {['meeting', 'audit', 'deadline'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type })}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${formData.type === type
                                            ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {type === 'meeting' ? 'Rendez-vous' : type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Link */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Lien Visio (Optionnel)</label>
                        <div className="relative">
                            <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="url"
                                value={formData.visio_link}
                                onChange={e => setFormData({ ...formData, visio_link: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://meet.google.com/..."
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                                placeholder="Détails supplémentaires..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
