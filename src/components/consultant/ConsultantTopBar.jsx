import { useState, useEffect } from 'react'
import { Search, Bell, Plus, Menu, Lock } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import CreditsModal from './CreditsModal'

export default function ConsultantTopBar({ onNewFolder, showNewFolder = false, showCredits = true, showSearch = true, refreshKey = 0, onCreditsUpdate = () => { }, showMobileMenu, setShowMobileMenu, hasUnreadNotifications, onNotificationClick, searchQuery = '', onSearchChange = () => { } }) {
    const [credits, setCredits] = useState(0)
    const [unreadCount, setUnreadCount] = useState(0)
    const [showCreditsModal, setShowCreditsModal] = useState(false)
    const { user, profile, logout } = useAuth()
    const navigate = useNavigate()

    const isActive = profile?.is_active !== false 

    useEffect(() => {
        if (user) {
            fetchCredits()
            fetchUnreadCount()

            const channel = supabase
                .channel('topbar_notifs')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'case_messages' }, () => {
                    fetchUnreadCount()
                })
                .subscribe()
            return () => supabase.removeChannel(channel)
        }
    }, [user, refreshKey, showCreditsModal])

    const fetchCredits = async () => {
        const { data, error } = await supabase
            .from('credits_wallet')
            .select('balance')
            .eq('consultant_id', user.id)
            .single()

        if (!error && data) setCredits(data.balance)
    }

    const fetchUnreadCount = async () => {
        try {
            // Count ONLY unread [SYSTEM] messages to verify their existence
            const { data: msgData } = await supabase
                .from('case_messages')
                .select('id')
                .is('read_at', null)
                .neq('sender_id', user.id)
                .ilike('content', '%[SYSTEM]%')

            setUnreadCount(msgData?.length || 0)
        } catch (err) {
            console.error('Error fetching unread count:', err)
        }
    }

    const handleCreditsSuccess = (newBalance) => {
        console.log('🎊 handleCreditsSuccess triggered in TopBar with balance:', newBalance);
        if (typeof newBalance === 'number' && newBalance > 0) {
            setCredits(newBalance);
            // We set it locally first to be instant
        }

        // Wait a bit more before background refresh to ensure DB consistency
        setTimeout(() => {
            fetchCredits();
            if (onCreditsUpdate) onCreditsUpdate();
        }, 1500);
    }

    return (
        <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 -ml-2 text-gray-400 hover:text-purple-600 lg:hidden"
            >
                <Menu className="h-6 w-6" />
            </button>

            {/* Left: Search Bar */}
            <div className="flex items-center flex-1 max-w-lg ml-2 lg:ml-0">
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
                    <div className="flex items-center bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-12">
                        <div className="flex items-center gap-3 px-4 py-2 bg-amber-50/50">
                            <div className="p-1.5 bg-amber-100 rounded-lg shadow-inner">
                                <span className="text-lg">🪙</span>
                            </div>
                            <div className="flex flex-col -space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Solde</span>
                                <span className="text-lg font-black text-gray-900">{credits} <span className="text-sm font-bold text-gray-400">Cr.</span></span>
                            </div>
                        </div>
                        <div className="w-px h-6 bg-gray-100"></div>
                        <button
                            onClick={() => isActive && setShowCreditsModal(true)}
                            disabled={!isActive}
                            className={`h-full px-5 py-2 text-sm font-bold uppercase tracking-tight transition-all duration-300 ${!isActive
                                ? 'text-gray-300 cursor-not-allowed bg-gray-50/50'
                                : 'text-slate-600 hover:bg-gray-50 hover:text-blue-600 hover:scale-105 active:scale-95'
                                }`}
                            title={!isActive ? "Action impossible : Votre compte est actuellement suspendu" : "Accéder à la recharge de crédits"}
                        >
                            {!isActive ? (
                                <span className="flex items-center gap-1.5 grayscale">
                                    <Lock className="h-3 w-3" /> Gelé
                                </span>
                            ) : 'Recharger'}
                        </button>
                    </div>
                )}

                {showNewFolder && (
                    <button
                        onClick={onNewFolder}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau dossier
                    </button>
                )}

                <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                {/* Notifications Bell */}
                <button 
                    onClick={() => navigate('/consultant/notifications')}
                    className="relative p-2 text-gray-400 hover:text-purple-600 transition-colors bg-gray-50 rounded-xl border border-gray-100 group"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <>
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-ping opacity-75"></span>
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 shadow-sm"></span>
                        </>
                    )}
                </button>

            </div>

            <CreditsModal
                isOpen={showCreditsModal}
                onClose={() => setShowCreditsModal(false)}
                balance={credits}
                onSuccess={handleCreditsSuccess}
            />
        </header >
    )
}
