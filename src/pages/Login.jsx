import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'

export default function Login({ forceRole }) {
    const [searchParams] = useSearchParams()
    const location = useLocation()
    
    // Block the URL parameter 'role=admin' to force the use of the secret route
    let roleParam = forceRole || searchParams.get('role') || 'client';
    if (!forceRole && roleParam === 'admin') {
        roleParam = 'client'; // Fallback to client if someone tries to guess the admin URL
    }

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const { login, logout, maintenanceMode } = useAuth()
    const navigate = useNavigate()

    // 🛠️ MAINTENANCE REDIRECT
    useEffect(() => {
        if (maintenanceMode && roleParam !== 'admin') {
            navigate('/maintenance')
        }
    }, [maintenanceMode, roleParam, navigate])

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

        // Nettoyer l'email, mais GARDER le mot de passe tel quel (les espaces comptent)
        const cleanEmail = email.trim().toLowerCase()
        const rawPassword = password



        try {
            // Race between Login and a 30s Timeout
            const loginPromise = login(cleanEmail, rawPassword)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 30000)
            )

            let authResponse;
            try {
                authResponse = await Promise.race([loginPromise, timeoutPromise])
            } catch (err) {
                // 🛠️ SELF-HEALING LOGIC for CLIENTS
                // If login fails and we are in the client space, let's check if the account exists in tenants but not in Auth
                if (roleParam === 'client' && (err.status === 400 || err.message?.includes('Invalid login credentials'))) {


                    // 1. Check if email exists in tenants table
                    const { data: tenant } = await supabase
                        .from('tenants')
                        .select('id, name, initial_password')
                        .eq('client_email', cleanEmail)
                        .single();

                    // 2. If found and the password matches the one in our records
                    if (tenant && tenant.initial_password === rawPassword) {


                        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                        // Call repair function
                        const repairRes = await fetch(`${supabaseUrl}/functions/v1/invite-client`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': anonKey,
                                'Authorization': `Bearer ${anonKey}`
                            },
                            body: JSON.stringify({
                                email: cleanEmail,
                                password: rawPassword,
                                tenant_id: tenant.id,
                                tenant_name: tenant.name
                            })
                        });

                        if (repairRes.ok) {

                            // Try login again after repair
                            authResponse = await login(cleanEmail, rawPassword);
                        } else {
                            throw err; // If repair fails, throw original login error
                        }
                    } else {
                        throw err;
                    }
                } else {
                    throw err;
                }
            }

            const { user } = authResponse;

            // 1. Get User Role from metadata
            const actualRole = user?.user_metadata?.role || 'of'

            // 2. STRICT ROLE VERIFICATION
            if (roleParam === 'client' && actualRole !== 'of') {
                await logout();
                throw new Error('Accès refusé. Veuillez utiliser la page de connexion Espace Consultant.');
            }
            if (roleParam === 'consultant' && actualRole !== 'consultant') {
                await logout();
                throw new Error('Accès refusé. Veuillez utiliser la page de connexion Espace Client.');
            }
            if (roleParam === 'admin' && actualRole !== 'admin') {
                await logout();
                throw new Error('Accès refusé. Réservé aux administrateurs.');
            }

            // 3. REDIRECT based on role
            if (actualRole === 'admin') {
                navigate('/admin/dashboard')
            } else if (actualRole === 'consultant') {
                navigate('/consultant/dashboard')
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
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 border border-gray-100">
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
                                to={`/forgot-password${location.search}`}
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
