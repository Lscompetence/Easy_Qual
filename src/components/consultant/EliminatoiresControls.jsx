import { Ban, Check, X } from 'lucide-react'

/**
 * Saisie consultant des critères éliminatoires (ANO-03) applicables à un type d'audit.
 * @param {Array}    eliminatoires  [{key,label,attendu,applicable,statut}]
 * @param {function} onSet          (critKey, 'conforme'|'non_conforme') => void
 */
export default function EliminatoiresControls({ eliminatoires, onSet }) {
    const applicables = (eliminatoires || []).filter(e => e.applicable)
    if (applicables.length === 0) return null

    return (
        <div className="rounded-2xl border-2 border-gray-100 bg-white p-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                <Ban className="h-3.5 w-3.5" /> Critères éliminatoires (ANO-03) · applicables à ce type d'audit
            </div>
            <div className="space-y-3">
                {applicables.map(e => (
                    <div key={e.key} className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-gray-700 leading-snug">{e.label}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">Attendu : {e.attendu}</div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                            <button
                                onClick={() => onSet(e.key, 'conforme')}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border-2 transition-all ${
                                    e.statut === 'conforme'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                        : 'bg-white text-gray-400 border-gray-200 hover:border-emerald-200'
                                }`}
                            >
                                <Check className="h-3.5 w-3.5" /> Conforme
                            </button>
                            <button
                                onClick={() => onSet(e.key, 'non_conforme')}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border-2 transition-all ${
                                    e.statut === 'non_conforme'
                                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                                        : 'bg-white text-gray-400 border-gray-200 hover:border-rose-200'
                                }`}
                            >
                                <X className="h-3.5 w-3.5" /> Non conforme
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
