import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Lock, Mail, CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react'

export default function ClientAccessModal({ isOpen, onClose, tenant, onUpdate }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [showPassword, setShowPassword] = useState(false)

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    useEffect(() => {
        if (tenant) {
            setFormData({
                email: tenant.client_email || '',
                password: tenant.initial_password || ''
            })
        }
    }, [tenant])

    const handleSync = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            // 1. Update the tenant in the database first
            const { error: tErr } = await supabase
                .from('tenants')
                .update({
                    client_email: formData.email,
                    initial_password: formData.password
                })
                .eq('id', tenant.id)

            if (tErr) throw tErr

            // 2. Call the invite-client Edge Function to sync with Auth
            const { data, error: inviteError } = await supabase.functions.invoke('invite-client', {
                body: {
                    email: formData.email,
                    password: formData.password,
                    tenant_id: tenant.id,
                    tenant_name: tenant.name
                }
            })

            if (inviteError) throw inviteError
            if (data?.error) throw new Error(data.error)

            setSuccess("Accès client synchronisé avec succès !")
            if (onUpdate) onUpdate()

            // Close after 1.5s
            setTimeout(() => {
                onClose()
                setSuccess(null)
            }, 1500)

        } catch (err) {
            console.error('Sync error:', err)
            setError(err.message || "Une erreur est survenue lors de la synchronisation.")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-[100] px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-lg">
                            <Lock className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Gérer l'accès client</h3>
                            <p className="text-xs text-slate-400 font-medium">Synchronisation Auth & Database</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center text-red-600 text-sm font-medium">
                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center text-emerald-600 text-sm font-medium">
                            <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSync} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Email de connexion</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700"
                                    placeholder="email@client.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 italic ml-1">* Utilisez cet email pour vous connecter à l'espace client.</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Mot de passe provisoire</label>
                            <div className="relative">
                                <Lock className="h-4 w-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700"
                                    placeholder="Mot de passe"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2 flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                Synchroniser l'accès
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-3 bg-white text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                        <b>Note :</b> La synchronisation met à jour l'email dans la base de données ET réinitialise le mot de passe dans le système d'authentification Supabase.
                    </p>
                </div>
            </div>
        </div>
    )
}
