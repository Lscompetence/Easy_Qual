import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Building, Mail, CheckCircle, AlertCircle, Lock } from 'lucide-react'

export default function NewCaseModal({ isOpen, onClose, user, walletBalance, onSuccess }) {
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState(null)
    const [successMsg, setSuccessMsg] = useState(null)
    const [newCaseData, setNewCaseData] = useState({
        tenantName: '',
        siret: '',
        clientEmail: '',
        password: '', // Nouveau champ
        category: 'mono-site',
        auditTypes: [],
        trainingCategories: []
    })

    const handleCreateCase = async (e) => {
        e.preventDefault()
        setActionLoading(true)
        setError(null)
        setSuccessMsg(null)

        try {
            if (!newCaseData.tenantName || !newCaseData.clientEmail) {
                throw new Error('Nom et Email du client sont obligatoires')
            }

            const cost = newCaseData.category === 'multi-site' ? 2 : 1
            if (walletBalance < cost) {
                throw new Error(`Solde insuffisant. Coût: ${cost} crédits. Solde: ${walletBalance}.`)
            }

            const cleanedEmail = newCaseData.clientEmail.trim().toLowerCase()
            const cleanedPassword = newCaseData.password.trim()
            const cleanedTenantName = newCaseData.tenantName.trim()

            const { data: rpcData, error: rpcError } = await supabase
                .rpc('create_case_and_debit', {
                    p_consultant_id: user.id,
                    p_tenant_name: cleanedTenantName,
                    p_siret: newCaseData.siret.trim(),
                    p_case_category: newCaseData.category,
                    p_audit_type: newCaseData.auditTypes,
                    p_training_categories: newCaseData.trainingCategories,
                    p_client_email: cleanedEmail,
                    p_initial_password: cleanedPassword
                })

            if (rpcError) throw rpcError

            // 📧 Création ou Synchronisation du compte client via Edge Function
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-client', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        apikey: anonKey
                    },
                    body: {
                        email: cleanedEmail,
                        password: cleanedPassword,
                        tenant_id: rpcData.tenant_id,
                        tenant_name: cleanedTenantName
                    }
                });

                if (inviteError) {
                    console.error('Invite error details:', inviteError);
                    let details = inviteError.message;
                    try {
                        const response = inviteError.context || inviteError.response;
                        if (response && typeof response.json === 'function') {
                            const errBody = await response.json();
                            if (errBody.error) details = errBody.error;
                            if (errBody.tip) details += ` (${errBody.tip})`;
                        }
                    } catch (e) { console.warn('Failed to parse error body:', e); }
                    throw new Error(details || "L'Edge Function a retourné une erreur");
                }

                if (inviteData?.error) throw new Error(inviteData.error);

                setSuccessMsg(`Dossier créé et compte client activé pour ${cleanedEmail} !`)

                // 🔁 Reset form
                setNewCaseData({
                    tenantName: '',
                    siret: '',
                    clientEmail: '',
                    password: '',
                    category: 'mono-site',
                    auditTypes: [],
                    trainingCategories: []
                })

            } catch (authErr) {
                console.error('Auth sync error:', authErr)
                // On prévient que le dossier est là mais que l'accès est à vérifier
                setError(`Dossier créé mais l'accès client a échoué : ${authErr.message}.`);
                setSuccessMsg(null);
            }

            // 🚀 Call onSuccess immediately to refresh credits and list
            if (onSuccess) onSuccess()

            // ⏱ Close modal after 2s if success
            if (!error) {
                setTimeout(() => {
                    setSuccessMsg(null)
                    onClose()
                }, 2000)
            }

        } catch (error) {
            console.error('Error creating case:', error)
            let errMsg = error.message
            if (error.code === '23505' || errMsg?.includes('tenants_siret_key')) {
                errMsg = "Ce numéro SIRET est déjà utilisé par un autre client."
            } else if (errMsg?.includes('Solde insuffisant')) {
                errMsg = "Votre solde de crédits est insuffisant."
            }
            setError(errMsg)
        } finally {
            setActionLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all p-6">
                <div className="mb-6 border-b border-gray-100 pb-4">
                    <h3 className="text-xl font-bold text-gray-900">Nouveau Dossier Qualiopi</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Cette action débitera votre compte de crédits.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center text-red-700 text-sm italic">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center text-green-700 text-sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleCreateCase} className="space-y-6">
                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${newCaseData.category === 'mono-site'
                                ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600'
                                : 'border-gray-100 hover:border-purple-200'
                                }`}
                            onClick={() => setNewCaseData({ ...newCaseData, category: 'mono-site' })}
                        >
                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-gray-100 mb-3 shadow-sm">
                                <Building className="h-5 w-5 text-gray-400" />
                            </div>
                            <span className="block text-sm font-bold text-gray-900">Mono-site</span>
                            <span className="block text-[10px] text-gray-400 mt-1 font-medium bg-white px-2 py-0.5 rounded-full border border-gray-100 uppercase">1 Crédit</span>
                        </div>

                        <div
                            className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${newCaseData.category === 'multi-site'
                                ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600'
                                : 'border-gray-100 hover:border-purple-200'
                                }`}
                            onClick={() => setNewCaseData({ ...newCaseData, category: 'multi-site' })}
                        >
                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-gray-100 mb-3 shadow-sm">
                                <div className="flex -space-x-1">
                                    <Building className="h-4 w-4 text-gray-400" />
                                    <Building className="h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                            <span className="block text-sm font-bold text-gray-900">Multi-site</span>
                            <span className="block text-[10px] text-gray-400 mt-1 font-medium bg-white px-2 py-0.5 rounded-full border border-gray-100 uppercase">2 Crédits</span>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Nom de l'Organisme (Client)</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold"
                                placeholder="Ex: Formation Plus SAS"
                                value={newCaseData.tenantName}
                                onChange={(e) => setNewCaseData({ ...newCaseData, tenantName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Numéro SIRET</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold"
                                placeholder="14 chiffres"
                                value={newCaseData.siret}
                                onChange={(e) => setNewCaseData({ ...newCaseData, siret: e.target.value })}
                            />
                        </div>

                        {/* Audit Category */}
                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-3 uppercase tracking-wide">Catégorie d'audit</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Audit Initial', 'Audit Surveillance', 'Audit Renouvellement'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            const current = newCaseData.auditTypes
                                            const updated = current.includes(type)
                                                ? current.filter(t => t !== type)
                                                : [...current, type]
                                            setNewCaseData({ ...newCaseData, auditTypes: updated })
                                        }}
                                        className={`px-2 py-2 text-[10px] sm:text-xs font-bold rounded-lg border-2 transition-all ${newCaseData.auditTypes.includes(type)
                                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                                            : 'border-gray-100 text-gray-400 hover:border-purple-100'
                                            }`}
                                    >
                                        {type.split(' ')[1]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Training Categories */}
                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-3 uppercase tracking-wide">Actions de formation Certifiées</label>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                {['ACFC', 'ACFNC', 'Bilan Compétences', 'CFA / Altérnance', 'VAE'].map((cat) => (
                                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer h-4 w-4 opacity-0 absolute cursor-pointer"
                                                checked={newCaseData.trainingCategories.includes(cat)}
                                                onChange={(e) => {
                                                    const updated = e.target.checked
                                                        ? [...newCaseData.trainingCategories, cat]
                                                        : newCaseData.trainingCategories.filter(c => c !== cat)
                                                    setNewCaseData({ ...newCaseData, trainingCategories: updated })
                                                }}
                                            />
                                            <div className={`h-5 w-5 rounded border-2 transition-all flex items-center justify-center ${newCaseData.trainingCategories.includes(cat)
                                                ? 'bg-purple-600 border-purple-600'
                                                : 'border-gray-300 bg-white group-hover:border-purple-400'
                                                }`}>
                                                <CheckCircle className={`h-3 w-3 text-white transition-opacity ${newCaseData.trainingCategories.includes(cat) ? 'opacity-100' : 'opacity-0'}`} />
                                            </div>
                                        </div>
                                        <span className={`text-[11px] font-bold transition-colors ${newCaseData.trainingCategories.includes(cat) ? 'text-purple-900' : 'text-gray-500'}`}>{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Email du dirigeant (Invitation)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold"
                                    placeholder="client@entreprise.com"
                                    value={newCaseData.clientEmail}
                                    onChange={(e) => setNewCaseData({ ...newCaseData, clientEmail: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Mot de passe provisoire</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold"
                                    placeholder="Ex: Qualiopi2024!"
                                    value={newCaseData.password}
                                    onChange={(e) => setNewCaseData({ ...newCaseData, password: e.target.value })}
                                />
                            </div>
                            <p className="mt-2 text-[10px] text-gray-400 font-medium italic underline underline-offset-2">Communiquez ce mot de passe au client pour sa première connexion.</p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">Résumé de la transaction</h3>
                            <div className="text-xs text-amber-800 space-y-0.5 font-medium">
                                <p>Votre solde actuel : <span className="font-bold underline underline-offset-2">{walletBalance}</span></p>
                                <p>Nouveau solde après débit : <span className="font-bold underline underline-offset-2">{walletBalance - (newCaseData.category === 'multi-site' ? 2 : 1)}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-white text-gray-500 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors order-2 sm:order-1"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="px-8 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 hover:scale-[1.02] transform transition-all active:scale-[0.98] shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                        >
                            {actionLoading ? 'Traitement...' : `Confirmer le débit (${newCaseData.category === 'multi-site' ? 2 : 1} Crédits)`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
