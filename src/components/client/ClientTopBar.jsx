import { useNavigate } from 'react-router-dom'
import { MessageSquare, Check, Menu } from 'lucide-react'

export default function ClientTopBar({ breadcrumbs = [], consultantName = '', onContact, setShowMobileMenu }) {
    const navigate = useNavigate()

    return (
        <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setShowMobileMenu(true)}
                    className="lg:hidden p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                    <Menu className="h-6 w-6" />
                </button>

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm">
                    {breadcrumbs.map((crumb, i) => (
                        <div key={i} className="flex items-center gap-2">
                            {i > 0 && <span className="text-gray-300 font-light">›</span>}
                            {crumb.path ? (
                                <button
                                    onClick={() => navigate(crumb.path)}
                                    className="text-gray-400 hover:text-[#cc6d3e] transition-colors font-medium"
                                >
                                    {crumb.label}
                                </button>
                            ) : (
                                <span className="text-gray-800 font-bold">{crumb.label}</span>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            {/* Right: Consultant + Contact */}
            <div className="flex items-center gap-6">
                {consultantName && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 rounded-full border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Consultant</span>
                        <div className="h-5 w-5 rounded-full bg-[#cc6d3e] flex items-center justify-center text-white text-[9px] font-black relative">
                            {consultantName[0]}
                            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full border border-white flex items-center justify-center">
                                <Check className="h-1 w-1 text-white stroke-[5px]" />
                            </div>
                        </div>
                        <span className="text-xs font-black text-gray-800">{consultantName}</span>
                    </div>
                )}
                {onContact && (
                    <button
                        onClick={onContact}
                        className="flex items-center gap-2 px-4 py-1.5 bg-[#faf1ec] hover:bg-[#f8e9df] text-[#cc6d3e] rounded-full text-xs font-black transition-all border border-[#f5e2d6] shadow-sm"
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Contacter
                    </button>
                )}
            </div>
        </header>
    )
}

