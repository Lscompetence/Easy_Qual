import { X, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

export default function DeleteModal({ isOpen, onClose, onConfirm, title, message, itemType, isDeleting, isDeleted }) {
    if (!isOpen) return null

    if (isDeleted) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
                    <div className="bg-red-500 h-32 relative flex items-center justify-center">
                        <div className="bg-white p-4 rounded-full shadow-lg">
                            <Trash2 className="h-10 w-10 text-red-500" />
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
                    </div>

                    <div className="p-8 text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Dossier Supprimé</h3>
                        <p className="text-gray-500 mb-6">
                            Le dossier {itemType ? itemType : ''} a été retiré de la plateforme avec succès.
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-start gap-3 text-left">
                            <div className="text-green-500 mt-0.5">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <p className="text-sm text-gray-600">
                                Toutes les données associées (messages, audits, fichiers) ont été nettoyées.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors shadow-lg shadow-gray-200"
                        >
                            Continuer
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
                {/* Header Icon */}
                <div className="pt-8 pb-4 flex justify-center">
                    <div className="bg-red-50 p-4 rounded-full shadow-sm ring-8 ring-red-50/50">
                        <Trash2 className="h-10 w-10 text-red-500" />
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 pb-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {title || 'Supprimer ?'}
                    </h3>

                    <p className="text-gray-500 mb-6">
                        {message || 'Vous êtes sur le point de supprimer cet élément.'}
                    </p>

                    {/* Warning Box */}
                    <div className="bg-red-50 border border-red-100 border-dashed rounded-xl p-4 mb-8 text-left">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">
                                    ATTENTION IRRÉVERSIBLE
                                </h4>
                                <p className="text-xs text-red-600 leading-relaxed">
                                    Cette action supprimera également tous les documents, messages et historiques liés à ce dossier.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Suppression...
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
