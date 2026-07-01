import { ShieldCheck, AlertTriangle, XCircle, CheckCircle, Ban, Share2, Eye, EyeOff } from 'lucide-react'

/**
 * Affiche le résultat d'un pré-audit (avis + compteurs).
 * @param {object}  result      retour de calculerPreAudit()
 * @param {string}  auditType   libellé du type d'audit (périmètre)
 * @param {boolean} compact     true = encart résumé ; false = carte détaillée
 * @param {boolean} [shared]    avis partagé au client (affiche le toggle si onToggleShare fourni)
 * @param {function}[onToggleShare] callback du toggle de partage (consultant uniquement)
 * @param {boolean} [savingShare]
 */
export default function PreAuditResult({ result, auditType, compact = false, shared, onToggleShare, savingShare = false }) {
    if (!result) return null
    const { avis, maj, min, na, conforme, nr, hors = 0, applicables, total, eliminatoire } = result
    const couleur = avis.couleur

    const AvisIcon = avis.cle === 'FAVORABLE' ? ShieldCheck : avis.cle === 'RESERVE' ? AlertTriangle : Ban

    return (
        <div
            className="rounded-3xl border-2 bg-white overflow-hidden"
            style={{ borderColor: couleur + '40' }}
        >
            {/* Bandeau avis */}
            <div className="p-5 flex items-center gap-4" style={{ background: couleur + '0f' }}>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white" style={{ background: couleur }}>
                    <AvisIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pré-audit · {auditType}</span>
                        {eliminatoire && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-200">
                                ⛔ Reprogrammation d'audit requise
                            </span>
                        )}
                    </div>
                    <h3 className="text-xl font-black tracking-tight" style={{ color: couleur }}>
                        Avis : {avis.label}
                    </h3>
                    {!compact && <p className="text-xs text-gray-500 font-medium mt-1">{avis.txt}</p>}
                </div>

                {/* Toggle partage client (consultant) */}
                {onToggleShare && (
                    <button
                        onClick={onToggleShare}
                        disabled={savingShare}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold border-2 transition-all whitespace-nowrap disabled:opacity-50 ${
                            shared
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                        title={shared ? 'Avis partagé avec le client' : 'Avis privé (non partagé)'}
                    >
                        {shared ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {shared ? 'Partagé au client' : 'Non partagé'}
                    </button>
                )}
            </div>

            {/* Compteurs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 border-t border-gray-100">
                <Compteur icon={<XCircle className="h-4 w-4" />} valeur={maj} label="NC majeures" color="text-rose-600" bg="bg-rose-50" />
                <Compteur icon={<AlertTriangle className="h-4 w-4" />} valeur={min} label="NC mineures" color="text-amber-600" bg="bg-amber-50" />
                <Compteur icon={<Ban className="h-4 w-4" />} valeur={na} label="Non applicables" color="text-gray-500" bg="bg-gray-50" />
                <Compteur icon={<CheckCircle className="h-4 w-4" />} valeur={conforme} label="Conformes" color="text-emerald-600" bg="bg-emerald-50" />
            </div>

            {!compact && (
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500 font-medium flex items-center justify-between flex-wrap gap-2">
                    <span>
                        {conforme + maj + min} / {applicables ?? total} évalués · {nr} non évalués
                        {hors > 0 && <span className="text-gray-400"> · {hors} hors périmètre</span>}
                    </span>
                    <span className="text-gray-400">Règle : 0 NC → Favorable · 1-4 mineures → Sous réserve · ≥5 mineures ou ≥1 majeure → Non conforme</span>
                </div>
            )}
        </div>
    )
}

function Compteur({ icon, valeur, label, color, bg }) {
    return (
        <div className="p-4 flex items-center gap-3">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${color}`}>{icon}</div>
            <div className="min-w-0">
                <div className={`text-lg font-black leading-none ${color}`}>{valeur}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">{label}</div>
            </div>
        </div>
    )
}
