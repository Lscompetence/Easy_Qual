import { X, CheckCircle, XCircle, AlertTriangle, Info, Clock, Trash2 } from 'lucide-react'

export default function ToastHistoryModal({ isOpen, onClose, toastHistory, clearHistory }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Historique des Actions</h2>
                        <p className="text-sm text-gray-500 font-medium mt-1">Détails de toutes les notifications système</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {toastHistory.length > 0 && (
                            <button 
                                onClick={clearHistory}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors tooltip-trigger"
                                title="Vider l'historique"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                    {toastHistory.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <Clock className="h-8 w-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Aucun historique</h3>
                            <p className="text-gray-500 font-medium mt-1">Les actions exécutées apparaîtront ici.</p>
                        </div>
                    ) : (
                        toastHistory.map((t) => {
                            const iconMap = {
                                success: <CheckCircle className="h-6 w-6 text-emerald-500" />,
                                error: <XCircle className="h-6 w-6 text-rose-500" />,
                                warning: <AlertTriangle className="h-6 w-6 text-amber-500" />,
                                info: <Info className="h-6 w-6 text-indigo-500" />
                            }
                            const bgMap = {
                                success: 'bg-emerald-50 border-emerald-100',
                                error: 'bg-rose-50 border-rose-100',
                                warning: 'bg-amber-50 border-amber-100',
                                info: 'bg-indigo-50 border-indigo-100'
                            }
                            const titleMap = {
                                success: 'Succès',
                                error: 'Erreur',
                                warning: 'Avertissement',
                                info: 'Information'
                            }
                            const icon = iconMap[t.type] || iconMap.info
                            const bgClass = bgMap[t.type] || bgMap.info
                            const title = titleMap[t.type] || titleMap.info
                            const timeStr = t.created_at ? new Date(t.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

                            return (
                                <div key={t.id} className={`p-4 rounded-2xl border ${bgClass} flex gap-4 transition-all hover:shadow-md`}>
                                    <div className="flex-shrink-0 mt-1 bg-white p-2 rounded-xl shadow-sm border border-white/50">
                                        {icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                                            {timeStr && (
                                                <span className="text-[11px] font-bold text-gray-500 bg-white/60 px-2 py-0.5 rounded-md border border-white/50">
                                                    {timeStr}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-medium">
                                            {t.message}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
