import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Users, CreditCard, Building, LogOut, Plus, AlertCircle, CheckCircle, X, Check, Activity, Mail, MoreHorizontal, Edit2, XCircle, Trash2, Bell, Menu, ShieldAlert, Settings } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Logo from '../../components/Logo'

const COUNTRY_CODES = [
    { code: '+33', label: 'FR', flag: '🇫🇷' },
    { code: '+32', label: 'BE', flag: '🇧🇪' },
    { code: '+41', label: 'CH', flag: '🇨🇭' },
    { code: '+352', label: 'LU', flag: '🇱🇺' },
    { code: '+49', label: 'DE', flag: '🇩🇪' },
    { code: '+34', label: 'ES', flag: '🇪🇸' },
    { code: '+39', label: 'IT', flag: '🇮🇹' },
    { code: '+44', label: 'GB', flag: '🇬🇧' },
    { code: '+351', label: 'PT', flag: '🇵🇹' },
    { code: '+31', label: 'NL', flag: '🇳🇱' },
    { code: '+212', label: 'MA', flag: '🇲🇦' }
]

export default function AdminDashboard() {
    const { logout, profile } = useAuth()
    const navigate = useNavigate()

    // Stats
    const [stats, setStats] = useState({
        consultants: 0,
        tenants: 0,
        activeCases: 0
    })

    // Consultants Data
    const [consultants, setConsultants] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [successMsg, setSuccessMsg] = useState(null)

    // Chart Data
    const [chartData, setChartData] = useState([])

    // Actions State
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false) // New Success Modal
    const [createdConsultantParams, setCreatedConsultantParams] = useState(null) // Data for Success Modal

    // Credit Success Modal State
    const [showCreditSuccessModal, setShowCreditSuccessModal] = useState(false)

    const [newConsultant, setNewConsultant] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        commercialName: '',
        siret: '',
        phone: '',
        countryCode: '+33',
        initialCredits: 10
    })
    const [createLoading, setCreateLoading] = useState(false)

    // Credits State
    const [selectedConsultant, setSelectedConsultant] = useState(null)
    const [creditAmount, setCreditAmount] = useState(10)
    const [showCreditModal, setShowCreditModal] = useState(false)

    // Edit State
    const [editLoading, setEditLoading] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editConsultant, setEditConsultant] = useState(null)
    const [originalEditConsultant, setOriginalEditConsultant] = useState(null) // Track initial values
    const [showEditSuccessModal, setShowEditSuccessModal] = useState(false) // New State
    const [successMsgType, setSuccessMsgType] = useState('success') // 'success' (green) or 'error' (red) for suspension
    const [togglingConsultantId, setTogglingConsultantId] = useState(null) // Track which consultant is being toggled

    // Status Toggle Confirmation State
    const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false)
    const [consultantToToggle, setConsultantToToggle] = useState(null)
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
    const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false)
    const [deletedConsultantName, setDeletedConsultantName] = useState('')
    const [consultantToDelete, setConsultantToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Error Modal State
    const [showErrorModal, setShowErrorModal] = useState(false)

    // Email Confirmation State
    const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false)
    const [selectedConsultantForEmail, setSelectedConsultantForEmail] = useState(null)
    const [emailSending, setEmailSending] = useState(false)

    // Notifications & Diagnostics State
    const [notifications, setNotifications] = useState([])
    const [showNotifications, setShowNotifications] = useState(false)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [showCountryDropdown, setShowCountryDropdown] = useState(false)
    const [financialStats, setFinancialStats] = useState({
        totalDistributed: 0,
        totalPurchased: 0,
    })

    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [maintenanceLoading, setMaintenanceLoading] = useState(false)
    const [showMaintenanceConfirmModal, setShowMaintenanceConfirmModal] = useState(false)

    useEffect(() => {
        fetchDashboardData()
        fetchNotifications()
        fetchMaintenanceStatus()

        // Subscribe to real-time notifications
        const channel = supabase
            .channel('admin_notifications_changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'admin_notifications'
            }, (payload) => {

                setNotifications(prev => [payload.new, ...prev].slice(0, 20)); // Keep latest 20
                // Optional: Show a toast or sound
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [])

    const fetchNotifications = async () => {
        const { data, error } = await supabase
            .from('admin_notifications')
            .select('id, title, content, created_at, is_read')
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            setNotifications(data);
        }
    }

    const fetchMaintenanceStatus = async () => {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'maintenance_mode')
            .single()

        if (!error && data) {
            setMaintenanceMode(data.value === true)
        }
    }

    const toggleMaintenanceMode = async () => {
        setShowMaintenanceConfirmModal(false)
        try {
            setMaintenanceLoading(true)
            const newValue = !maintenanceMode
            
            const { error } = await supabase
                .from('system_settings')
                .upsert({ 
                    key: 'maintenance_mode', 
                    value: newValue, 
                    updated_at: new Date().toISOString() 
                })

            if (error) throw error
            
            setMaintenanceMode(newValue)
            setSuccessMsg(newValue ? 'Mode maintenance activé' : 'Mode maintenance désactivé')
            setSuccessMsgType(newValue ? 'error' : 'success')
            setTimeout(() => setSuccessMsg(null), 3000)
        } catch (err) {
            console.error('Error toggling maintenance mode:', err)
            alert('Erreur lors de la modification du mode maintenance')
        } finally {
            setMaintenanceLoading(false)
        }
    }

    const fetchDashboardData = async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            setError(null)

            const fetchDataPromise = async () => {
                const [consultantsRes, tenantsRes, casesRes] = await Promise.all([
                    supabase
                        .from('profiles')
                        .select(`
                        id, 
                        first_name, 
                        last_name, 
                        email, 
                        created_at,
                        temp_password,
                        commercial_name,
                        siret,
                        phone,
                        is_active,
                        credits_wallet(balance)
                    `)
                        .eq('role', 'consultant')
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('tenants')
                        .select('id', { count: 'exact', head: true })
                        .not('created_by', 'is', null), // Only count tenants belonging to someone
                    supabase
                        .from('cases')
                        .select('id, tenants!inner(created_by)', { count: 'exact', head: true })
                        .not('tenants.created_by', 'is', null) // Only count cases with a consultant
                ])

                if (consultantsRes.error) throw consultantsRes.error
                if (tenantsRes.error) throw tenantsRes.error
                if (casesRes.error) throw casesRes.error

                return {
                    consultantsData: consultantsRes.data,
                    tenantsCount: tenantsRes.count,
                    casesCount: casesRes.count
                }
            }

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 8000)
            )

            const { consultantsData, tenantsCount, casesCount } = await Promise.race([
                fetchDataPromise(),
                timeoutPromise
            ])

            // Force React to detect the change by creating a new array
            setConsultants([...(consultantsData || [])])


            setStats({
                consultants: consultantsData?.length || 0,
                tenants: tenantsCount || 0,
                activeCases: casesCount || 0
            })

            // 4. Calculate Financial Stats
            const distributed = consultantsData?.reduce((acc, c) => {
                const wallet = c.credits_wallet;
                const bal = Array.isArray(wallet) ? (wallet[0]?.balance || 0) : (wallet?.balance || 0);
                return acc + bal;
            }, 0) || 0;

            // Fetch Total Purchased (Recharge type in transactions)
            const { data: transData } = await supabase
                .from('transactions')
                .select('amount')
                .eq('transaction_type', 'purchase');

            const purchased = transData?.reduce((acc, t) => acc + (t.amount || 0), 0) || 0;

            setFinancialStats({
                totalDistributed: distributed,
                totalPurchased: purchased
            })

            // 5. Calculate Chart Data (Growth over months)
            if (consultantsData) {
                const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
                const growth = {}

                consultantsData.forEach(c => {
                    const date = new Date(c.created_at)
                    const monthKey = `${months[date.getMonth()]}`
                    growth[monthKey] = (growth[monthKey] || 0) + 1
                })

                // Accumulate to show total curve
                let runningTotal = 0
                const chart = months.map(m => {
                    runningTotal += (growth[m] || 0)
                    return { name: m, total: runningTotal }
                })

                // Only show up to current month for realism if needed, or all year
                setChartData(chart)
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            const msg = error.message === 'Timeout'
                ? 'Le chargement prend trop de temps ( > 8s). Veuillez actualiser la page.'
                : error.message
            setError(msg)
        } finally {
            if (!silent) setLoading(false)
        }
    }

    const openStatusConfirmModal = (consultant) => {
        setConsultantToToggle(consultant)
        setShowStatusConfirmModal(true)
    }

    const handleToggleStatus = async () => {
        if (!consultantToToggle) return

        const consultantId = consultantToToggle.id
        const currentStatus = consultantToToggle.is_active

        try {

            setShowStatusConfirmModal(false)
            setTogglingConsultantId(consultantId)

            const { error } = await supabase
                .from('profiles')
                .update({ is_active: !currentStatus })
                .eq('id', consultantId)

            if (error) throw error



            // Immediately update the local state to force UI refresh
            setConsultants(prev => prev.map(c =>
                c.id === consultantId ? { ...c, is_active: !currentStatus } : c
            ))

            // Wait for database transaction to commit (Supabase eventual consistency)
            await new Promise(resolve => setTimeout(resolve, 500))

            // Refresh data from database to ensure persistence (silent mode to keep table visible)
            await fetchDashboardData(true)



            const statusMessage = !currentStatus
                ? "Ce consultant est maintenant ACTIF."
                : "Ce consultant est maintenant SUSPENDU."

            setSuccessMsg(statusMessage)
            // Use 'error' type for suspension to show in Red, 'success' for activation
            setSuccessMsgType(!currentStatus ? 'success' : 'error')
            setTimeout(() => setSuccessMsg(null), 6000)

        } catch (error) {
            console.error('❌ Error toggling status:', error)
            setError("Impossible de changer le statut.")
        } finally {
            setTogglingConsultantId(null)
            setConsultantToToggle(null)
        }
    }

    const handleUpdateConsultant = async (e) => {
        e.preventDefault()
        if (!editConsultant || !originalEditConsultant) return

        // 1. Detect Changes
        const hasChanges =
            editConsultant.first_name !== originalEditConsultant.first_name ||
            editConsultant.last_name !== originalEditConsultant.last_name ||
            editConsultant.commercial_name !== originalEditConsultant.commercial_name ||
            editConsultant.siret !== originalEditConsultant.siret ||
            editConsultant.phone !== originalEditConsultant.phone

        if (!hasChanges) {
            setSuccessMsg("Aucun changement détecté.")
            setSuccessMsgType('error') // Red background for notice
            setTimeout(() => setSuccessMsg(null), 6000)
            setShowEditModal(false)
            return
        }

        try {
            setEditLoading(true)
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: editConsultant.first_name,
                    last_name: editConsultant.last_name,
                    commercial_name: editConsultant.commercial_name,
                    siret: editConsultant.siret,
                    phone: editConsultant.phone,
                    // email is skipped
                })
                .eq('id', editConsultant.id)

            if (error) throw error

            // Update local state immediately for instant feedback
            // IMPORTANT: validSupabaseResponse might return data, but here we optimistically update
            setConsultants(prev => prev.map(c =>
                c.id === editConsultant.id ? { ...c, ...editConsultant } : c
            ))

            setSuccessMsg("Informations mises à jour avec succès.")
            setSuccessMsgType('success')
            setShowEditModal(false)

            setShowEditSuccessModal(true)
            // Do NOT setEditConsultant(null) here, wait for modal close

            // Background refresh to ensure consistency - DELAYED or SKIPPED to prevent overwriting optimistic update with stale data
            // fetchDashboardData() 

            setTimeout(() => setSuccessMsg(null), 6000)

        } catch (error) {
            console.error('Error updating consultant:', error)
            setError(error.message)
        } finally {
            setEditLoading(false)
        }
    }

    const handleGrantCredits = async () => {
        if (!selectedConsultant || !creditAmount) return

        try {
            setLoading(true)

            // 1. Check if Consultant is Active
            if (selectedConsultant.is_active === false) {
                setError("Ce consultant est suspendu. Impossible d'ajouter des crédits.")
                setLoading(false)
                return
            }

            // 2. Call RPC to update wallet (Simulated manual update if RPC not ready, but using logic from before)
            // Refresh data locally for speed
            setConsultants(prev => prev.map(c =>
                c.id === selectedConsultant.id ? {
                    ...c,
                    credits_wallet: { ...c.credits_wallet, balance: (c.credits_wallet?.balance || 0) + parseInt(creditAmount) }
                } : c
            ))

            // Note: In a real app we would call supabase here. 
            // Assuming the actual DB call was intended to be here or was in the original code I overwrote.
            // I will add the DB update to be safe and correct.

            const currentBalance = selectedConsultant.credits_wallet?.balance || 0
            const newBalance = currentBalance + parseInt(creditAmount)

            const { error: updateError } = await supabase
                .from('credits_wallet')
                .update({ balance: newBalance, updated_at: new Date() })
                .eq('consultant_id', selectedConsultant.id)

            if (updateError) throw updateError

            // 4. Log Transaction
            await supabase.from('transactions').insert({
                wallet_id: selectedConsultant.id,
                amount: parseInt(creditAmount),
                transaction_type: 'adjustment',
                description: 'Crédits ajoutés par Admin'
            })

            // Success: Show Modal instead of Toast
            setShowCreditSuccessModal(true)

            // Close the input modal
            setShowCreditModal(false)

            // Refresh data in background
            fetchDashboardData()

        } catch (error) {
            console.error('Error granting credits:', error)
            setError('Erreur lors de l\'ajout de crédits.')
            setTimeout(() => setError(null), 6000)
        } finally {
            setLoading(false)
        }
    }


    const handleCreateConsultant = async (e) => {
        e.preventDefault()

        // 1. Basic Client side validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(newConsultant.email)) {
            const msg = "Veuillez saisir une adresse email valide."
            setError(msg)
            setShowErrorModal(true)
            setTimeout(() => setError(null), 6000)
            return
        }

        setCreateLoading(true)
        setError(null)

        try {
            const { data: funcData, error: funcError } = await supabase.functions.invoke('admin_create_consultant', {
                body: {
                    action: 'create_consultant',
                    email: newConsultant.email,
                    password: newConsultant.password,
                    firstName: newConsultant.firstName,
                    lastName: newConsultant.lastName,
                    commercialName: newConsultant.commercialName || '',
                    siret: newConsultant.siret || '',
                    phone: `${newConsultant.countryCode || '+33'}${newConsultant.phone || ''}`,
                    initialCredits: newConsultant.initialCredits !== undefined ? newConsultant.initialCredits : 10
                }
            })

            if (funcError) throw funcError
            if (funcData && funcData.success === false) throw new Error(funcData.error)

            const responseData = { user: funcData.user, success: true };

            // --- UI UPDATE ---
            setCreatedConsultantParams({ ...newConsultant })
            setShowSuccessModal(true)
            setShowCreateModal(false)

            // Refresh Real Data from DB
            fetchDashboardData()

            // Reset Form
            setNewConsultant({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                commercialName: '',
                siret: '',
                phone: '',
                countryCode: '+33',
                initialCredits: 10
            })

        } catch (error) {
            console.error('Creation error:', error)
            let errMsg = error.message || error.error_description || error.toString()

            // If the error is an object without a standard message, stringify it
            if (typeof error === 'object' && !error.message) {
                try { errMsg = JSON.stringify(error) } catch(e) {}
            }

            if (errMsg?.includes('401') || error.status === 401) {
                errMsg = "Votre session a expiré ou est invalide. Veuillez vous déconnecter et vous reconnecter."
            } else if (errMsg === 'Timeout') {
                errMsg = 'Le serveur Supabase ne répond pas (Timeout). Veuillez réessayer.'
            } else if (errMsg?.includes('duplicate key') || errMsg?.includes('unique constraint')) {
                errMsg = "Désolé, cet email existe déjà. Veuillez essayer une autre adresse email correcte."
            } else if (errMsg?.includes('non-2xx')) {
                console.error('Edge Function HTTP Error Details:', error)
                errMsg = "Le serveur n'a pas pu traiter la demande. (Il se peut que la Edge Function 'admin_create_consultant' n'existe pas ou ait crashé. Détails : " + error.message + ")"
            } else if (errMsg?.includes('database error') || errMsg?.includes('base de données')) {
                errMsg = `Erreur : ${errMsg}. Vérifiez la colonne 'temp_password'.`
            }

            setError(errMsg || "Une erreur inconnue s'est produite.")
            setShowErrorModal(true)
            setTimeout(() => setError(null), 10000)

        } finally {
            setCreateLoading(false)
        }
    }


    const handleDeleteConsultant = async () => {
        if (!consultantToDelete) return

        setIsDeleting(true)
        try {
            const { data, error: funcError } = await supabase.functions.invoke('admin_create_consultant', {
                body: {
                    action: 'delete_user',
                    userId: consultantToDelete.id
                }
            })

            if (funcError) throw funcError
            if (data && data.success === false) throw new Error(data.error)

            // Setup success modal data
            setDeletedConsultantName(`${consultantToDelete.first_name || ''} ${consultantToDelete.last_name || ''}`.trim() || consultantToDelete.email)

            setShowDeleteConfirmModal(false)
            setConsultantToDelete(null)
            setShowDeleteSuccessModal(true)

            fetchDashboardData()

        } catch (err) {
            console.error('Error deleting consultant:', err)
            setError("Erreur lors de la suppression : " + err.message)
            setShowErrorModal(true)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleSendCredentials = (consultant) => {
        handleInitiateSendEmail(consultant)
    }

    const handleInitiateSendEmail = (consultant) => {
        setSelectedConsultantForEmail(consultant)
        setShowEmailConfirmModal(true)
    }

    const confirmSendEmail = async () => {
        if (!selectedConsultantForEmail) return

        const email = selectedConsultantForEmail.email

        try {
            setEmailSending(true)
            setError(null)

            // 1. Forced Automated Sending via Edge Function
            const { data, error: funcError } = await supabase.functions.invoke('admin_create_consultant', {
                body: { action: 'resend_credentials', email }
            })

            if (funcError) throw funcError
            
            if (data && data.success === false) {
                throw new Error(data.error || "Erreur serveur lors de l'envoi.")
            }

            setSuccessMsg(`L'invitation a été envoyée avec succès à ${email} ✓`)
            setSuccessMsgType('success')
            setShowEmailConfirmModal(false)
            setTimeout(() => setSuccessMsg(null), 6000)

        } catch (err) {
            console.error('Error sending invitation:', err)
            
            // Fetch the temp password locally as a fallback to show the admin
            const { data: profData } = await supabase.from('profiles').select('temp_password, first_name, last_name').eq('email', email).single()
            
            const fallbackInfo = profData?.temp_password 
                ? `\n\nIdentifiants de secours :\nEmail: ${email}\nMot de passe: ${profData.temp_password}`
                : ""

            setError(`L'envoi automatique a échoué. ${err.message}${fallbackInfo}`)
            setSuccessMsgType('error')
            setShowErrorModal(true)
            setShowEmailConfirmModal(false)
        } finally {
            setEmailSending(false)
            setSelectedConsultantForEmail(null)
        }
    }

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/login?role=admin')
        } catch (error) {
            console.error('Failed to logout', error)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-[60]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="lg:hidden p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <Logo size="small" />
                            <span className="hidden xs:inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                Admin
                            </span>
                        </div>

                        {/* Centered Greeting (Clickable for Profile) */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-3">
                            <button
                                onClick={() => navigate('/profile')}
                                className="group flex items-center gap-3 p-1.5 px-3 rounded-xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                            >
                                {profile?.avatar_url && (
                                    <img
                                        src={profile.avatar_url}
                                        alt="Avatar"
                                        className="h-8 w-8 rounded-full border border-blue-100 object-cover shadow-sm bg-blue-50 group-hover:scale-110 transition-transform"
                                    />
                                )}
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">Administrateur</p>
                                    <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {profile?.first_name} {profile?.last_name}
                                    </span>
                                </div>
                            </button>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Maintenance Toggle */}
                            <button
                                onClick={() => setShowMaintenanceConfirmModal(true)}
                                disabled={maintenanceLoading}
                                className={`group flex items-center gap-2.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                    maintenanceMode 
                                    ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-200 animate-pulse' 
                                    : 'bg-white text-gray-400 border-gray-100 hover:border-blue-200 hover:text-blue-600 hover:shadow-md'
                                }`}
                            >
                                <div className={`p-1 rounded-md ${maintenanceMode ? 'bg-white/20' : 'bg-gray-50 group-hover:bg-blue-50'}`}>
                                    <ShieldAlert className={`h-3.5 w-3.5 ${maintenanceMode ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'}`} />
                                </div>
                                <span className="hidden lg:inline">{maintenanceMode ? 'Mode Maintenance Actif' : 'Maintenance'}</span>
                                {maintenanceMode && <span className="flex h-2 w-2 rounded-full bg-white animate-ping"></span>}
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors relative"
                                >
                                    <Bell className="h-6 w-6" />
                                    {notifications.length > 0 && notifications.some(n => !n.is_read) && (
                                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
                                    )}
                                </button>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center text-gray-600 hover:text-red-600 font-medium transition-colors"
                            >
                                <LogOut className="h-5 w-5 mr-2" />
                                <span className="hidden sm:inline">Déconnexion</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Messages */}
                {error && (
                    <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200 flex items-center text-red-700">
                        <AlertCircle className="h-5 w-5 mr-3" />
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className={`mb-4 p-4 rounded-md border flex items-center ${successMsgType === 'error'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-green-50 border-green-200 text-green-700'
                        }`}>
                        {successMsgType === 'error' ? (
                            <AlertCircle className="h-5 w-5 mr-3" />
                        ) : (
                            <CheckCircle className="h-5 w-5 mr-3" />
                        )}
                        {successMsg}
                    </div>
                )}

                {/* KPI Cards & Diagnostics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Consultants Actifs */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex items-center hover:shadow-md transition-shadow">
                        <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div className="ml-5">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Consultants Actifs</h3>
                            <p className="text-2xl font-black text-gray-900 leading-none">{stats.consultants}</p>
                        </div>
                    </div>

                    {/* Dossiers en cours */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex items-center hover:shadow-md transition-shadow">
                        <div className="p-3.5 rounded-2xl bg-teal-50 text-teal-600">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div className="ml-5">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Dossiers en cours</h3>
                            <p className="text-2xl font-black text-gray-900 leading-none">{stats.activeCases}</p>
                        </div>
                    </div>

                    {/* Crédits Distribués - NOUVEAU */}
                    <div className="bg-gradient-to-br from-indigo-500 to-blue-700 rounded-2xl shadow-lg p-6 text-white flex items-center transform hover:scale-[1.02] transition-transform">
                        <div className="p-3.5 rounded-2xl bg-white/20 backdrop-blur-sm">
                            <Activity className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-5">
                            <h3 className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Volume Distribué</h3>
                            <p className="text-2xl font-black text-white leading-none">{financialStats.totalDistributed} <span className="text-[12px] opacity-70">Cr.</span></p>
                            <p className="text-[9px] font-bold text-white/50 mt-1 italic">Somme des soldes actuels</p>
                        </div>
                    </div>

                    {/* Recharges Totales - NOUVEAU */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-l-amber-500 border border-gray-100 flex items-center hover:shadow-md transition-shadow">
                        <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div className="ml-5">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Acheté</h3>
                            <p className="text-2xl font-black text-gray-900 leading-none">{financialStats.totalPurchased} <span className="text-[12px] text-gray-400">Cr.</span></p>
                            <p className="text-[9px] font-bold text-amber-600 mt-1 uppercase tracking-tighter">Volume des recharges</p>
                        </div>
                    </div>
                </div>

                {/* Graph Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Évolution des Consultants</h3>
                                <p className="text-sm text-gray-500">Nouveaux inscrits par mois</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Activity className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#2563EB"
                                        strokeWidth={3}
                                        dot={{ fill: '#2563EB', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Activity Feed and Messages */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-blue-500" />
                                Messages & Activité
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                                Temps réel
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[250px] pr-2 space-y-4 custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center gap-3">
                                    <Activity className="h-8 w-8 text-gray-100" />
                                    <p className="text-sm text-gray-400">Aucun message pour le moment.</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div key={notif.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-gray-900">{notif.title}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-tight">
                                            {notif.content}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <button
                                onClick={fetchNotifications}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-2"
                            >
                                <Plus className="h-3 w-3" /> Voir tout l'historique
                            </button>
                        </div>
                    </div>
                </div>

                {/* Consultants Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Gestion des Consultants</h2>
                            <p className="text-sm text-gray-500">Gérez les accès et le statut de vos partenaires.</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Nouveau Consultant
                        </button>
                    </div>

                    <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solde Crédits</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'inscription</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mot de passe</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Chargement...</td>
                                    </tr>
                                ) : consultants.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Aucun consultant trouvé.</td>
                                    </tr>
                                ) : (
                                    consultants.map((consultant) => (
                                        <tr key={consultant.id} className={`hover:bg-gray-50 transition-colors ${!consultant.is_active ? 'bg-gray-50/50' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${!consultant.is_active ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                                                        {consultant.first_name?.[0]}{consultant.last_name?.[0] || consultant.email[0].toUpperCase()}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 flex items-center">
                                                            {consultant.first_name || 'Non renseigné'} {consultant.last_name || ''}
                                                            {!consultant.is_active && (
                                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 shadow-sm animate-pulse">
                                                                    Gelé
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{consultant.email}</div>
                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                            {consultant.commercial_name || 'Aucune société'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => openStatusConfirmModal(consultant)}
                                                    disabled={togglingConsultantId === consultant.id}
                                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border transition-all ${togglingConsultantId === consultant.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${consultant.is_active
                                                        ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                                        }`}
                                                >
                                                    {togglingConsultantId === consultant.id ? 'Chargement...' : (consultant.is_active ? 'Actif' : 'Suspendu')}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${(consultant.credits_wallet?.balance || 0) >= 5
                                                        ? 'bg-green-100 text-green-800 border-green-200'
                                                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                        }`}>
                                                        {(() => {
                                                            const wallet = consultant.credits_wallet;
                                                            return Array.isArray(wallet) ? (wallet[0]?.balance || 0) : (wallet?.balance || 0);
                                                        })()} Crédits
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(consultant.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <code className="bg-gray-50 px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-600 select-all">
                                                    {consultant.temp_password || '•••••'}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-3">
                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={() => {
                                                            if (!consultant.is_active) return
                                                            setEditConsultant({ ...consultant })
                                                            setOriginalEditConsultant({ ...consultant })
                                                            setShowEditModal(true)
                                                        }}
                                                        disabled={!consultant.is_active}
                                                        className={`transition-colors ${consultant.is_active ? 'text-gray-400 hover:text-blue-600' : 'text-gray-200 cursor-not-allowed'}`}
                                                        title={consultant.is_active ? "Modifier" : "Compte suspendu : modification impossible"}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>

                                                    {/* Credits Button - Fixed Width */}
                                                    <div className="w-24">
                                                        {consultant.is_active ? (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedConsultant(consultant)
                                                                    setShowCreditModal(true)
                                                                }}
                                                                className="inline-flex items-center text-blue-600 hover:text-blue-900 font-semibold"
                                                            >
                                                                <CreditCard className="h-4 w-4 mr-1" />
                                                                + Crédits
                                                            </button>
                                                        ) : (
                                                            <span className="inline-flex items-center text-gray-300 cursor-not-allowed" title="Compte suspendu : impossible d'ajouter des crédits">
                                                                <CreditCard className="h-4 w-4 mr-1" />
                                                                + Crédits
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Send Credentials Button (Email Icon) */}
                                                    {consultant.is_active ? (
                                                        <button
                                                            onClick={() => handleInitiateSendEmail(consultant)}
                                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="Envoyer les identifiants par email"
                                                        >
                                                            <Mail className="h-4 w-4" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-300 cursor-not-allowed" title="Compte suspendu : impossible d'envoyer l'email">
                                                            <Mail className="h-4 w-4" />
                                                        </span>
                                                    )}

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => {
                                                            if (!consultant.is_active) return
                                                            setConsultantToDelete(consultant)
                                                            setShowDeleteConfirmModal(true)
                                                        }}
                                                        disabled={!consultant.is_active}
                                                        className={`transition-colors ${consultant.is_active ? 'text-gray-400 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`}
                                                        title={consultant.is_active ? "Supprimer ce consultant" : "Compte suspendu : suppression impossible"}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal: Create Consultant (Provisioning) */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 transform transition-all">
                            <div className="mb-6 border-b border-gray-100 pb-4">
                                <h3 className="text-xl font-bold text-gray-900">Provisioning Consultant</h3>
                                <p className="text-sm text-gray-500">Créez un compte et allouez des crédits.</p>
                            </div>

                            <form onSubmit={handleCreateConsultant} className="space-y-4">
                                {/* ... (Existing Create Form Fields) ... */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Prénom</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newConsultant.firstName}
                                            onChange={(e) => setNewConsultant({ ...newConsultant, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Nom</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newConsultant.lastName}
                                            onChange={(e) => setNewConsultant({ ...newConsultant, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Nom Commercial / Entreprise</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newConsultant.commercialName}
                                        onChange={(e) => setNewConsultant({ ...newConsultant, commercialName: e.target.value })}
                                        placeholder="Ex: QualiConsult SARL"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Numéro SIRET</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newConsultant.siret}
                                            onChange={(e) => setNewConsultant({ ...newConsultant, siret: e.target.value })}
                                            placeholder="14 chiffres"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Téléphone</label>
                                        <div className="flex w-full relative">
                                            {/* Custom Country Selector */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                                    className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 border-r-0 focus:outline-none focus:ring-2 focus:ring-blue-500 h-full"
                                                    style={{ minWidth: '100px' }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={`https://flagcdn.com/w40/${COUNTRY_CODES.find(c => c.code === newConsultant.countryCode)?.label.toLowerCase()}.png`}
                                                            alt="flag"
                                                            className="w-5 h-auto shadow-sm rounded-sm"
                                                        />
                                                        <span className="text-xs font-bold text-gray-700">
                                                            {newConsultant.countryCode}
                                                        </span>
                                                    </div>
                                                    <MoreHorizontal className="h-3 w-3 text-gray-400 ml-1" />
                                                </button>

                                                {showCountryDropdown && (
                                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[70] max-h-60 overflow-y-auto">
                                                        {COUNTRY_CODES.map(c => (
                                                            <div
                                                                key={c.code}
                                                                onClick={() => {
                                                                    setNewConsultant({ ...newConsultant, countryCode: c.code })
                                                                    setShowCountryDropdown(false)
                                                                }}
                                                                className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                                                            >
                                                                <img
                                                                    src={`https://flagcdn.com/w40/${c.label.toLowerCase()}.png`}
                                                                    alt={c.label}
                                                                    className="w-6 h-auto shadow-sm rounded-sm"
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-gray-900">{c.label}</span>
                                                                    <span className="text-[10px] text-gray-500">{c.code}</span>
                                                                </div>
                                                                {newConsultant.countryCode === c.code && (
                                                                    <Check className="h-3 w-3 text-blue-600 ml-auto" />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <input
                                                type="tel"
                                                required
                                                className="min-w-0 w-full px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={newConsultant.phone}
                                                onChange={(e) => setNewConsultant({ ...newConsultant, phone: e.target.value.replace(/\s/g, '') })}
                                                placeholder="Ex: 612345678"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Email Professionnel</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newConsultant.email}
                                        onChange={(e) => setNewConsultant({ ...newConsultant, email: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Mot de Passe (Provisoire)</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                                            value={newConsultant.password}
                                            onChange={(e) => setNewConsultant({ ...newConsultant, password: e.target.value })}
                                            placeholder="Ex: Pass123!"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Crédits Initiaux</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newConsultant.initialCredits}
                                            onChange={(e) => setNewConsultant({ ...newConsultant, initialCredits: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-3 rounded-lg flex items-start">
                                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                                    <p className="text-[10px] sm:text-xs text-blue-800">
                                        Une fois créé, utilisez l'icône <Mail className="h-3 w-3 inline" /> dans la liste pour lui envoyer ses identifiants.
                                    </p>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                        end
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createLoading}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center shadow-lg shadow-blue-600/20"
                                    >
                                        {createLoading ? 'Création...' : 'Créer le Compte'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Modal: Edit Consultant */}
            {
                showEditModal && editConsultant && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 transform transition-all">
                            <div className="mb-6 border-b border-gray-100 pb-4">
                                <h3 className="text-xl font-bold text-gray-900">Modifier Consultant</h3>
                                <p className="text-sm text-gray-500">Mettre à jour les informations du profil.</p>
                            </div>

                            <form onSubmit={handleUpdateConsultant} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Prénom</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={editConsultant.first_name || ''}
                                            onChange={(e) => setEditConsultant({ ...editConsultant, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Nom</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={editConsultant.last_name || ''}
                                            onChange={(e) => setEditConsultant({ ...editConsultant, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Nom Commercial</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                        value={editConsultant.commercial_name || ''}
                                        readOnly
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Siret</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                            value={editConsultant.siret || ''}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Téléphone</label>
                                        <input
                                            type="tel"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                            value={editConsultant.phone || ''}
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                        value={editConsultant.email || ''}
                                        readOnly
                                        title="L'email ne peut pas être modifié ici pour des raisons de sécurité auth."
                                    />
                                    <p className="text-xs text-gray-400 mt-1">L'email est lié au compte de connexion et ne peut être modifié simplement.</p>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false)
                                            setEditConsultant(null)
                                        }}
                                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editLoading}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center shadow-lg shadow-blue-600/20"
                                    >
                                        {editLoading ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Success Modal (New) */}
            {
                showSuccessModal && createdConsultantParams && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-bounce-in">
                            <div className="bg-green-500 p-6 flex justify-center">
                                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                                    <Check className="h-10 w-10 text-green-500 stroke-[3]" />
                                </div>
                            </div>
                            <div className="p-8 text-center">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Compte Créé !</h3>
                                <p className="text-gray-500 mb-6">
                                    Le consultant <span className="font-bold text-gray-900">{createdConsultantParams.firstName} {createdConsultantParams.lastName}</span> a été ajouté avec succès.
                                </p>

                                <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Email</span>
                                        <span className="text-sm font-medium text-gray-900">{createdConsultantParams.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Crédits</span>
                                        <span className="text-sm font-bold text-green-600">{createdConsultantParams.initialCredits}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Mot de passe</span>
                                        <code className="text-sm font-mono bg-white px-2 py-0.5 rounded border">{createdConsultantParams.password}</code>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowSuccessModal(false)
                                        setCreatedConsultantParams(null)
                                    }}
                                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-600/20"
                                >
                                    Terminer
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal: Add Credits */}
            {
                showCreditModal && selectedConsultant && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center p-4 z-[60]">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Ajouter des Crédits</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Pour {selectedConsultant.first_name || selectedConsultant.email}
                                <br />
                                <span className="font-mono text-xs">ID: {selectedConsultant.id}</span>
                            </p>

                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2 focus:outline-none">
                                    Quantité de Crédits à ajouter
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="shadow appearance-none border rounded w-full py-3 px-3 text-gray-700 leading-tight text-xl font-bold text-center"
                                    value={creditAmount}
                                    onChange={(e) => setCreditAmount(parseInt(e.target.value))}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Solde actuel : <span className="font-bold">{selectedConsultant.credits_wallet?.balance || 0}</span>
                                    {' '} → {' '}
                                    <span className="font-bold text-green-600">
                                        {(selectedConsultant.credits_wallet?.balance || 0) + (parseInt(creditAmount) || 0)}
                                    </span>
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreditModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGrantCredits}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Valider le transfert
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal: Credit Success (New) */}
            {
                showCreditSuccessModal && selectedConsultant && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-bounce-in">
                            <div className="bg-green-100 p-6 flex justify-center">
                                <div className="h-20 w-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                                    <CreditCard className="h-10 w-10 text-white stroke-[2]" />
                                </div>
                            </div>
                            <div className="p-6 text-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Crédits Ajoutés !</h3>
                                <p className="text-gray-500 mb-6 text-sm">
                                    Le transfert de crédits a été effectué avec succès.
                                </p>

                                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3 border border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Bénéficiaire</span>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-gray-900">
                                                {selectedConsultant.first_name || 'Consultant'} {selectedConsultant.last_name || ''}
                                            </div>
                                            <div className="text-xs text-gray-400">{selectedConsultant.email}</div>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-200 my-2"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Montant Ajouté</span>
                                        <span className="text-lg font-bold text-green-600">+{creditAmount} Crédits</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400 uppercase tracking-wide">Nouveau Solde</span>
                                        <span className="text-sm font-bold text-gray-900">
                                            {(selectedConsultant.credits_wallet?.balance || 0) + (parseInt(creditAmount) || 0)} Crédits
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowCreditSuccessModal(false)
                                        setSelectedConsultant(null)
                                        setCreditAmount(10)
                                    }}
                                    className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-lg"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Success Modal (Edit Consultant) */}
            {
                showEditSuccessModal && editConsultant && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-bounce-in">
                            <div className="bg-blue-100 p-6 flex justify-center">
                                <div className="h-20 w-20 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="p-6 text-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Profil Mis à Jour !</h3>
                                <p className="text-gray-500 mb-6 text-sm">
                                    Les informations de ce consultant ont été modifiées avec succès.
                                </p>

                                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3 border border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Société</span>
                                        <span className="text-sm font-medium text-gray-900">{editConsultant.commercial_name || '-'}</span>
                                    </div>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">SIRET</span>
                                        <span className="text-sm font-medium text-gray-900">{editConsultant.siret || '-'}</span>
                                    </div>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Téléphone</span>
                                        <span className="text-sm font-medium text-gray-900">{editConsultant.phone || '-'}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowEditSuccessModal(false)
                                        setEditConsultant(null)
                                    }}
                                    className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-lg"
                                >
                                    C'est noté
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal: Status Toggle Confirmation */}
            {
                showStatusConfirmModal && consultantToToggle && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-bounce-in">
                            <div className="p-6 text-center">
                                <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${consultantToToggle.is_active ? 'bg-red-100' : 'bg-green-100'}`}>
                                    {consultantToToggle.is_active ? (
                                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    ) : (
                                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {consultantToToggle.is_active ? 'Suspendre ce consultant ?' : 'Activer ce consultant ?'}
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Êtes-vous sûr de vouloir {consultantToToggle.is_active ? 'suspendre' : 'activer'} <span className="font-bold">{consultantToToggle.first_name} {consultantToToggle.last_name}</span> ?
                                    <br /><br />
                                    {consultantToToggle.is_active ? (
                                        <span className="text-xs text-red-500">Ce consultant ne pourra plus créer de dossiers ni utiliser ses crédits.</span>
                                    ) : (
                                        <span className="text-xs text-green-500">Ce consultant pourra à nouveau créer des dossiers et utiliser ses crédits.</span>
                                    )}
                                </p>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowStatusConfirmModal(false)
                                            setConsultantToToggle(null)
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleToggleStatus}
                                        className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-colors shadow-lg ${consultantToToggle.is_active
                                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/30'
                                            : 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/30'
                                            }`}
                                    >
                                        {consultantToToggle.is_active ? 'Suspendre' : 'Activer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal: Email Confirmation */}
            {
                showEmailConfirmModal && selectedConsultantForEmail && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-bounce-in">
                            <div className="p-6 text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                                    <Mail className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Envoyer les accès ?</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Êtes-vous sûr de vouloir envoyer l'email de connexion automatique à <span className="font-bold">{selectedConsultantForEmail.first_name} {selectedConsultantForEmail.last_name}</span> ?
                                </p>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowEmailConfirmModal(false)
                                            setSelectedConsultantForEmail(null)
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={confirmSendEmail}
                                        disabled={emailSending}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center"
                                    >
                                        {emailSending ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                                Envoi...
                                            </>
                                        ) : (
                                            'Envoyer'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Modal: Consultant Deletion Confirmation (Enhanced & Professional) */}
            {
                showDeleteConfirmModal && consultantToDelete && (
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[90] animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-bounce-in border border-red-50">
                            {/* Header Image/Icon area */}
                            <div className="bg-red-50 p-8 flex flex-col items-center">
                                <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-red-100 relative">
                                    <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping"></div>
                                    <Trash2 className="h-10 w-10 text-red-600 stroke-[2.5]" />
                                </div>
                            </div>

                            <div className="p-8">
                                <h3 className="text-2xl font-black text-gray-900 text-center mb-2 tracking-tight">Supprimer le consultant ?</h3>
                                <p className="text-gray-500 text-center mb-8 leading-relaxed">
                                    Vous êtes sur le point de retirer <span className="font-extrabold text-red-600 italic underline decoration-red-200 underline-offset-4 tracking-tighter">"{consultantToDelete.first_name || ''} {consultantToDelete.last_name || ''}"</span>.
                                    <br />Toutes ses données seront effacées.
                                </p>

                                <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-2xl p-4 mb-8">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-black text-red-700 uppercase tracking-widest mb-1">Attention Irréversible</p>
                                            <p className="text-[11px] text-red-600 font-medium leading-normal italic">
                                                Cette action supprimera également le portefeuille de crédits et l'historique de cet utilisateur.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirmModal(false)
                                            setConsultantToDelete(null)
                                        }}
                                        className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black transition-all active:scale-95 text-sm"
                                        disabled={isDeleting}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleDeleteConsultant}
                                        disabled={isDeleting}
                                        className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2 text-sm"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Patientez...
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

            {/* Modal: Consultant Deletion Success (New) */}
            {
                showDeleteSuccessModal && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[90]">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-bounce-in">
                            <div className="bg-red-500 p-6 flex justify-center relative overflow-hidden">
                                {/* Graphic background circles */}
                                <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-black/5 rounded-full translate-x-1/3 translate-y-1/3"></div>

                                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10">
                                    <Trash2 className="h-10 w-10 text-red-500 stroke-[2.5]" />
                                </div>
                            </div>
                            <div className="p-8 text-center">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Compte Supprimé</h3>
                                <p className="text-gray-500 mb-6 text-sm">
                                    Le consultant <span className="font-bold text-gray-900">{deletedConsultantName}</span> a été retiré de la plateforme avec succès.
                                </p>

                                <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left border border-gray-100 flex items-center space-x-3">
                                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Check className="h-4 w-4 text-green-600" />
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium">Toutes les données associées ont été nettoyées.</span>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowDeleteSuccessModal(false)
                                        setDeletedConsultantName('')
                                    }}
                                    className="w-full py-3.5 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
                                >
                                    Continuer
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Error Modal (New) */}
            {
                showErrorModal && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-bounce-in border border-red-100">
                            <div className="bg-red-50 p-6 flex justify-center">
                                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500">
                                    <AlertCircle className="h-10 w-10 text-red-500 stroke-[3]" />
                                </div>
                            </div>
                            <div className="p-8 text-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Attention !</h3>
                                <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                                    {error}
                                </p>

                                <button
                                    onClick={() => {
                                        setShowErrorModal(false)
                                    }}
                                    className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 active:scale-95"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Mobile Sidebar Overlay */}
            {
                showMobileMenu && (
                    <div
                        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[70] lg:hidden"
                        onClick={() => setShowMobileMenu(false)}
                    />
                )
            }

            {/* Mobile Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-[80] lg:hidden transform transition-transform duration-300 ease-in-out ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-16 flex items-center px-6 border-b border-gray-100 justify-between">
                    <Logo size="small" />
                    <button onClick={() => setShowMobileMenu(false)} className="text-gray-400">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-4 space-y-2">
                    <button
                        onClick={() => { navigate('/profile'); setShowMobileMenu(false) }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                        <Users className="h-5 w-5" />
                        Mon Profil
                    </button>
                    <button
                        onClick={() => { handleLogout(); setShowMobileMenu(false) }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                    >
                        <LogOut className="h-5 w-5" />
                        Déconnexion
                    </button>
                </div>
            </aside>
            {/* Maintenance Confirmation Modal */}
            {showMaintenanceConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-300 border border-gray-100">
                        <div className={`p-8 text-center ${maintenanceMode ? 'bg-blue-50/50' : 'bg-amber-50/50'}`}>
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner ${
                                maintenanceMode ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                                <ShieldAlert className="h-10 w-10" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">
                                {maintenanceMode ? 'Désactiver la maintenance ?' : 'Activer la maintenance ?'}
                            </h3>
                            <p className="text-gray-500 leading-relaxed">
                                {maintenanceMode 
                                    ? "La plateforme sera à nouveau accessible pour tous les clients et consultants immédiatement."
                                    : "Tous les utilisateurs (hors admins) seront redirigés vers la page de maintenance. Les sessions en cours seront interrompues."
                                }
                            </p>
                        </div>
                        <div className="p-6 bg-white flex gap-3">
                            <button
                                onClick={() => setShowMaintenanceConfirmModal(false)}
                                className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={toggleMaintenanceMode}
                                className={`flex-1 px-6 py-3.5 rounded-2xl text-sm font-black text-white shadow-lg transition-all active:scale-95 ${
                                    maintenanceMode 
                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                                }`}
                            >
                                {maintenanceMode ? 'Confirmer la réouverture' : 'Confirmer l\'activation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
