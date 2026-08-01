import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Building, Mail, CheckCircle, AlertCircle, Lock, Edit3, AlertTriangle } from 'lucide-react'

const getDistinctCategoriesCount = (categories) => {
    if (!categories || categories.length === 0) return 0;
    const distinct = new Set();
    categories.forEach(c => {
        const s = String(c || '').toLowerCase();
        if (s.includes("bilan")) distinct.add("BC");
        else if (s.includes("vae") || s.includes("validation")) distinct.add("VAE");
        else if (s.includes("cfa") || s.includes("apprentissage") || s.includes("altern")) distinct.add("CFA");
        else distinct.add("AFC"); // ACFC, ACFNC
    });
    return distinct.size;
};

const getCaseCost = (category, trainingCategories) => {
    const base = category === 'multi-site' ? 2 : 1;
    const count = getDistinctCategoriesCount(trainingCategories);
    return base + Math.max(0, count - 1);
};

export default function UpdateCaseModal({ isOpen, onClose, user, caseData, onSuccess }) {
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState(null)
    const [successMsg, setSuccessMsg] = useState(null)
    const [walletBalance, setWalletBalance] = useState(0)
    
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

    // Load wallet balance on open
    useEffect(() => {
        if (isOpen && user?.id) {
            const fetchWallet = async () => {
                const { data } = await supabase
                    .from('credits_wallet')
                    .select('balance')
                    .eq('consultant_id', user.id)
                    .single();
                if (data) setWalletBalance(data.balance);
            };
            fetchWallet();
        }
    }, [isOpen, user])

    const handleUpdate = async (e) => {
        e.preventDefault()
        setActionLoading(true)
        setError(null)
        setSuccessMsg(null)

        try {
            // Calculate current paid cost from caseData details
            const currentPaid = caseData?.paid_credits || getCaseCost(caseData?.category || 'mono-site', caseData?.training_categories || []);
            const newCost = getCaseCost(formData.category, formData.trainingCategories);
            
            // WARNING / IMPORTANT: Le retrait d'une catégorie ou d'un site ne déclenche aucun recalcul à la baisse (pas de remboursement).
            // Ce commentaire est indispensable pour éviter qu'une implémentation "par symétrie" ne vienne casser le modèle économique de la plateforme.
            const costDifference = Math.max(0, newCost - currentPaid);

            if (costDifference > 0 && walletBalance < costDifference) {
                throw new Error(`Solde de crédits insuffisant. Requis : ${costDifference} cr. Disponible : ${walletBalance} cr.`);
            }

            // Call the secure RPC to update case info and debit credits atomically
            const { data, error: rpcError } = await supabase.rpc('update_case_and_debit', {
                p_case_id: caseData.id,
                p_consultant_id: user.id,
                p_tenant_name: formData.tenantName.trim(),
                p_siret: formData.siret.trim(),
                p_client_email: formData.clientEmail.trim().toLowerCase(),
                p_case_category: formData.category,
                p_audit_type: formData.auditTypes,
                p_training_categories: formData.trainingCategories
            });

            if (rpcError) throw rpcError;

            // Synchronize name in the client's profile
            const { error: syncError } = await supabase.rpc('sync_client_profile_name', {
                p_tenant_id: caseData.tenant_id,
                p_full_name: formData.tenantName.trim()
            });
            if (syncError) console.warn('Sync du nom client échouée:', syncError);

            setSuccessMsg(costDifference > 0 
                ? `Dossier mis à jour. Débit de ${costDifference} crédit(s) effectué !`
                : "Dossier mis à jour avec succès !"
            );
            
            if (onSuccess) onSuccess();
            
            setTimeout(() => {
                onClose();
            }, 1500);

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
                    {/* Type Selection (Read-Only) */}
                    <div>
                        <label className="block text-[13px] font-bold text-gray-700 mb-3 uppercase tracking-wide">Type de Site (Non modifiable)</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                className={`rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${formData.category === 'mono-site'
                                    ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600 opacity-90 cursor-not-allowed'
                                    : 'border-gray-100 opacity-40 cursor-not-allowed'
                                    }`}
                            >
                                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-gray-100 mb-3 shadow-sm">
                                    <Building className="h-5 w-5 text-gray-400" />
                                </div>
                                <span className="block text-sm font-bold text-gray-900">Mono-site</span>
                                <span className="block text-[10px] text-gray-400 mt-1 font-medium bg-white px-2 py-0.5 rounded-full border border-gray-100 uppercase">1 Crédit</span>
                            </div>

                            <div
                                className={`rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${formData.category === 'multi-site'
                                    ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600 opacity-90 cursor-not-allowed'
                                    : 'border-gray-100 opacity-40 cursor-not-allowed'
                                    }`}
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
                        <p className="text-[10px] text-gray-400 font-semibold italic mt-2">* Le type de site (mono-site / multi-site) est fixé à la création et ne peut pas être modifié.</p>
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
                                            
                                            // Sort consistently
                                            const order = ['Audit Initial', 'Audit Surveillance', 'Audit Renouvellement']
                                            const sorted = updated.sort((a, b) => order.indexOf(a) - order.indexOf(b))
                                            
                                            setFormData({ ...formData, auditTypes: sorted })
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
                                {['ACFC', 'ACFNC', 'Bilan Compétences', 'CFA / Altérnance', 'VAE'].map((cat) => {
                                    const isAlreadyActive = caseData?.training_categories?.includes(cat);
                                    
                                    // Check if adding this category increases the distinct Qualiopi categories count
                                    let showPlusOne = false;
                                    if (!isAlreadyActive && !formData.trainingCategories.includes(cat)) {
                                        const currentDistinct = getDistinctCategoriesCount(formData.trainingCategories);
                                        const nextDistinct = getDistinctCategoriesCount([...formData.trainingCategories, cat]);
                                        showPlusOne = nextDistinct > currentDistinct;
                                    }

                                    return (
                                        <label 
                                            key={cat} 
                                            className={`flex items-center gap-3 ${isAlreadyActive ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-purple-600 rounded disabled:opacity-50"
                                                checked={formData.trainingCategories.includes(cat)}
                                                disabled={isAlreadyActive}
                                                onChange={(e) => {
                                                    if (isAlreadyActive) return;
                                                    const updated = e.target.checked
                                                        ? [...formData.trainingCategories, cat]
                                                        : formData.trainingCategories.filter(c => c !== cat)
                                                    setFormData({ ...formData, trainingCategories: updated })
                                                }}
                                            />
                                            <span className={`text-[11px] font-bold ${formData.trainingCategories.includes(cat) ? 'text-purple-900' : 'text-gray-500'}`}>
                                                {cat}
                                                {isAlreadyActive && <span className="text-[9px] text-gray-400 font-semibold ml-1">(Déjà actif)</span>}
                                                {showPlusOne && <span className="text-[9px] text-purple-600 font-extrabold ml-1.5">(+1 cr.)</span>}
                                            </span>
                                        </label>
                                    );
                                })}
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

                    {/* Transaction / Billing Summary */}
                    {(() => {
                        const currentPaid = caseData?.paid_credits || getCaseCost(caseData?.category || 'mono-site', caseData?.training_categories || []);
                        const newCost = getCaseCost(formData.category, formData.trainingCategories);
                        // WARNING / IMPORTANT: Le retrait d'une catégorie ou d'un site ne déclenche aucun recalcul à la baisse (pas de remboursement).
                        // Ce commentaire est indispensable pour éviter qu'une implémentation "par symétrie" ne vienne casser le modèle économique de la plateforme.
                        const costDifference = Math.max(0, newCost - currentPaid);
                        const hasInsufficientCredits = costDifference > 0 && walletBalance < costDifference;

                        return (
                            <div className="mt-4 p-4 rounded-xl border font-medium text-xs space-y-1 bg-amber-50 border-amber-100 text-amber-800">
                                <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wide mb-1">Résumé de la tarification</p>
                                <div className="flex justify-between">
                                    <span>Crédits déjà payés :</span>
                                    <span className="font-bold">{currentPaid} cr.</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Nouveau coût total :</span>
                                    <span className="font-bold">{newCost} cr.</span>
                                </div>
                                {costDifference > 0 ? (
                                    <>
                                        <div className="flex justify-between border-t border-amber-200/50 pt-1 font-extrabold text-purple-900">
                                            <span>Débit additionnel requis :</span>
                                            <span>+{costDifference} crédit(s)</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Votre solde actuel :</span>
                                            <span>{walletBalance} cr.</span>
                                        </div>
                                        <div className={`flex justify-between font-bold ${hasInsufficientCredits ? 'text-red-600' : 'text-slate-700'}`}>
                                            <span>Nouveau solde estimé :</span>
                                            <span>{walletBalance - costDifference} cr.</span>
                                        </div>
                                        {hasInsufficientCredits && (
                                            <div className="mt-2 p-2 rounded bg-red-100 text-red-800 border border-red-200 font-bold flex items-center gap-1.5 animate-pulse">
                                                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                                <span>Solde insuffisant pour cette modification.</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-emerald-700 text-[10px] font-bold mt-1 bg-emerald-50 border border-emerald-100 p-1.5 rounded">
                                        Aucun débit supplémentaire requis.
                                    </div>
                                )}
                            </div>
                        );
                    })()}

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
                            disabled={actionLoading || (() => {
                                const currentPaid = caseData?.paid_credits || getCaseCost(caseData?.category || 'mono-site', caseData?.training_categories || []);
                                const newCost = getCaseCost(formData.category, formData.trainingCategories);
                                const costDifference = Math.max(0, newCost - currentPaid);
                                return costDifference > 0 && walletBalance < costDifference;
                            })()}
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
