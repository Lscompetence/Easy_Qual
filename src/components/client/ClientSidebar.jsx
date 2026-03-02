import { useState } from 'react'
import { LayoutDashboard, CheckSquare, FileText, MessageCircle, Settings, LogOut, ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Logo from '../Logo'

export default function ClientSidebar() {
    const { user, profile, logout } = useAuth()
    const location = useLocation()

    const isActive = (path) => location.pathname === path

    const menuItems = [
        { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Tableau de Bord', path: '/client/dashboard' },
        { icon: <CheckSquare className="h-5 w-5" />, label: 'Autoévaluation', path: '/client/audit' },
        { icon: <FileText className="h-5 w-5" />, label: 'Mes Documents', path: '/client/documents' },
        { icon: <MessageCircle className="h-5 w-5" />, label: 'Messagerie', path: '/client/messages' }
    ]

    return (
        <aside className="w-64 bg-white h-screen sticky top-0 flex flex-col z-50 flex-shrink-0 border-r border-gray-100">
            {/* Logo Section */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <Logo size="small" />
                <span className="ml-3 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-black border border-teal-100 uppercase letter-spacing-wide">Espace Client</span>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3">
                <div className="space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-2.5 text-sm font-bold rounded-xl transition-all group relative ${isActive(item.path)
                                ? 'bg-teal-600 text-white shadow-lg shadow-teal-100'
                                : 'text-gray-500 hover:bg-teal-50 hover:text-teal-600'
                                }`}
                        >
                            <span className={`mr-3 transition-colors ${isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-teal-600'}`}>
                                {item.icon}
                            </span>
                            {item.label}
                            {isActive(item.path) && (
                                <ChevronRight className="ml-auto h-4 w-4 text-white/70" />
                            )}
                        </Link>
                    ))}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                    <h4 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Support & Aide</h4>
                    <Link
                        to="/client/help"
                        className="flex items-center px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <Settings className="h-5 w-5 mr-3 text-gray-400" />
                        Aide & Documentation
                    </Link>
                </div>
            </div>

            {/* Profile Section */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm flex-shrink-0 text-sm">
                        {profile?.first_name?.[0] || 'C'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                            {profile?.first_name} {profile?.last_name || ''}
                        </p>
                        <p className="text-[10px] font-medium text-gray-400 truncate uppercase">{profile?.commercial_name || 'Organisme'}</p>
                    </div>
                </div>
                <button
                    onClick={async () => { await logout(); window.location.href = '/login?role=client'; }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all"
                >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                </button>
            </div>
        </aside>
    )
}
