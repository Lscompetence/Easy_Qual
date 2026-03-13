import { useState, useEffect } from 'react'
import { LayoutDashboard, FolderOpen, Calendar, BookOpen, Settings, LogOut, MoreVertical, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext' // Adjust path if needed
import Logo from '../Logo' // Adjust path if needed

export default function ConsultantSidebar({ isOpen, onClose }) {
    const { user, profile, logout } = useAuth()
    const location = useLocation()
    const [caseCount, setCaseCount] = useState(0)

    useEffect(() => {
        if (user) {
            fetchCaseCount()
        }
    }, [user])

    const fetchCaseCount = async () => {
        const { count, error } = await supabase
            .from('cases')
            .select('*', { count: 'exact', head: true })
        if (!error) setCaseCount(count || 0)
    }

    const isActive = (path) => location.pathname === path

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                ></div>
            )}

            <aside className={`fixed inset-y-0 left-0 lg:sticky lg:top-0 w-64 bg-white h-screen flex flex-col z-50 flex-shrink-0 transition-transform duration-300 ease-in-out transform border-r border-gray-100 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                {/* Logo Section */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100 justify-between">
                    <Logo size="small" color="purple" />
                    <button onClick={onClose} className="lg:hidden p-2 text-gray-400 hover:text-purple-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation - PILOTAGE */}
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 border-r border-gray-100">
                    <div>
                        <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Pilotage
                        </h3>
                        <nav className="space-y-1">
                            <Link
                                to="/consultant/dashboard"
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group relative ${isActive('/consultant/dashboard')
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <LayoutDashboard className={`h-5 w-5 mr-3 transition-colors ${isActive('/consultant/dashboard') ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'
                                    }`} />
                                Tableau de bord
                                {isActive('/consultant/dashboard') && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-l-full"></div>
                                )}
                            </Link>

                            <Link
                                to="/consultant/cases"
                                className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg group transition-colors ${isActive('/consultant/cases')
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <FolderOpen className={`h-5 w-5 mr-3 transition-colors ${isActive('/consultant/cases') ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                    Dossiers Clients
                                </div>
                                {caseCount > 0 && (
                                    <span className={`py-0.5 px-2 rounded-full text-xs font-bold ${isActive('/consultant/cases') ? 'bg-purple-200 text-purple-800' : 'bg-purple-100 text-purple-600'}`}>
                                        {caseCount}
                                    </span>
                                )}
                            </Link>

                            <Link
                                to="/consultant/calendar"
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group relative ${isActive('/consultant/calendar')
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Calendar className={`h-5 w-5 mr-3 transition-colors ${isActive('/consultant/calendar') ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'
                                    }`} />
                                Agenda Visios
                                {isActive('/consultant/calendar') && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-l-full"></div>
                                )}
                            </Link>
                        </nav>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Outils
                        </h3>
                        <nav className="space-y-1">
                            <Link
                                to="/consultant/resources"
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group relative ${isActive('/consultant/resources')
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <BookOpen className={`h-5 w-5 mr-3 transition-colors ${isActive('/consultant/resources') ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                Audit Qualiopi Manager
                            </Link>
                        </nav>
                    </div>
                </div>

                {/* User Profile Section */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 border-r border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold border border-white shadow-sm flex-shrink-0 overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <span>{profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'C'}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                                {profile?.first_name} {profile?.last_name || ''}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            to="/profile"
                            className="flex-1 text-center text-xs font-medium bg-white border border-gray-200 text-gray-600 py-1.5 rounded-md hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-colors"
                        >
                            Mon Profil
                        </Link>
                        <button
                            onClick={async () => { await logout(); window.location.href = '/login?role=consultant'; }}
                            className="flex-shrink-0 p-1.5 bg-white border border-gray-200 text-gray-400 rounded-md hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all"
                            title="Déconnexion"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
