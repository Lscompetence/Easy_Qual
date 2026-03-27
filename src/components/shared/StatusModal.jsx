import { X, CheckCircle, AlertTriangle, Trash2, Info, AlertCircle } from 'lucide-react'

export default function StatusModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    type = 'info', // 'success' | 'error' | 'warning' | 'confirm' | 'delete'
    title, 
    message, 
    confirmText = 'Confirmer', 
    cancelText = 'Annuler',
    isLoading = false
}) {
    if (!isOpen) return null

    const config = {
        success: {
            icon: <CheckCircle className="h-10 w-10 text-emerald-500" />,
            bgColor: 'bg-emerald-50',
            ringColor: 'ring-emerald-50/50',
            buttonColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
            titleColor: 'text-emerald-900',
            descriptionColor: 'text-emerald-600'
        },
        error: {
            icon: <X className="h-10 w-10 text-red-500" />,
            bgColor: 'bg-red-50',
            ringColor: 'ring-red-50/50',
            buttonColor: 'bg-red-600 hover:bg-red-700 shadow-red-200',
            titleColor: 'text-red-900',
            descriptionColor: 'text-red-600'
        },
        warning: {
            icon: <AlertTriangle className="h-10 w-10 text-amber-500" />,
            bgColor: 'bg-amber-50',
            ringColor: 'ring-amber-50/50',
            buttonColor: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
            titleColor: 'text-amber-900',
            descriptionColor: 'text-amber-600'
        },
        confirm: {
            icon: <Info className="h-10 w-10 text-blue-500" />,
            bgColor: 'bg-blue-50',
            ringColor: 'ring-blue-50/50',
            buttonColor: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
            titleColor: 'text-blue-900',
            descriptionColor: 'text-blue-600'
        },
        delete: {
            icon: <Trash2 className="h-10 w-10 text-red-500" />,
            bgColor: 'bg-red-50',
            ringColor: 'ring-red-50/50',
            buttonColor: 'bg-red-600 hover:bg-red-700 shadow-red-200',
            titleColor: 'text-red-900',
            descriptionColor: 'text-red-600'
        }
    }

    const { icon, bgColor, ringColor, buttonColor, titleColor, descriptionColor } = config[type] || config.info

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 border border-white/20">
                {/* Header Icon */}
                <div className="pt-10 pb-4 flex justify-center">
                    <div className={`${bgColor} p-5 rounded-full shadow-inner ring-[12px] ${ringColor} transform transition-transform hover:scale-110 duration-300`}>
                        {icon}
                    </div>
                </div>

                {/* Content */}
                <div className="px-10 pb-10 text-center">
                    <h3 className={`text-2xl font-black ${titleColor || 'text-gray-900'} mb-3 tracking-tight`}>
                        {title}
                    </h3>

                    <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8 px-2">
                        {message}
                    </p>

                    {type === 'delete' && (
                        <div className="bg-red-50 border border-red-100 border-dashed rounded-2xl p-4 mb-8 text-left flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1">
                                    Attention Irréversible
                                </h4>
                                <p className="text-[11px] text-red-600/80 font-medium">
                                    Cette action supprimera définitivement le fichier.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                        {(type === 'confirm' || type === 'delete') && (
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all disabled:opacity-50 active:scale-95"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={onConfirm || onClose}
                            disabled={isLoading}
                            className={`flex-1 py-4 px-6 ${buttonColor} text-white font-bold rounded-2xl shadow-lg transition-all transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    En cours...
                                </>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
