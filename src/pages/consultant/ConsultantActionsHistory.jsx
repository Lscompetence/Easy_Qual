import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    Info, 
    Trash2,
    ClipboardList,
    ArrowRight
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'

export default function ConsultantActionsHistory() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [toastHistory, setToastHistory] = useState([])
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    const loadHistory = useCallback(() => {
        if (typeof window !== 'undefined' && user) {
            try {
                const stored = localStorage.getItem(`eq_toast_history_${user.id}`);
                setToastHistory(stored ? JSON.parse(stored) : []);
            } catch (e) {
                console.error("Error loading toast history:", e);
                setToastHistory([]);
            }
        }
    }, [user])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial depuis localStorage (système externe)
        loadHistory()
        // Listen to storage events if updated in another tab
        window.addEventListener('storage', loadHistory)
        return () => window.removeEventListener('storage', loadHistory)
    }, [loadHistory])

    const clearHistory = () => {
        setToastHistory([]);
        if (user) {
            localStorage.removeItem(`eq_toast_history_${user.id}`);
        }
    }

    // Détermine la destination exacte d'une action (dossier + bon onglet)
    const resolveTarget = (t) => {
        if (t.targetUrl) return t.targetUrl
        if (!t.case_id) return null
        const msg = (t.message || '').toLowerCase()
        let tab = ''
        if (msg.includes('indicateur') || msg.includes('document') || msg.includes('quiz') || msg.includes('fichier')) {
            tab = 'suivi_rno'
        } else if (msg.includes('message')) {
            tab = 'messagerie'
        }
        return `/consultant/case/${t.case_id}${tab ? `?tab=${tab}` : ''}`
    }

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
                                <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <ClipboardList className="h-5 w-5 text-white" />
                                </div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Historique des Actions</h1>
                            </div>
                            <p className="text-gray-500 font-medium">Consultez en détail toutes les notifications système et les actions réalisées.</p>
                        </div>
                        {toastHistory.length > 0 && (
                            <button 
                                onClick={clearHistory}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-rose-600 font-bold rounded-xl border border-rose-100 hover:bg-rose-50 transition-colors shadow-sm"
                            >
                                <Trash2 className="h-4 w-4" />
                                Vider l'historique
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {toastHistory.length === 0 ? (
                            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/40 p-20 text-center">
                                <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Clock className="h-10 w-10 text-gray-200" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 mb-2">Aucun historique récent</h2>
                                <p className="text-gray-400 max-w-sm mx-auto">
                                    Les actions exécutées par le système ou par vos clients apparaîtront ici.
                                </p>
                            </div>
                        ) : (
                            toastHistory.map((t) => {
                                const iconMap = {
                                    success: <CheckCircle className="h-6 w-6" />,
                                    error: <XCircle className="h-6 w-6" />,
                                    warning: <AlertTriangle className="h-6 w-6" />,
                                    info: <Info className="h-6 w-6" />
                                }
                                const themeMap = {
                                    success: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', shadow: 'shadow-emerald-50' },
                                    error: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', shadow: 'shadow-rose-50' },
                                    warning: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', shadow: 'shadow-amber-50' },
                                    info: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', shadow: 'shadow-indigo-50' }
                                }
                                const titleMap = {
                                    success: 'Succès',
                                    error: 'Erreur',
                                    warning: 'Avertissement',
                                    info: 'Information'
                                }

                                const theme = themeMap[t.type] || themeMap.info
                                const title = titleMap[t.type] || titleMap.info
                                const icon = iconMap[t.type] || iconMap.info
                                const timeStr = t.created_at ? new Date(t.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
                                const dateStr = t.created_at ? new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '';
                                const target = resolveTarget(t)

                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => { if (target) navigate(target) }}
                                        className={`group relative overflow-hidden bg-white rounded-3xl border-2 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-purple-100 border-gray-50 ${target ? 'cursor-pointer' : ''}`}
                                    >
                                        <div className="p-6 flex items-start gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${theme.bg} ${theme.text}`}>
                                                {icon}
                                            </div>

                                            <div className="flex-1 min-w-0 pr-12">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border}`}>
                                                        {t.clientName || 'Client'}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border} opacity-80`}>
                                                        {title}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400">
                                                        • {dateStr} à {timeStr}
                                                    </span>
                                                </div>
                                                <div className="space-y-1.5 mt-2">
                                                    {(t.message || '').split('\n').map((line, idx) => (
                                                        <div key={idx} className="text-sm leading-relaxed text-gray-500 group-hover:text-gray-800 font-medium break-words transition-colors flex items-start gap-2">
                                                            {line.trim()}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {target && (
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all group-hover:bg-purple-100 group-hover:text-purple-600">
                                                    <ArrowRight className="h-5 w-5" />
                                                </div>
                                            )}
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
