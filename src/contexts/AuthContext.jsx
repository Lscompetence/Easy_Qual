import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [maintenanceMode, setMaintenanceMode] = useState(false)

    useEffect(() => {
        let mounted = true

        // 1. SAFETY FALLBACK (2.5s)
        // Ensure we NEVER get stuck on the white screen, even if Supabase hangs.
        // 2.5s is enough for most connections, but short enough to feel "fast".
        const safetyTimer = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth check taking too long, force releasing loading state.')
                // Don't auto-logout if we have a token in storage, let's keep spinning a bit longer or degrade gracefully?
                // For now, just extending to 5s helps most users.
                setLoading(false)
            }
        }, 5000)

        // Initialize Session
        const initAuth = async () => {
            // Fetch Maintenance Status first
            fetchMaintenanceStatus()
            try {
                // Determine if we have a session
                const { data: { session } } = await supabase.auth.getSession()

                if (mounted) {
                    if (session?.user) {
                        setUser(session.user)
                        // OPTIMISTIC ROLE SETTING: Use metadata immediately to prevent 403
                        const metaRole = session.user.user_metadata?.role || session.user.app_metadata?.role
                        if (metaRole) {
                            setRole(metaRole)
                            setLoading(false) // FAST TRACK
                        }

                        // Fetch full profile (async, but role is already safe)
                        fetchUserProfile(session.user.id).catch(err => console.error("Profile Bg Error", err))
                    } else {
                        setLoading(false)
                    }
                }
            } catch (error) {
                console.error('Auth initialization failed:', error)
                if (mounted) setLoading(false)
            }
        }

        initAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return

            setUser(session?.user ?? null)

            if (session?.user) {
                // OPTIMISTIC ROLE SETTING
                const metaRole = session.user.user_metadata?.role || session.user.app_metadata?.role
                if (metaRole) {
                    setRole(metaRole)
                    setLoading(false)
                }

                fetchUserProfile(session.user.id).catch(err => console.error(err))
            } else {
                setRole(null)
                setProfile(null)
                setLoading(false)
            }
        })

        // Listen for maintenance mode changes
        const settingsChannel = supabase
            .channel('system_settings_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'system_settings'
            }, (payload) => {
                if (payload.new && payload.new.key === 'maintenance_mode') {
                    setMaintenanceMode(payload.new.value === true)
                }
            })
            .subscribe()

        return () => {
            mounted = false
            clearTimeout(safetyTimer)
            subscription.unsubscribe()
            settingsChannel.unsubscribe()
        }
    }, [])

    const fetchUserProfile = async (userId) => {
        try {
            // Race condition: Fetch data or timeout after 5s
            const fetchPromise = supabase
                .from('profiles')
                .select('role, first_name, last_name, email, avatar_url, is_active, commercial_name')
                .eq('id', userId)
                .single()

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            )

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

            if (error) throw error

            setRole(data?.role ?? 'of')
            setProfile(data)

        } catch (error) {
            console.error('Error fetching profile:', error)
            // If fetch fails (timeout or error), default to safe role but don't block
            // setRole('of') // Optional: Default to lowest priv, or let nullable
        } finally {
            setLoading(false)
        }
    }

    const fetchMaintenanceStatus = async () => {
        try {
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'maintenance_mode')
                .single()
            if (data) {
                setMaintenanceMode(data.value === true)
            }
        } catch (err) {
            console.error('Error fetching maintenance status:', err)
        }
    }

    const refreshProfile = async () => {
        if (user) await fetchUserProfile(user.id)
    }

    const login = async (email, password) => {
        // Direct Login without artificial delays
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            console.error('❌ Full Login Error:', error)
            // Some AuthApiErrors contain more detail in the __originalError property or similar
            if (error.message.includes('schema')) {
                console.info('💡 Hint: Check triggers on auth.users or profiles table in Supabase Dashboard.')
            }
            throw error
        }
        return data
    }

    const logout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    const resetPassword = async (email, requiredRole = 'client') => {
        const cleanEmail = email.trim().toLowerCase()

        // 🛡️ SECURITY CHECK: Verify if email exists AND matches the required role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('email', cleanEmail)
            .maybeSingle()

        // Au lieu de bloquer (à cause du RLS Supabase), on affiche un avertissement.
        if (profileError) {
            console.warn("Impossible de vérifier le rôle avant l'envoi (vérifiez les Policies RLS Supabase):", profileError)
        }

        // Si on a réussi à lire le profil, on vérifie strictement le rôle
        if (profile && profile.role !== requiredRole) {
            const roleLabels = {
                'admin': 'Administrateur',
                'consultant': 'Consultant',
                'client': 'Client'
            }
            throw new Error(`Accès refusé. Cet e-mail est lié à un compte ${roleLabels[profile.role] || profile.role}.`)
        }

        // Si le profil n'est pas lu (RLS) ou si le rôle est bon, on procède à l'envoi
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: `${window.location.origin}/update-password?role=${requiredRole}`,
        })
        if (error) throw error
    }

    return (
        <AuthContext.Provider value={{ user, role, profile, refreshProfile, login, logout, resetPassword, loading, maintenanceMode }}>
            {loading ? (
                <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
                    {/* Minimalist Spinner */}
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    )
}
