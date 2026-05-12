import React, { useEffect } from 'react'
import { Hammer, Clock, Mail, RefreshCw, ArrowRight } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Maintenance() {
    const { maintenanceMode, role } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        // 🔄 AUTO-REDIRECT: If maintenance is OFF, send them back to their dashboard
        if (!maintenanceMode) {
            const timer = setTimeout(() => {
                if (role === 'admin') navigate('/admin/dashboard')
                else if (role === 'consultant') navigate('/consultant/dashboard')
                else if (role === 'of') navigate('/client/dashboard')
                else navigate('/login')
            }, 2000) // Small delay to show the "Back online" message
            return () => clearTimeout(timer)
        }
    }, [maintenanceMode, role, navigate])

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="flex justify-center">
                    <Logo size="large" />
                </div>
                
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-blue-50 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full opacity-50"></div>
                    <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-50 rounded-full opacity-50"></div>

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner">
                            <Hammer className="h-10 w-10 animate-bounce" />
                        </div>
                        
                        <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                            Maintenance en cours
                        </h1>
                        
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            Nous mettons à jour EasyQual pour vous offrir une meilleure expérience. 
                            La plateforme sera de retour dans quelques instants.
                        </p>

                        <div className="space-y-4">
                            {maintenanceMode ? (
                                <>
                                    <div className="flex items-center justify-center gap-3 text-sm font-bold text-blue-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <Clock className="h-4 w-4" />
                                        <span>Retour prévu : Très bientôt</span>
                                    </div>
                                    
                                    <p className="text-[11px] text-gray-400 uppercase tracking-widest font-black pt-4">
                                        Une urgence ?
                                    </p>
                                    
                                    <a 
                                        href="mailto:devweb.lsc@outlook.com" 
                                        className="flex items-center justify-center gap-2 text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors"
                                    >
                                        <Mail className="h-4 w-4" />
                                        devweb.lsc@outlook.com
                                    </a>
                                </>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center justify-center gap-3 text-sm font-bold text-green-600 bg-green-50 p-4 rounded-xl border border-green-100">
                                        <RefreshCw className="h-4 w-4 animate-spin-slow" />
                                        <span>Plateforme de nouveau disponible !</span>
                                    </div>
                                    <button 
                                        onClick={() => window.location.reload()}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all hover:scale-[1.02]"
                                    >
                                        Accéder à mon espace
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-gray-400 text-xs font-medium">
                    &copy; 2026 EasyQual. Tous droits réservés.
                </p>
            </div>
        </div>
    )
}
