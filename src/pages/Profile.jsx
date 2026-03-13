import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { User, Lock, Mail, Save, ArrowLeft, Check, Eye, EyeOff, Camera, AlertCircle, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ConsultantSidebar from '../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../components/consultant/ConsultantTopBar'

export default function Profile() {
    const { user, role, refreshProfile, profile } = useAuth()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [updatingInfo, setUpdatingInfo] = useState(false)
    const [updatingPassword, setUpdatingPassword] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [message, setMessage] = useState({ type: '', content: '' })
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [initialized, setInitialized] = useState(false)

    // Dynamic theme based on role
    const isAdmin = role === 'admin'
    const isConsultant = role === 'consultant'

    const theme = {
        primary: isAdmin ? 'blue' : 'purple',
        bg: isAdmin ? 'bg-blue-600' : 'bg-purple-600',
        bgLight: isAdmin ? 'bg-blue-50' : 'bg-purple-50',
        text: isAdmin ? 'text-blue-600' : 'text-purple-600',
        textDark: isAdmin ? 'text-blue-700' : 'text-purple-700',
        border: isAdmin ? 'border-blue-200' : 'border-purple-200',
        ring: isAdmin ? 'focus:ring-blue-500' : 'focus:ring-purple-500',
        shadow: isAdmin ? 'shadow-blue-600/20' : 'shadow-purple-600/20',
        hover: isAdmin ? 'hover:bg-blue-700' : 'hover:bg-purple-700',
        hoverText: isAdmin ? 'hover:text-blue-600' : 'hover:text-purple-600',
        avatarBg: isAdmin ? 'bg-blue-50' : 'bg-purple-50',
        avatarIcon: isAdmin ? 'text-blue-200' : 'text-purple-200'
    }

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: ''
    })

    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    })

    // Initialization Effect
    useEffect(() => {
        if ((user || profile) && !initialized) {
            setFormData({
                first_name: profile?.first_name || '',
                last_name: profile?.last_name || '',
                email: profile?.email || user?.email || ''
            })
            setLoading(false)
            if (profile) setInitialized(true)
        }
    }, [user, profile, initialized])

    const handleUploadAvatar = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            setIsUploadingAvatar(true)
            setMessage({ type: '', content: '' })

            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}-${Math.random()}.${fileExt}`

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // 3. Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id)

            if (updateError) throw updateError

            await refreshProfile()

            setMessage({ type: 'success', content: 'Photo de profil mise à jour !' })
            setTimeout(() => setMessage({ type: '', content: '' }), 6000)

        } catch (error) {
            console.error('Error uploading avatar:', error)
            setMessage({ type: 'error', content: "Erreur lors de l'upload. Vérifiez que le bucket 'avatars' existe et est public." })
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setUpdatingInfo(true)
        setMessage({ type: '', content: '' })

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name
                })
                .eq('id', user.id)

            if (error) throw error

            await refreshProfile()
            setMessage({ type: 'success', content: 'Profil mis à jour avec succès.' })
            setTimeout(() => setMessage({ type: '', content: '' }), 6000)
        } catch (error) {
            setMessage({ type: 'error', content: 'Erreur lors de la mise à jour.' })
        } finally {
            setUpdatingInfo(false)
        }
    }

    const handleUpdatePassword = async (e) => {
        e.preventDefault()

        if (!passwordData.newPassword && !passwordData.confirmPassword) return

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', content: 'Les mots de passe ne correspondent pas.' })
            return
        }

        setUpdatingPassword(true)
        setMessage({ type: '', content: '' })

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            })

            if (error) throw error

            setShowSuccessModal(true)
            setPasswordData({ newPassword: '', confirmPassword: '' })
        } catch (error) {
            setMessage({ type: 'error', content: error.message })
        } finally {
            setUpdatingPassword(false)
        }
    }

    // JSX Content Extracted - Centered & Equal Size
    const content = (
        <div className="w-full max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
            {/* 1. Header Card - Extends full width of container */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group transition-all duration-300 hover:shadow-md hover:border-slate-200">
                {/* Banner Gradient */}
                <div className={`h-32 w-full ${isAdmin ? 'bg-gradient-to-r from-slate-800 to-slate-900' : 'bg-gradient-to-r from-indigo-600 to-violet-700'} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                <div className="px-6 pb-6 relative">
                    <div className="flex flex-col md:flex-row items-end gap-6 -mt-12">
                        {/* Avatar */}
                        <div className="relative group/avatar shrink-0 z-10 mx-auto md:mx-0">
                            <label className="cursor-pointer block relative">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleUploadAvatar}
                                    disabled={isUploadingAvatar}
                                />
                                <div className="h-32 w-32 rounded-2xl border-[5px] border-white shadow-xl bg-white overflow-hidden relative transition-all duration-500 ease-out group-hover/avatar:scale-105 group-hover/avatar:shadow-indigo-500/20 transform md:rotate-2 group-hover/avatar:rotate-0">
                                    {profile?.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt="Profile"
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                                        />
                                    ) : (
                                        <div className={`h-full w-full flex items-center justify-center ${theme.bgLight}`}>
                                            <User className={`h-12 w-12 ${theme.text}`} />
                                        </div>
                                    )}
                                    {isUploadingAvatar ? (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                            <div className="h-6 w-6 border-2 border-white/80 border-t-transparent animate-spin rounded-full"></div>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                                            <Camera className="h-8 w-8 text-white drop-shadow-lg transform scale-90 group-hover/avatar:scale-100 transition-transform" />
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 pb-1 w-full md:w-auto text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div>
                                    <div className="flex flex-col md:flex-row items-center gap-2 mb-1">
                                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight hover:text-indigo-600 transition-colors cursor-default">
                                            {formData.first_name} {formData.last_name}
                                        </h1>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${isAdmin ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-purple-600 text-white border-purple-600 shadow-purple-200'}`}>
                                            {role === 'consultant' ? 'Consultant' : (role === 'admin' ? 'Administrateur' : role)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 flex items-center justify-center md:justify-start gap-1.5 hover:text-indigo-500 transition-colors">
                                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                                        {formData.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            {message.content && (
                <div className={`p-4 rounded-xl flex items-start shadow-sm animate-slideIn ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                    {message.type === 'success' ? <Check className="h-5 w-5 mr-3 mt-0.5 shrink-0" /> : <AlertCircle className="h-5 w-5 mr-3 mt-0.5 shrink-0" />}
                    <div>
                        <p className="text-sm font-bold">{message.type === 'success' ? 'Succès' : 'Attention'}</p>
                        <p className="text-xs opacity-90 mt-0.5">{message.content}</p>
                    </div>
                </div>
            )}

            {/* 2. Grid Layout - Equal Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

                {/* Personal Info Form - 50% width */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:border-indigo-100 group/card transform hover:-translate-y-0.5 h-full">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-50/50 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className={`p-2 rounded-lg shadow-sm ${theme.bgLight} text-indigo-600 ring-1 ring-indigo-50 transition-transform group-hover/card:scale-110 duration-300`}>
                                <User className={`h-4 w-4`} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 tracking-tight group-hover/card:text-indigo-700 transition-colors uppercase">Informations</h2>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex-1 bg-white relative flex flex-col">
                        <form onSubmit={handleUpdateProfile} className="space-y-6 h-full flex flex-col relative z-10">
                            <div className="space-y-6 flex-1">
                                <div className="group/input relative transition-all duration-300 hover:scale-[1.01]">
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide group-hover/input:text-indigo-600 transition-colors pl-0.5">Prénom</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-indigo-300 hover:bg-white hover:shadow-sm"
                                        autoComplete="given-name"
                                    />
                                </div>
                                <div className="group/input relative transition-all duration-300 hover:scale-[1.01]">
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide group-hover/input:text-indigo-600 transition-colors pl-0.5">Nom</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-indigo-300 hover:bg-white hover:shadow-sm"
                                        autoComplete="family-name"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 mt-auto">
                                <button
                                    type="submit"
                                    disabled={updatingInfo}
                                    className={`w-full flex items-center justify-center px-4 py-3.5 rounded-xl font-bold text-sm text-white shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group-hover/card:shadow-lg ${isAdmin ? 'bg-slate-800 hover:bg-slate-900' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'}`}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {updatingInfo ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Password Form - 50% width */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:border-indigo-100 group/card transform hover:-translate-y-0.5 h-full">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-50/50 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className={`p-2 rounded-lg shadow-sm ${theme.bgLight} text-indigo-600 ring-1 ring-indigo-50 transition-transform group-hover/card:scale-110 duration-300`}>
                                <Lock className={`h-4 w-4`} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 tracking-tight group-hover/card:text-indigo-700 transition-colors uppercase">Sécurité</h2>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex-1 bg-white relative flex flex-col">
                        <form onSubmit={handleUpdatePassword} className="space-y-6 h-full flex flex-col relative z-10">
                            <div className="space-y-6 flex-1">
                                <div className="group/input relative transition-all duration-300 hover:scale-[1.01]">
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide group-hover/input:text-indigo-600 transition-colors pl-0.5">Nouveau mot de passe</label>
                                    <div className="relative group/field">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-indigo-300 hover:bg-white hover:shadow-sm pr-10"
                                            placeholder="Min. 6 caractères"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-indigo-600 transition-colors bg-transparent p-0.5 rounded hover:bg-indigo-50"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="group/input relative transition-all duration-300 hover:scale-[1.01]">
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide group-hover/input:text-indigo-600 transition-colors pl-0.5">Confirmer</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-indigo-300 hover:bg-white hover:shadow-sm"
                                        placeholder="Répétez le mot de passe"
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 mt-auto">
                                <button
                                    type="submit"
                                    disabled={updatingPassword}
                                    className="w-full flex items-center justify-center px-4 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-70 group-hover/card:border-indigo-200 group-hover/card:text-indigo-700"
                                >
                                    <Lock className="h-4 w-4 mr-2 text-slate-400 group-hover/card:text-indigo-400 transition-colors" />
                                    {updatingPassword ? 'Modification...' : 'Changer mot de passe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    )

    // Layout Wrapper - Flex layout with Sidebar on the left
    return (
        <div className="bg-gray-50 min-h-screen font-sans flex text-slate-800">
            {/* Sidebar for Consultant */}
            {isConsultant && (
                <ConsultantSidebar isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* No TopBar as requested, but we need the Mobile Menu toggle for small screens */}
                {isConsultant && (
                    <div className="lg:hidden p-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-40">
                        <button
                            onClick={() => setShowMobileMenu(true)}
                            className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">Mon Profil</span>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                        <div className="w-full max-w-4xl space-y-8 animate-fadeIn">
                            {/* Navigation Header for non-consultants or secondary navigation */}
                            {!isConsultant && (
                                <div className="flex items-center justify-between mb-8">
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="flex items-center text-gray-400 hover:text-indigo-600 transition-colors font-bold group bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                                        Retour
                                    </button>
                                </div>
                            )}

                            {/* Center Profile Content */}
                            {content}
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-gray-900/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-bounce-in">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="h-10 w-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Mot de Passe Modifié !</h3>
                        <p className="text-gray-500 mb-8">Votre compte est sécurisé.</p>
                        <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
