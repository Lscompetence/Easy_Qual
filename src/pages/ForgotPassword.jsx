import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'
import { ArrowLeft, Check, Mail } from 'lucide-react'

export default function ForgotPassword() {
    const [searchParams] = useSearchParams()
    const roleParam = searchParams.get('role')

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(null)
    const { resetPassword, maintenanceMode } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // 🛠️ MAINTENANCE REDIRECT
    useEffect(() => {
        if (maintenanceMode && roleParam !== 'admin') {
            navigate('/maintenance')
        }
    }, [maintenanceMode, roleParam, navigate])

    const config = useMemo(() => {
        switch (roleParam) {
            case 'admin':
                return {
                    title: 'Espace Administrateur',
                    welcome: 'Réinitialisation Mot de Passe',
                    color: 'blue',
                    buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-600/20',
                    inputClass: 'focus:border-blue-500 focus:ring-blue-500/20',
                    iconClass: 'text-blue-600',
                    iconBgClass: 'bg-blue-100',
                    linkClass: 'text-blue-600 hover:text-blue-500',
                    badgeClass: 'bg-blue-50 text-blue-600 border-blue-100'
                }
            case 'consultant':
                return {
                    title: 'Espace Consultant',
                    welcome: 'Réinitialisation Mot de Passe',
                    color: 'purple',
                    buttonClass: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 shadow-purple-600/20',
                    inputClass: 'focus:border-purple-500 focus:ring-purple-500/20',
                    iconClass: 'text-purple-600',
                    iconBgClass: 'bg-purple-100',
                    linkClass: 'text-purple-600 hover:text-purple-500',
                    badgeClass: 'bg-purple-50 text-purple-600 border-purple-100'
                }
            case 'client':
                return {
                    title: 'Espace Client',
                    welcome: 'Réinitialisation Mot de Passe',
                    color: 'client',
                    buttonClass: 'bg-[#cc6d3e] hover:bg-[#b35d32] focus:ring-purple-500 shadow-purple-600/20',
                    inputClass: 'focus:border-purple-500 focus:ring-purple-500/20',
                    iconClass: 'text-[#cc6d3e]',
                    iconBgClass: 'bg-[#f5e2d6]',
                    linkClass: 'text-[#cc6d3e] hover:text-[#cc6d3e]',
                    badgeClass: 'bg-[#faf1ec] text-[#cc6d3e] border-[#f5e2d6]'
                }
            default:
                return {
                    title: 'Réinitialisation',
                    welcome: 'Mot de passe oublié ?',
                    color: 'blue',
                    buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-600/20',
                    inputClass: 'focus:border-blue-500 focus:ring-blue-500/20',
                    iconClass: 'text-blue-600',
                    iconBgClass: 'bg-blue-100',
                    linkClass: 'text-blue-600 hover:text-blue-500',
                    badgeClass: 'bg-blue-50 text-blue-600 border-blue-100'
                }
        }
    }, [roleParam])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            await resetPassword(email, roleParam || 'admin')
            setSuccess(true)
        } catch (err) {
            console.error(err)
            setError(err.message || 'Impossible d\'envoyer l\'email. Vérifiez que l\'adresse est correcte.')
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

                {!success ? (
                    <>
                        <div className="text-center mb-8">
                            <p className="text-lg font-bold text-gray-900 mb-1">
                                {config.title}
                            </p>
                            <div className="flex justify-center mt-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.badgeClass}`}>
                                    {config.welcome}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">
                                Entrez votre email pour recevoir un lien de réinitialisation.
                            </p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 text-red-600 text-xs py-2 px-3 rounded-md border border-red-100 flex items-center justify-center">
                                    {error}
                                </div>
                            )}

                            <div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className={`h-5 w-5 text-gray-400`} />
                                    </div>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className={`block w-full pl-10 px-4 py-3 rounded-lg border-2 border-gray-100 bg-white text-gray-900 placeholder-gray-400 transition-all outline-none text-sm font-medium ${config.inputClass}`}
                                        placeholder="Votre adresse email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg ${config.buttonClass}`}
                            >
                                {loading ? 'Envoi...' : 'Envoyer le lien'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 ${config.iconBgClass}`}>
                            <Check className={`h-8 w-8 ${config.iconClass}`} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Si un compte existe avec cet email ({email}), vous recevrez les instructions pour réinitialiser votre mot de passe.
                        </p>
                        <p className="text-xs text-gray-400">
                            Vérifiez vos spams si vous ne recevez rien d'ici quelques minutes.
                        </p>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100/50 text-center">
                    <Link
                        to={`/login${location.search}`}
                        className={`inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-900`}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour à la connexion
                    </Link>
                </div>
            </div>
        </div>
    )
}
