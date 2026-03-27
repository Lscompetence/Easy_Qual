import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Building, Mail, CheckCircle, AlertCircle, Lock, Edit3 } from 'lucide-react'

export default function UpdateCaseModal({ isOpen, onClose, user, caseData, onSuccess }) {
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState(null)
    const [successMsg, setSuccessMsg] = useState(null)
    
    const [formData, setFormData] = useState({
        tenantName: '',
        siret: '',
        clientEmail: '',
        category: 'mono-site',
        auditTypes: [],
        trainingCategories: []
    })

    useEffect(() => {
        if (caseData && isOpen) {
            setFormData({
                tenantName: caseData.tenants?.name || '',
                siret: caseData.tenants?.siret || '',
                clientEmail: caseData.tenants?.client_email || '',
                category: caseData.category || 'mono-site',
                auditTypes: caseData.audit_type || [],
                trainingCategories: caseData.training_categories || []
            })
            setError(null)
            setSuccessMsg(null)
        }
    }, [caseData, isOpen])

    const handleUpdate = async (e) => {
        e.preventDefault()
        setActionLoading(true)
        setError(null)
        setSuccessMsg(null)

        try {
            const { error: tenantError } = await supabase
                .from('tenants')
                .update({
                    name: formData.tenantName.trim(),
                    siret: formData.siret.trim(),
                    client_email: formData.clientEmail.trim().toLowerCase()
                })
                .eq('id', caseData.tenant_id)

            if (tenantError) throw tenantError

            const { error: caseError } = await supabase
                .from('cases')
                .update({
                    category: formData.category,
                    audit_type: formData.auditTypes,
                    training_categories: formData.trainingCategories
                })
                .eq('id', caseData.id)

            if (caseError) throw caseError

            setSuccessMsg("Dossier mis à jour avec succès !")
            if (onSuccess) onSuccess()
            
            setTimeout(() => {
                onClose()
            }, 1500)

        } catch (err) {
            console.error('Error updating case:', err)
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all p-6">
                <div className="mb-6 border-b border-gray-100 pb-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Edit3 className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Modifier le Dossier</h3>
                        <p className="text-sm text-gray-500 mt-1">Mettez à jour les informations du client.</p>
                    </div>
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

                <form onSubmit={handleUpdate} className="space-y-6">
                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${formData.category === 'mono-site'
                                ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600'
                                : 'border-gray-100 hover:border-purple-200'
                                }`}
                            onClick={() => setFormData({ ...formData, category: 'mono-site' })}
                        >
                            <Building className="h-5 w-5 text-gray-400 mb-2" />
                            <span className="block text-sm font-bold text-gray-900">Mono-site</span>
                        </div>

                        <div
                            className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${formData.category === 'multi-site'
                                ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600'
                                : 'border-gray-100 hover:border-purple-200'
                                }`}
                            onClick={() => setFormData({ ...formData, category: 'multi-site' })}
                        >
                            <div className="flex -space-x-1 mb-2">
                                <Building className="h-4 w-4 text-gray-400" />
                                <Building className="h-4 w-4 text-gray-400" />
                            </div>
                            <span className="block text-sm font-bold text-gray-900">Multi-site</span>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Nom de l'Organisme</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold"
                                value={formData.tenantName}
                                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Numéro SIRET</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold"
                                value={formData.siret}
                                onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-3 uppercase tracking-wide">Catégorie d'audit</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Audit Initial', 'Audit Surveillance', 'Audit Renouvellement'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            const current = formData.auditTypes
                                            const updated = current.includes(type)
                                                ? current.filter(t => t !== type)
                                                : [...current, type]
                                            setFormData({ ...formData, auditTypes: updated })
                                        }}
                                        className={`px-2 py-2 text-[10px] sm:text-xs font-bold rounded-lg border-2 transition-all ${formData.auditTypes.includes(type)
                                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                                            : 'border-gray-100 text-gray-400 hover:border-purple-100'
                                            }`}
                                    >
                                        {type.split(' ')[1]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-3 uppercase tracking-wide">Actions de formation Certifiées</label>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                {['ACFC', 'ACFNC', 'Bilan Compétences', 'CFA / Altérnance', 'VAE'].map((cat) => (
                                    <label key={cat} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-purple-600 rounded"
                                            checked={formData.trainingCategories.includes(cat)}
                                            onChange={(e) => {
                                                const updated = e.target.checked
                                                    ? [...formData.trainingCategories, cat]
                                                    : formData.trainingCategories.filter(c => c !== cat)
                                                setFormData({ ...formData, trainingCategories: updated })
                                            }}
                                        />
                                        <span className={`text-[11px] font-bold ${formData.trainingCategories.includes(cat) ? 'text-purple-900' : 'text-gray-500'}`}>{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Email du dirigeant</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold"
                                value={formData.clientEmail}
                                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-center flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-white text-gray-500 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="px-8 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-600/30 disabled:opacity-50"
                        >
                            {actionLoading ? 'Mise à jour...' : 'Sauvegarder les modifications'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
