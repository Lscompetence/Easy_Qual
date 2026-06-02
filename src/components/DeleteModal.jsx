import { X, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

export default function DeleteModal({ isOpen, onClose, onConfirm, title, message, itemType, isDeleting, isDeleted }) {
    if (!isOpen) return null

    if (isDeleted) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 border border-slate-100">
                    {/* Header Background (Clean white like Screenshot 3) */}
                    <div className="pt-10 pb-6 flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-50 rounded-full scale-150 opacity-100"></div>
                            <div className="relative bg-white p-4 rounded-full shadow-sm border border-red-100">
                                <Trash2 className="h-8 w-8 text-red-500" strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pt-6 text-center">
                        <h3 className="text-2xl font-black text-slate-900 mb-3">
                            {title === 'Supprimer la réclamation ?' ? 'Élément Supprimé' : 'Dossier Supprimé'}
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8 px-4">
                            {title === 'Supprimer la réclamation ?' 
                                ? 'La réclamation/avis a été retirée de la plateforme avec succès.' 
                                : `Le dossier ${itemType ? itemType : ''} a été retiré de la plateforme avec succès.`}
                        </p>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8 text-left flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <p className="text-sm text-slate-600 font-medium">
                                {title === 'Supprimer la réclamation ?'
                                    ? 'Toutes les données associées ont été nettoyées.'
                                    : 'Toutes les données associées (messages, audits, fichiers) ont été nettoyées.'}
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-3.5 bg-[#111827] hover:bg-black text-white font-bold rounded-xl shadow-lg shadow-black/20 transition-all transform active:scale-[0.98]"
                        >
                            Continuer
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 border border-slate-100">
                {/* Header Background */}
                <div className="bg-red-50/50 pt-10 pb-6 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-100 rounded-full scale-150 opacity-50"></div>
                        <div className="relative bg-white p-4 rounded-full shadow-sm border border-red-50">
                            <Trash2 className="h-8 w-8 text-red-600" strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 pt-6 text-center">
                    <h3 className="text-2xl font-black text-slate-900 mb-3">
                        {title || 'Supprimer ?'}
                    </h3>

                    <p className="text-slate-500 text-sm leading-relaxed mb-8 px-4">
                        {message || (
                            <>
                                Vous êtes sur le point de retirer définitivement cet élément.<br/>
                                Cette action ne peut pas être annulée.
                            </>
                        )}
                    </p>

                    {/* Warning Box */}
                    <div className="bg-red-50/50 border border-red-200 border-dashed rounded-xl p-4 mb-8 text-left flex gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-1">Attention irréversible</h4>
                            <p className="text-xs text-red-600/80 italic leading-relaxed">
                                Cette action supprimera également tous les documents, messages et historiques liés à cet élément.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm shadow-red-600/20 hover:shadow transition-all transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    En cours...
                                </>
                            ) : (
                                'Confirmer'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
