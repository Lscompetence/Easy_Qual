/* eslint-disable */
import { useState, useEffect, useCallback } from 'react'
import { Search, Bell, Plus, Menu, Lock, CheckCircle, XCircle, AlertTriangle, Info, X, ClipboardList, ExternalLink } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CreditsModal from './CreditsModal'

export default function ConsultantTopBar({ onNewFolder, showNewFolder = false, showCredits = true, showNotifications = true, showSearch = true, refreshKey = 0, onCreditsUpdate = () => { }, showMobileMenu, setShowMobileMenu, hasUnreadNotifications, onNotificationClick, searchQuery = '', onSearchChange = () => { } }) {
    const [credits, setCredits] = useState(0)
    const [unreadCount, setUnreadCount] = useState(0)         // Messages (Bell)
    const [unreadActionsCount, setUnreadActionsCount] = useState(0) // Client actions (ClipboardList)
    const [showCreditsModal, setShowCreditsModal] = useState(false)
    const { user, profile, logout } = useAuth()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [modalInitialStep, setModalInitialStep] = useState('selection')
    const [modalInitialSelectedPack, setModalInitialSelectedPack] = useState(null)

    const [toasts, setToasts] = useState(() => {
        if (typeof window !== 'undefined' && user) {
            try {
                const stored = localStorage.getItem(`eq_toasts_active_${user.id}`);
                return stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error("Error loading toasts:", e);
            }
        }
        return [];
    });

    const [toastHistory, setToastHistory] = useState(() => {
        if (typeof window !== 'undefined' && user) {
            try {
                const stored = localStorage.getItem(`eq_toast_history_${user.id}`);
                return stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error("Error loading toast history:", e);
            }
        }
        return [];
    });

    useEffect(() => {
        if (user) {
            try {
                const storedActive = localStorage.getItem(`eq_toasts_active_${user.id}`);
                if (storedActive) setToasts(JSON.parse(storedActive));
                else setToasts([]);

                const storedHistory = localStorage.getItem(`eq_toast_history_${user.id}`);
                if (storedHistory) setToastHistory(JSON.parse(storedHistory));
                else setToastHistory([]);
            } catch (e) {
                console.error("Error loading toasts on user change:", e);
            }
        } else {
            setToasts([]);
            setToastHistory([]);
        }
    }, [user]);

    // showToast: shows toast AND saves to actions history (for CLIENT ACTIONS only)
    const showToast = useCallback((message, type = 'info', options = {}) => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        const { clientName, case_id, targetUrl } = options;
        const newToast = {
            id, message, type, clientName, case_id, targetUrl,
            created_at: new Date().toISOString()
        };
        setToasts(prev => {
            const updated = [...prev, newToast];
            if (user) {
                try { localStorage.setItem(`eq_toasts_active_${user.id}`, JSON.stringify(updated)); }
                catch (e) { console.error("Error saving active toast:", e); }
            }
            return updated;
        });
        setToastHistory(prev => {
            const updated = [newToast, ...prev].slice(0, 50);
            if (user) {
                try { localStorage.setItem(`eq_toast_history_${user.id}`, JSON.stringify(updated)); }
                catch (e) { console.error("Error saving toast history:", e); }
            }
            return updated;
        });
        // No auto-dismiss
    }, [user]);

    // showToastOnly: shows toast but does NOT save to history (for MESSAGES)
    const showToastOnly = useCallback((message, type = 'info', options = {}) => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        const { clientName, case_id, targetUrl } = options;
        const newToast = {
            id, message, type, clientName, case_id, targetUrl,
            created_at: new Date().toISOString(),
            isMessage: true  // flag to identify message toasts
        };
        setToasts(prev => {
            const updated = [...prev, newToast];
            if (user) {
                try { localStorage.setItem(`eq_toasts_active_${user.id}`, JSON.stringify(updated)); }
                catch (e) { console.error("Error saving active toast:", e); }
            }
            return updated;
        });
        // Not saved to toastHistory
        // No auto-dismiss
    }, [user]);

    const dismissToast = useCallback((id) => {
        setToasts(prev => {
            const updated = prev.filter(x => x.id !== id);
            if (user) {
                try {
                    localStorage.setItem(`eq_toasts_active_${user.id}`, JSON.stringify(updated));
                } catch (e) {
                    console.error("Error removing toast:", e);
                }
            }
            return updated;
        });
    }, [user]);

    const clearHistory = useCallback(() => {
        setToastHistory([]);
        if (user) {
            localStorage.removeItem(`eq_toast_history_${user.id}`);
        }
    }, [user]);

    const renderToasts = () => {
        return (
            <div className="fixed top-[76px] right-5 z-[9999] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: '24rem', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                {toasts.map(t => {
                    const isMsg = t.isMessage === true
                    const iconMap = {
                        success: <CheckCircle className="h-5 w-5 text-purple-400" />,
                        error: <XCircle className="h-5 w-5 text-rose-400" />,
                        warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
                        info: <Info className="h-5 w-5 text-indigo-400" />
                    }
                    const borderMap = {
                        success: 'border-l-4 border-l-purple-500 border-slate-800/80',
                        error: 'border-l-4 border-l-rose-500 border-slate-800/80',
                        warning: 'border-l-4 border-l-amber-500 border-slate-800/80',
                        info: isMsg ? 'border-l-4 border-l-blue-400 border-slate-800/80' : 'border-l-4 border-l-indigo-500 border-slate-800/80'
                    }
                    const titleMap = {
                        success: 'Succès',
                        error: 'Erreur',
                        warning: 'Avertissement',
                        info: isMsg ? 'Message Client' : 'Notification'
                    }
                    const icon = iconMap[t.type] || iconMap.info
                    const borderClass = borderMap[t.type] || borderMap.info
                    const title = titleMap[t.type] || titleMap.info
                    const timeStr = t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    // Navigate to correct destination based on toast type
                    const navTarget = t.targetUrl || (isMsg ? '/consultant/messages' : '/consultant/actions-history')
                    const navLabel = isMsg ? 'Voir la messagerie' : "Voir l'historique"

                    return (
                        <div
                            key={t.id}
                            className={`pointer-events-auto flex gap-3 bg-slate-900/95 text-white rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-5 duration-300 w-80 sm:w-96 overflow-hidden ${borderClass}`}
                        >
                            {/* Clickable body — navigates to correct page */}
                            <button
                                onClick={() => navigate(navTarget)}
                                className="flex-1 flex gap-3 p-4 text-left hover:bg-slate-800/40 transition-colors min-w-0"
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-sm font-bold tracking-wide text-slate-200">
                                            {title}
                                        </span>
                                        {timeStr && (
                                            <span className="text-[10px] text-slate-500 font-medium">
                                                {timeStr}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-medium break-words">
                                        {t.message.length > 120 ? `${t.message.substring(0, 120)}...` : t.message}
                                    </div>
                                    <span className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold ${isMsg ? 'text-blue-400' : 'text-indigo-400'}`}>
                                        <ExternalLink className="h-2.5 w-2.5" />
                                        {navLabel}
                                    </span>
                                </div>
                            </button>
                            {/* Dismiss button — only way to remove */}
                            <button
                                onClick={(e) => { e.stopPropagation(); dismissToast(t.id); }}
                                className="flex-shrink-0 self-start mt-3 mr-3 text-slate-500 hover:text-white hover:bg-rose-600 transition-all p-1.5 rounded-lg"
                                aria-label="Fermer"
                                title="Supprimer ce toast"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )
                })}
            </div>
        )
    }

    const isActive = profile?.is_active !== false 

    useEffect(() => {
        let channel;
        if (user) {
            fetchCredits()
            fetchUnreadCount()
            fetchUnreadActionsCount()

            const setupSubscription = async () => {
                const { data: casesData, error } = await supabase
                    .from('cases')
                    .select('id, tenants(name)')
                    .eq('consultant_id', user.id)
                
                if (error) console.error("Error fetching cases for topbar:", error);

                const casesMap = {}
                casesData?.forEach(c => {
                    casesMap[String(c.id)] = {
                        clientName: c.tenants?.name || 'Client'
                    }
                })
                const caseIds = Object.keys(casesMap)
                if (caseIds.length === 0) return

                channel = supabase
                    .channel('topbar_global_notifications')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'case_messages' }, (payload) => {
                        fetchUnreadCount()
                        
                        // Check if message belongs to consultant's cases and is from client
                        if (caseIds.includes(String(payload.new.case_id)) && payload.new.sender_id !== user.id) {
                            const content = payload.new.content || ''
                            const isSystem = /^(?:\[SYSTEM\]|\[Remarque)/i.test(content)
                            if (!isSystem) {
                                const clientName = casesMap[String(payload.new.case_id)]?.clientName || 'Client'
                                const isMessagesPage = window.location.pathname === '/consultant/messages' || 
                                                       (window.location.pathname.startsWith('/consultant/case/') && window.location.search.includes('tab=messagerie'))
                                
                                if (!isMessagesPage) {
                                    const targetUrl = `/consultant/case/${payload.new.case_id}?tab=messagerie`
                                    // Use showToastOnly: messages are NOT saved to actions history
                                    showToastOnly(`💬 Nouveau message de votre client :\n${content}`, 'info', { clientName, case_id: payload.new.case_id, targetUrl })
                                }
                            }
                        }
                    })
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'case_notifications' }, (payload) => {
                        const caseId = String(payload.new.case_id)
                        if (caseIds.includes(caseId)) {
                            const isClientAction = payload.new.type?.startsWith('client_')
                            if (isClientAction) {
                                // Increment actions badge
                                fetchUnreadActionsCount()

                                const clientName = casesMap[caseId]?.clientName || 'Client'
                                let targetUrl = `/consultant/case/${caseId}`
                                
                                if (payload.new.type === 'client_file_upload' || payload.new.type === 'client_indicator_update') {
                                    targetUrl += `?tab=suivi_rno`
                                } else if (payload.new.type === 'client_quiz_success' || payload.new.type === 'client_quiz_failure') {
                                    targetUrl += `?tab=suivi_rno`
                                } else if (payload.new.type === 'client_profile_update' || payload.new.type === 'client_password_change') {
                                    targetUrl += `?tab=infocentre`
                                }
                                
                                let toastType = 'info';
                                if (payload.new.type.includes('success')) toastType = 'success';
                                else if (payload.new.type.includes('failure') || payload.new.type.includes('failed')) toastType = 'warning';
                                else if (payload.new.type === 'client_file_upload') toastType = 'success';
                                
                                showToast(payload.new.content, toastType, { clientName, case_id: payload.new.case_id, targetUrl })
                                
                                // Dispatch event to update storage components
                                window.dispatchEvent(new Event('storage'))
                            }
                        }
                    })
                    .subscribe()
            }

            setupSubscription()
        }

        return () => {
            if (channel) supabase.removeChannel(channel)
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

    useEffect(() => {
        if (!user) return
        const paymentStatus = searchParams.get('payment')
        const packId = searchParams.get('pack')

        if (paymentStatus === 'success') {
            const packs = [
                { id: 'decouverte', name: 'Pack Découverte', credits: 1, price: 200 },
                { id: 'pro', name: 'Pack Pro', credits: 5, price: 900 },
                { id: 'expert', name: 'Pack Expert', credits: 10, price: 1600 }
            ]
            let matchedPack;
            if (packId === 'custom' || searchParams.has('credits')) {
                const creditsParam = parseInt(searchParams.get('credits') || '5', 10);
                let unitPrice = 200;
                if (creditsParam >= 10) unitPrice = 160;
                else if (creditsParam >= 5) unitPrice = 180;
                matchedPack = {
                    id: packId || 'custom',
                    name: packId === 'decouverte' ? 'Pack Découverte' : packId === 'pro' ? 'Pack Pro' : packId === 'expert' ? 'Pack Expert' : 'Recharge sur-mesure',
                    credits: creditsParam,
                    price: creditsParam * unitPrice
                }
            } else {
                matchedPack = packs.find(p => p.id === packId) || packs[1]
            }

            // Trigger success view
            setModalInitialStep('success')
            setModalInitialSelectedPack(matchedPack)
            setShowCreditsModal(true)

            // Force refresh of credits wallet
            setTimeout(() => {
                fetchCredits()
                if (onCreditsUpdate) onCreditsUpdate()
            }, 1000)

            // Clear search params
            const newParams = new URLSearchParams(window.location.search)
            newParams.delete('payment')
            newParams.delete('pack')
            setSearchParams(newParams, { replace: true })
        } else if (paymentStatus === 'cancel') {
            showToastOnly("L'achat de crédits a été annulé.", 'warning')
            
            const newParams = new URLSearchParams(window.location.search)
            newParams.delete('payment')
            setSearchParams(newParams, { replace: true })
        }
    }, [searchParams, user])

    const handleCloseCreditsModal = () => {
        setShowCreditsModal(false)
        setModalInitialStep('selection')
        setModalInitialSelectedPack(null)
    }

    const fetchUnreadCount = async () => {
        if (!user) return
        try {
            // Fetch case IDs for this consultant
            const { data: casesData } = await supabase
                .from('cases')
                .select('id')
                .eq('consultant_id', user.id)

            const caseIds = casesData?.map(c => c.id) || []
            if (caseIds.length === 0) { setUnreadCount(0); return }

            // Count ONLY unread human MESSAGES (not actions, not system)
            const { count, error } = await supabase
                .from('case_messages')
                .select('id', { count: 'exact', head: true })
                .in('case_id', caseIds)
                .neq('sender_id', user.id)
                .is('read_at', null)
                .not('content', 'ilike', '[SYSTEM]%')
                .not('content', 'ilike', '[Remarque%')

            if (error) throw error
            setUnreadCount(count || 0)
        } catch (err) {
            console.error('Error fetching unread messages count:', err)
        }
    }

    const fetchUnreadActionsCount = async () => {
        if (!user) return
        try {
            const { data: casesData } = await supabase
                .from('cases')
                .select('id')
                .eq('consultant_id', user.id)

            const caseIds = casesData?.map(c => c.id) || []
            if (caseIds.length === 0) { setUnreadActionsCount(0); return }

            // Use localStorage timestamp to know which actions are "new"
            const lastSeen = localStorage.getItem(`eq_last_actions_seen_${user.id}`) || new Date(0).toISOString()

            const { count } = await supabase
                .from('case_notifications')
                .select('id', { count: 'exact', head: true })
                .in('case_id', caseIds)
                .like('type', 'client_%')
                .gt('created_at', lastSeen)

            setUnreadActionsCount(count || 0)
        } catch (err) {
            console.error('Error fetching unread actions count:', err)
        }
    }

    const handleCreditsSuccess = (newBalance) => {

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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && window.location.pathname !== '/consultant/cases') {
                                    navigate(`/consultant/cases?search=${encodeURIComponent(e.target.value)}`)
                                }
                            }}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors"
                            placeholder="Rechercher un dossier par nom..."
                        />
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Credit Balance Display */}
                {showCredits && !profile?.is_internal && (
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

                {showNotifications && (
                    <>
                        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                        {/* 📋 ClipboardList = Client ACTIONS only (uploads, statuts, profil) */}
                        <button
                            onClick={() => {
                                // Mark all actions as seen
                                localStorage.setItem(`eq_last_actions_seen_${user.id}`, new Date().toISOString())
                                setUnreadActionsCount(0)
                                navigate('/consultant/actions-history')
                            }}
                            className={`relative p-2 transition-all rounded-xl border group shadow-sm ${
                                unreadActionsCount > 0 
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-600' 
                                : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100'
                            }`}
                            title="Actions client (uploads, statuts, profil)"
                        >
                            <ClipboardList className={`h-5 w-5 transition-transform group-hover:scale-110 ${unreadActionsCount > 0 ? 'animate-pulse' : ''}`} />
                            {unreadActionsCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-indigo-600/20 border-2 border-white animate-in zoom-in duration-300">
                                    {unreadActionsCount > 99 ? '99+' : unreadActionsCount}
                                </span>
                            )}
                        </button>
                        
                        {/* 🔔 Bell = Messages ONLY between consultant and client */}
                        <button 
                            onClick={() => {
                                // Optimistic reset: clear badge immediately on click
                                setUnreadCount(0)
                                navigate('/consultant/messages')
                            }}
                            className={`relative p-2 transition-all rounded-xl border group shadow-sm ${
                                unreadCount > 0 
                                ? 'bg-purple-50 border-purple-100 text-purple-600' 
                                : 'text-gray-400 hover:text-purple-600 bg-gray-50 border-gray-100'
                            }`}
                            title="Messages avec les clients"
                        >
                            <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-purple-600/20 border-2 border-white animate-in zoom-in duration-300">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    </>
                )}
            </div>

            <CreditsModal
                isOpen={showCreditsModal}
                onClose={handleCloseCreditsModal}
                balance={credits}
                onSuccess={handleCreditsSuccess}
                initialStep={modalInitialStep}
                initialSelectedPack={modalInitialSelectedPack}
            />
            {renderToasts()}
        </header >
    )
}
