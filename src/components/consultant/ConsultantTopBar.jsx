import { useState, useEffect } from 'react'
import { Search, Bell, Plus, Menu } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function ConsultantTopBar({ onNewFolder, showNewFolder = false, showCredits = true, showSearch = true, refreshKey = 0, showMobileMenu, setShowMobileMenu, hasUnreadNotifications, onNotificationClick, searchQuery = '', onSearchChange = () => { } }) {
    // State for credits
    const [credits, setCredits] = useState(0)
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/consultant')
    }
    // Ensure useAuth is imported or user is passed. ConsultantTopBar doesn't receive user prop currently.
    // Let's import useAuth, useState, useEffect, supabase.

    useEffect(() => {
        if (user) fetchCredits()
    }, [user, refreshKey])

    const fetchCredits = async () => {
        const { data, error } = await supabase
            .from('credits_wallet')
            .select('balance')
            .eq('consultant_id', user.id)
            .single()
        if (data) setCredits(data.balance)
    }

    return (
        <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left: Search Bar */}
            <div className="flex items-center flex-1 max-w-lg">
                {showSearch && (
                    <div className="relative w-full max-w-md hidden sm:block">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors"
                            placeholder="Rechercher un dossier par nom..."
                        />
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Credit Balance Display */}
                {showCredits && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-100 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-500">Crédits</span>
                        <span className="text-lg font-extrabold">{credits}</span>
                    </div>
                )}

                <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                {showNewFolder && (
                    <button
                        onClick={onNewFolder}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau dossier
                    </button>
                )}

            </div>
        </header >
    )
}
