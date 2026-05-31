import { useState } from 'react'
import { X, Send, CheckCircle, AlertCircle, LifeBuoy, AlertTriangle, Sparkles } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

export default function FeedbackModal({ isOpen, onClose }) {
    const { user, role } = useAuth()
    const [type, setType] = useState('reclamation') // 'reclamation', 'avis', 'bug'
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(null)

    if (!isOpen) return null

    // Dynamic styles based on user role
    const getThemeStyles = () => {
        if (role === 'consultant') {
            return {
                headerBg: "from-purple-600 to-indigo-600",
                focusRing: "focus:ring-purple-500/20 focus:border-purple-600",
                submitBtn: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-purple-600/15"
            }
        }
        if (role === 'admin') {
            return {
                headerBg: "from-blue-600 to-indigo-600",
                focusRing: "focus:ring-blue-500/20 focus:border-blue-600",
                submitBtn: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-600/15"
            }
        }
        // Default Client (orange)
        return {
            headerBg: "from-[#cc6d3e] to-[#b35d32]",
            focusRing: "focus:ring-[#cc6d3e]/20 focus:border-[#cc6d3e]",
            submitBtn: "bg-gradient-to-r from-[#cc6d3e] to-[#b35d32] hover:shadow-[#cc6d3e]/15"
        }
    }

    const theme = getThemeStyles()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim() || !content.trim()) return

        try {
            setSubmitting(true)
            setError(null)

            const { error: insertError } = await supabase
                .from('reclamations')
                .insert({
                    user_id: user.id,
                    type,
                    title: title.trim(),
                    content: content.trim(),
                    status: 'pending'
                })

            if (insertError) throw insertError

            setSuccess(true)
            setTitle('')
            setContent('')
            setType('reclamation')

            // Close after 2.5 seconds on success
            setTimeout(() => {
                setSuccess(false)
                onClose()
            }, 2500)

        } catch (err) {
            console.error('Error submitting feedback:', err)
            setError("Impossible d'envoyer votre retour. Veuillez vérifier que la table existe ou réessayer.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                {/* Header Banner */}
                <div className={`bg-gradient-to-r p-8 text-white relative ${theme.headerBg}`}>
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <LifeBuoy className="h-6 w-6 text-white animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-wide uppercase leading-tight">Centre de Support</h3>
                            <p className="text-xs text-white/80 font-medium mt-1">Réclamations, avis et signalement de bugs</p>
                        </div>
                    </div>
                </div>

                {success ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
                        <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6 shadow-inner border border-emerald-100 animate-bounce">
                            <CheckCircle className="h-12 w-12" />
                        </div>
                        <h4 className="text-2xl font-black text-slate-800 mb-3">Retour Envoyé !</h4>
                        <p className="text-base text-slate-500 leading-relaxed max-w-sm mx-auto">
                            Merci pour votre contribution. L'équipe d'administration va étudier votre signalement dans les plus brefs délais.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold rounded-xl flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Return Type Selector */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                Nature de votre demande
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: 'reclamation', label: 'Réclamation', icon: AlertTriangle, color: 'border-red-200 text-red-600 bg-red-50/50 hover:bg-red-50', activeColor: 'bg-red-50 border-red-500 text-red-700 ring-2 ring-red-500/20' },
                                    { id: 'avis', label: 'Avis / Idée', icon: Sparkles, color: 'border-amber-200 text-amber-600 bg-amber-50/50 hover:bg-amber-50', activeColor: 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20' },
                                    { id: 'bug', label: 'Bug / Tech', icon: AlertCircle, color: 'border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-50', activeColor: 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20' }
                                ].map((t) => {
                                    const Icon = t.icon
                                    const isActive = type === t.id
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setType(t.id)}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border text-center transition-all duration-300 ${
                                                isActive ? t.activeColor : `border-slate-100 text-slate-500 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200`
                                            }`}
                                        >
                                            <Icon className={`h-6 w-6 ${isActive ? '' : 'opacity-70'}`} />
                                            <span className="text-xs font-extrabold tracking-wide uppercase">{t.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Title Input */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                Titre court
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Problème d'import Excel, Suggestion de design..."
                                className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 text-base text-slate-800 transition-all placeholder-slate-400 ${theme.focusRing}`}
                            />
                        </div>

                        {/* Content Area */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                Description détaillée
                            </label>
                            <textarea
                                required
                                rows="6"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Veuillez décrire le problème ou l'avis de manière claire..."
                                className={`w-full px-5 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 text-base text-slate-800 transition-all placeholder-slate-400 resize-none ${theme.focusRing}`}
                            />
                        </div>

                        {/* Form Buttons */}
                        <div className="flex justify-end gap-3 pt-5 border-t border-slate-50">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`px-8 py-3 text-sm font-bold text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${theme.submitBtn}`}
                            >
                                {submitting ? 'Envoi...' : (
                                    <>
                                        <span>Envoyer le retour</span>
                                        <Send className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
