import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Logo from '../components/Logo'

export default function UpdatePassword() {
    const [searchParams] = useSearchParams()
    const roleParam = searchParams.get('role')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null) // { type: 'error' | 'success', text: '' }
    const navigate = useNavigate()

    const config = useMemo(() => {
        switch (roleParam) {
            case 'admin':
                return {
                    title: 'Espace Administrateur',
                    welcome: 'Réinitialisation',
                    color: 'blue',
                    buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-600/20',
                    inputClass: 'focus:border-blue-500 focus:ring-blue-500/20',
                    badgeClass: 'bg-blue-50 text-blue-600 border-blue-100'
                }
            case 'consultant':
                return {
                    title: 'Espace Consultant',
                    welcome: 'Réinitialisation',
                    color: 'purple',
                    buttonClass: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 shadow-purple-600/20',
                    inputClass: 'focus:border-purple-500 focus:ring-purple-500/20',
                    badgeClass: 'bg-purple-50 text-purple-600 border-purple-100'
                }
            case 'client':
                return {
                    title: 'Espace Client',
                    welcome: 'Réinitialisation',
                    color: 'client',
                    buttonClass: 'bg-[#cc6d3e] hover:bg-[#b35d32] focus:ring-[#cc6d3e] shadow-[#cc6d3e]/20',
                    inputClass: 'focus:border-[#cc6d3e] focus:ring-[#cc6d3e]/20',
                    badgeClass: 'bg-[#cc6d3e]/10 text-[#cc6d3e] border-[#cc6d3e]/20'
                }
            default:
                return {
                    title: 'Espace Global',
                    welcome: 'Réinitialisation',
                    color: 'blue',
                    buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-600/20',
                    inputClass: 'focus:border-blue-500 focus:ring-blue-500/20',
                    badgeClass: 'bg-blue-50 text-blue-600 border-blue-100'
                }
        }
    }, [roleParam])

    const [checking, setChecking] = useState(true)

    // Check for session or recovery token in URL
    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (mounted && session) {
                setChecking(false)
            }
        }

        checkAuth()

        // Listen for the session being established (from detectSessionInUrl: true)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (mounted) {
                if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || session) {
                    setChecking(false)
                    setMessage(null)
                }
            }
        })

        // Safety Fallback: Only show error if after 5s we still have no session 
        // AND the URL doesn't look like a recovery attempt.
        const timer = setTimeout(() => {
            if (mounted && checking) {
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (mounted && !session) {
                        const hasToken = window.location.hash.includes('access_token') ||
                            window.location.search.includes('code=')

                        if (!hasToken) {
                            setMessage({ type: 'error', text: 'Le lien est déjà utilisé ou a expiré.' })
                        } else {
                            // If we HAVE a token but NO session after 5s, then it's a real failure
                            setMessage({ type: 'error', text: 'Le lien semble invalide ou la connexion avec Supabase a échoué.' })
                        }
                    }
                    setChecking(false)
                })
            }
        }, 5000)

        return () => {
            mounted = false
            subscription.unsubscribe()
            clearTimeout(timer)
        }
    }, []) // Run once on mount

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' })
            return
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' })
            return
        }

        setLoading(true)
        setMessage(null)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error
            // 📝 Update profile with new password for admin visibility
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Update profile (consultants and others)
                await supabase
                    .from('profiles')
                    .update({ temp_password: password })
                    .eq('id', user.id)
                
                // Update tenant (clients specifically)
                if (roleParam === 'client' || user.user_metadata?.role === 'of') {
                    await supabase
                        .from('tenants')
                        .update({ initial_password: password })
                        .eq('owner_id', user.id)
                }
            }

            setMessage({ type: 'success', text: 'Votre mot de passe a été mis à jour avec succès !' })

            setTimeout(() => {
                navigate(roleParam ? `/login?role=${roleParam}` : '/login')
            }, 2000)

        } catch (error) {
            console.error('Error updating password:', error)
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    if (checking && window.location.hash.includes('access_token')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Vérification de sécurité...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 border border-gray-100">
                <div className="text-center mb-10 flex justify-center">
                    <Logo size="large" color={config.color} />
                </div>
                <div className="text-center mb-8">
                    <p className="text-lg font-bold text-gray-900 mb-1">
                        {config.title}
                    </p>
                    <div className="flex justify-center mt-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.badgeClass}`}>
                            {config.welcome}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Veuillez définir votre nouveau mot de passe sécurisé.
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {message && (
                        <div className={`text-xs py-2 px-3 rounded-md border text-center ${message.type === 'success'
                            ? 'bg-green-50 text-green-600 border-green-100'
                            : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                            {message.text}
                            {message.type === 'error' && (
                                <div className="mt-1">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/forgot-password')}
                                        className="underline font-bold"
                                    >
                                        Réessayer l'envoi
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <input
                                type="password"
                                required
                                className={`block w-full px-4 py-3 rounded-lg border-2 border-gray-100 bg-white text-gray-900 placeholder-gray-400 transition-all outline-none text-sm font-medium ${config.inputClass}`}
                                placeholder="Nouveau mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                className={`block w-full px-4 py-3 rounded-lg border-2 border-gray-100 bg-white text-gray-900 placeholder-gray-400 transition-all outline-none text-sm font-medium ${config.inputClass}`}
                                placeholder="Confirmer le mot de passe"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg ${config.buttonClass}`}
                    >
                        {loading ? 'Enregistrement...' : 'Mettre à jour'}
                    </button>
                </form>
            </div>
        </div>
    )
}
