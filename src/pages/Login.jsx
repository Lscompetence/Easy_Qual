import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'

export default function Login({ forceRole }) {
    const [searchParams] = useSearchParams()
    const location = useLocation()
    
    // Block the URL parameter 'role=admin' or 'role=internal' to force the use of the secret route
    let roleParam = forceRole || searchParams.get('role') || localStorage.getItem('eq_forgot_password_role') || 'client';
    if (!forceRole && (roleParam === 'admin' || roleParam === 'internal')) {
        roleParam = 'client'; // Fallback to client if someone tries to guess the admin or internal URL
    }

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [isLoggingIn, setIsLoggingIn] = useState(false)

    const { login, logout, maintenanceMode, user, role, profile } = useAuth()
    const navigate = useNavigate()

    // 🌍 AUTO-REDIRECT IF ALREADY LOGGED IN
    useEffect(() => {
        if (isLoggingIn) return; // Do NOT auto-redirect while submitting the login form!
        if (user && role) {
            if (role === 'admin') {
                navigate('/admin/dashboard')
            } else if (role === 'consultant') {
                if (profile?.is_internal === true) {
                    navigate('/internal/dashboard')
                } else if (profile?.is_internal === false) {
                    navigate('/consultant/dashboard')
                }
            } else if (role === 'of') {
                navigate('/client/dashboard')
            }
        }
    }, [user, role, profile, navigate, isLoggingIn])

    // 🛠️ MAINTENANCE REDIRECT
    useEffect(() => {
        if (maintenanceMode && roleParam !== 'admin') {
            navigate('/maintenance')
        }
    }, [maintenanceMode, roleParam, navigate])

    // Detect recovery session or link error hash from email click
    useEffect(() => {
        const handleAuthCallback = async () => {
            const hash = window.location.hash
            
            // 1. Detect if it's an error callback (e.g. OTP link expired)
            if (hash.includes('error=') || hash.includes('error_code=')) {
                const params = new URLSearchParams(hash.substring(1)) // Remove '#'
                const errorDesc = params.get('error_description') || 'Le lien de réinitialisation est invalide ou a expiré.'
                const decodedDesc = decodeURIComponent(errorDesc.replace(/\+/g, ' '))
                setError(`Erreur de réinitialisation : ${decodedDesc}`)
                window.history.replaceState(null, null, window.location.pathname + window.location.search)
                return
            }

            // 2. Detect password recovery callback
            if (hash.includes('type=recovery') || hash.includes('access_token')) {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    const metaRole = session.user.user_metadata?.role || session.user.app_metadata?.role
                    let finalRole = metaRole || 'client'
                    
                    if (!metaRole) {
                        const { data: prof } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', session.user.id)
                            .maybeSingle()
                        if (prof?.role) finalRole = prof.role
                    }
                    navigate(`/update-password?role=${finalRole === 'of' ? 'client' : finalRole}`)
                }
            }
        }
        handleAuthCallback()
    }, [location.hash, navigate])

    const getRoleConfig = () => {
        switch (roleParam) {
            case 'admin':
                return {
                    title: 'Espace Administrateur',
                    welcome: 'Bienvenue Administrateur',
                    color: 'blue',
                    buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-600/20',
                    inputClass: 'focus:border-blue-500 focus:ring-blue-500/20',
                    linkClass: 'text-blue-600 hover:text-blue-500',
                    badgeClass: 'bg-blue-50 text-blue-600 border-blue-100'
                }
            case 'internal':
                return {
                    title: 'Espace Collaborateur Interne',
                    welcome: 'Accès Interne Réservé',
                    color: 'purple', // Reuses the logo/icon shape but we style button green!
                    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-600/20',
                    inputClass: 'focus:border-emerald-500 focus:ring-emerald-500/20',
                    linkClass: 'text-emerald-600 hover:text-emerald-500',
                    badgeClass: 'bg-emerald-50 text-emerald-750 border-emerald-100 font-bold'
                }
            case 'consultant':
                return {
                    title: 'Espace Consultant',
                    welcome: 'Bienvenue Consultant',
                    color: 'purple',
                    buttonClass: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 shadow-purple-600/20',
                    inputClass: 'focus:border-purple-500 focus:ring-purple-500/20',
                    linkClass: 'text-purple-600 hover:text-purple-500',
                    badgeClass: 'bg-purple-50 text-purple-600 border-purple-100'
                }
            case 'client':
                return {
                    title: 'Espace Client',
                    welcome: 'Bienvenue Client',
                    color: 'client',
                    buttonClass: 'bg-[#cc6d3e] hover:bg-[#e08c50] focus:ring-[#cc6d3e] shadow-[#cc6d3e]/20',
                    inputClass: 'focus:border-[#cc6d3e] focus:ring-[#cc6d3e]/20',
                    linkClass: 'text-[#cc6d3e] hover:text-[#e08c50]',
                    badgeClass: 'bg-[#cc6d3e]/10 text-[#cc6d3e] border-[#cc6d3e]/20'
                }
            default:
                return {
                    title: 'Connectez-vous à votre espace',
                    welcome: 'Bienvenue',
                    color: 'blue', // Default
                    buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-600/20',
                    inputClass: 'focus:border-blue-500 focus:ring-blue-500/20',
                    linkClass: 'text-blue-600 hover:text-blue-500',
                    badgeClass: 'bg-blue-50 text-blue-600 border-blue-100'
                }
        }
    }

    const config = getRoleConfig()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        setIsLoggingIn(true)

        // Nettoyer l'email, mais GARDER le mot de passe tel quel (les espaces comptent)
        const cleanEmail = email.trim().toLowerCase()
        const rawPassword = password



        try {
            // Race between Login and a 30s Timeout
            const loginPromise = login(cleanEmail, rawPassword)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 30000)
            )

            // Note sécurité : l'ancien mécanisme de "self-healing" (réparation de compte via un appel
            // non authentifié à invite-client) a été retiré — la fonction exige désormais un appelant
            // authentifié consultant/admin. Un compte client cassé se répare via "Renvoyer les accès".
            const authResponse = await Promise.race([loginPromise, timeoutPromise])

            const { user } = authResponse;

            // 1. Get User Role from metadata
            const actualRole = user?.user_metadata?.role || 'of'

            // 2. STRICT ROLE VERIFICATION
            if (roleParam === 'client' && actualRole !== 'of') {
                await logout();
                sessionStorage.clear();
                localStorage.removeItem('easyqual-auth-token');
                throw new Error('Accès refusé. Veuillez utiliser la page de connexion Espace Consultant.');
            }
            if (roleParam === 'consultant') {
                if (actualRole !== 'consultant') {
                    await logout();
                    sessionStorage.clear();
                    localStorage.removeItem('easyqual-auth-token');
                    throw new Error('Accès refusé. Veuillez utiliser la page de connexion Espace Client.');
                }
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('is_internal')
                    .eq('id', user.id)
                    .maybeSingle();
                
                if (prof?.is_internal) {
                    await logout();
                    sessionStorage.clear();
                    localStorage.removeItem('easyqual-auth-token');
                    throw new Error("Accès refusé. C'est impossible de se connecter à une session pour laquelle vous n'avez pas le droit de vous authentifier.");
                }
            }
            if (roleParam === 'admin' && actualRole !== 'admin') {
                await logout();
                throw new Error('Accès refusé. Réservé aux administrateurs.');
            }
            if (roleParam === 'internal') {
                if (actualRole !== 'consultant') {
                    await logout();
                    sessionStorage.clear();
                    localStorage.removeItem('easyqual-auth-token');
                    throw new Error('Accès refusé.');
                }
                const { data: prof, error: profError } = await supabase
                    .from('profiles')
                    .select('is_internal')
                    .eq('id', user.id)
                    .maybeSingle();
                
                if (profError || !prof || !prof.is_internal) {
                    await logout();
                    sessionStorage.clear();
                    localStorage.removeItem('easyqual-auth-token');
                    throw new Error("Accès refusé. C'est impossible de se connecter à une session pour laquelle vous n'avez pas le droit de vous authentifier.");
                }
            }

            // 3. REDIRECT based on role
            if (actualRole === 'admin') {
                navigate('/admin/dashboard')
            } else if (actualRole === 'consultant') {
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('is_internal')
                    .eq('id', user.id)
                    .maybeSingle();

                if (prof?.is_internal) {
                    navigate('/internal/dashboard')
                } else {
                    navigate('/consultant/dashboard')
                }
            } else if (actualRole === 'of') {
                navigate('/client/dashboard')
            } else {
                navigate('/')
            }
        } catch (err) {
            console.error('Full Login Error:', err)
            if (err.message === 'Timeout') {
                setError('Le serveur met trop de temps à répondre. Vérifiez votre connexion.')
            } else if (err.status === 400 || err.message?.includes('Invalid login credentials')) {
                setError('Email ou mot de passe incorrect.')
            } else {
                setError(err.message || 'Une erreur est survenue lors de la connexion.')
            }
        } finally {
            setLoading(false)
            setIsLoggingIn(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 border border-gray-100 animate-page-entry">
                {/* Logo Section */}
                <div className="text-center mb-10 flex justify-center">
                    <Logo size="large" color={config.color} />
                </div>
                
                <div className="text-center mb-8">
                    <p className="text-lg font-bold text-gray-900 mb-1">
                        {config.title}
                    </p>
                    <div className="flex justify-center mt-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.badgeClass}`}>
                            {config.welcome}
                        </span>
                    </div>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-600 text-xs py-2 px-3 rounded-md border border-red-100 flex items-center justify-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className={`block w-full px-4 py-3 rounded-lg border-2 border-gray-100 bg-white text-gray-900 placeholder-gray-400 transition-all outline-none text-sm font-medium ${config.inputClass}`}
                                placeholder="Adresse Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className={`block w-full px-4 py-3 rounded-lg border-2 border-gray-100 bg-white text-gray-900 placeholder-gray-400 transition-all outline-none text-sm font-medium ${config.inputClass}`}
                                placeholder="Mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Link
                                to={`/forgot-password?role=${roleParam}`}
                                className={`text-sm font-medium transition-colors ${config.linkClass}`}
                            >
                                Mot de passe oublié ?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg ${config.buttonClass}`}
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Se connecter'
                        )}
                    </button>

                </form>
            </div>
        </div>
    )
}
