import { X, CheckCircle, AlertTriangle, Trash2, Info, AlertCircle } from 'lucide-react'
import { getCriterionColor } from '../../utils/theme'

export default function StatusModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    type = 'info', // 'success' | 'error' | 'warning' | 'confirm' | 'delete'
    title, 
    message, 
    confirmText = 'Confirmer', 
    cancelText = 'Annuler',
    isLoading = false,
    criterionId,
    customTheme
}) {
    if (!isOpen) return null

    const config = {
        info: {
            icon: <Info className="h-10 w-10 text-blue-500" />,
            bgColor: 'bg-blue-50',
            ringColor: 'ring-blue-50/50',
            buttonColor: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
            titleColor: 'text-blue-900',
            descriptionColor: 'text-blue-600'
        },
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
            ringColor: 'ring-red-100/40',
            buttonColor: 'bg-red-600 hover:bg-red-700 shadow-red-200',
            titleColor: 'text-[#691111]', // Dark brown-red title
            descriptionColor: 'text-gray-500'
        }
    }

    const { icon, bgColor, ringColor, buttonColor, titleColor, descriptionColor } = config[type] || config.info

    const dynamicTheme = customTheme || (criterionId ? getCriterionColor(criterionId) : null);
    const useDynamicTheme = dynamicTheme && (type === 'success' || type === 'confirm' || type === 'info');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-[440px] overflow-hidden relative animate-in zoom-in-95 duration-400">
                
                {/* Close Button X (Optional, for easy exit) */}
                <button 
                  onClick={onClose}
                  className="absolute top-8 right-8 p-3 text-slate-300 hover:text-slate-600 transition-colors z-10 hover:bg-slate-50 rounded-2xl"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Header iconography following Screenshot 4 */}
                <div className="pt-12 pb-6 flex justify-center">
                    <div className="relative h-28 w-28 flex items-center justify-center">
                        {/* Outer Glow / Pulse layer */}
                        <div className={`absolute inset-0 ${!useDynamicTheme ? bgColor : ""} opacity-40 rounded-full scale-110 blur-sm`} style={useDynamicTheme ? { backgroundColor: dynamicTheme.primary } : {}}></div>
                        {/* Static layered rings */}
                        <div className={`absolute inset-0 rounded-full ring-8 ${!useDynamicTheme ? ringColor : ""} ${!useDynamicTheme ? bgColor : ""}`} style={useDynamicTheme ? { backgroundColor: dynamicTheme.light, "--tw-ring-color": dynamicTheme.light + "80" } : {}}></div>
                        {/* Center Icon Container - White in Screen 4 */}
                        <div className="relative z-10 bg-white p-6 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-slate-50">
                            {useDynamicTheme && type === 'success' ? <CheckCircle className="h-10 w-10" style={{ color: dynamicTheme.primary }} /> : null}
                            {useDynamicTheme && type === 'confirm' ? <Info className="h-10 w-10" style={{ color: dynamicTheme.primary }} /> : null}
                            {(!useDynamicTheme || (type !== 'success' && type !== 'confirm')) && icon}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-12 pb-12 text-center">
                    <h3 className={`text-2xl font-black mb-3 tracking-tighter ${!useDynamicTheme ? (titleColor || "text-slate-900") : ""}`} style={useDynamicTheme ? { color: dynamicTheme.primary } : {}}>
                        {title}
                    </h3>

                    <p className="text-slate-500 text-[14px] font-bold leading-relaxed mb-8">
                        {message}
                    </p>

                    {type === 'delete' && (
                        <div className="bg-[#fff1f2] border border-[#ffcfd1] rounded-[24px] p-5 mb-8 text-left flex items-start gap-4 animate-in slide-in-from-bottom-2 duration-400">
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-red-50">
                              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black text-red-700 uppercase tracking-[1px] mb-1">
                                    Attention Irréversible
                                </h4>
                                <p className="text-[12px] text-red-600 font-bold leading-snug">
                                    Cette action supprimera définitivement le fichier.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons following Screen 4 styling */}
                    <div className="flex gap-4">
                        {(type === 'confirm' || type === 'delete') && (
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 py-4 px-6 bg-slate-50 hover:bg-white text-slate-900 font-black text-sm rounded-2xl border border-slate-100 transition-all disabled:opacity-50 active:scale-95 shadow-sm hover:shadow-md"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={onConfirm || onClose}
                            disabled={isLoading}
                            className={`flex-1 py-4 px-6 text-white font-black text-sm rounded-2xl shadow-xl transition-all transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 ${!useDynamicTheme ? buttonColor : "hover:opacity-90"}`} style={useDynamicTheme ? { backgroundColor: dynamicTheme.primary, boxShadow: `0 20px 25px -5px ${dynamicTheme.primary}4d` } : {}}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="animate-pulse">En cours...</span>
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
