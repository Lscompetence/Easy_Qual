import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { User, Lock, Mail, Save, Eye, EyeOff, Camera, Check, AlertCircle } from 'lucide-react'
import ClientSidebar from '../../components/client/ClientSidebar'
import ClientTopBar from '../../components/client/ClientTopBar'

export default function ClientProfile() {
    const { user, role, refreshProfile, profile } = useAuth()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [updatingInfo, setUpdatingInfo] = useState(false)
    const [updatingPassword, setUpdatingPassword] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [message, setMessage] = useState({ type: '', content: '' })
    const [initialized, setInitialized] = useState(false)
    const [consultantName, setConsultantName] = useState('')
    const [indicatorStates, setIndicatorStates] = useState({})
    const [myCase, setMyCase] = useState(null)
    const [quizUploads, setQuizUploads] = useState({})
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '' })
    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' })
    const [indicators, setIndicators] = useState([
        { id: 1, criterion_id: 1, label: "Information accessible au public, détaillée et vérifiable.", criteria: { id: 1, label: "Information du public" } },
        { id: 2, criterion_id: 1, label: "Indicateurs de résultats adaptés à la nature des prestations.", criteria: { id: 1, label: "Information du public" } },
        { id: 3, criterion_id: 2, label: "Objectifs de la prestation.", criteria: { id: 2, label: "Objectifs & public" } },
        { id: 4, criterion_id: 3, label: "Adaptation aux publics.", criteria: { id: 3, label: "Adaptation aux publics" } },
        { id: 5, criterion_id: 4, label: "Moyens pédagogiques.", criteria: { id: 4, label: "Moyens pédagogiques" } },
        { id: 6, criterion_id: 5, label: "Qualification formateurs.", criteria: { id: 5, label: "Qualification formateurs" } },
        { id: 7, criterion_id: 6, label: "Inscription socio-éco.", criteria: { id: 6, label: "Inscription socio-éco" } },
        { id: 8, criterion_id: 7, label: "Amélioration continue.", criteria: { id: 7, label: "Amélioration continue" } }
    ])

    useEffect(() => {
        if ((user || profile) && !initialized) {
            setFormData({
                first_name: profile?.first_name || '',
                last_name: profile?.last_name || '',
                email: profile?.email || user?.email || ''
            })
            setLoading(false)
            if (profile) setInitialized(true)

            const fetchData = async () => {
                // 1. Fetch Indicators for Sidebar
                const { data: indicatorsData } = await supabase
                    .from('indicators')
                    .select('id, code, label, criterion_id, criteria (id, label)')
                    .order('id', { ascending: true })

                if (!indicatorsData || indicatorsData.length === 0) {
                    const fallback = [
                        { id: 1, criterion_id: 1, label: "Information accessible au public, détaillée et vérifiable.", criteria: { id: 1, label: "Information du public" } },
                        { id: 2, criterion_id: 1, label: "Indicateurs de résultats adaptés à la nature des prestations.", criteria: { id: 1, label: "Information du public" } },
                        { id: 3, criterion_id: 2, label: "Objectifs de la prestation.", criteria: { id: 2, label: "Objectifs & public" } },
                        { id: 4, criterion_id: 3, label: "Adaptation aux publics.", criteria: { id: 3, label: "Adaptation aux publics" } },
                        { id: 5, criterion_id: 4, label: "Moyens pédagogiques.", criteria: { id: 4, label: "Moyens pédagogiques" } },
                        { id: 6, criterion_id: 5, label: "Qualification formateurs.", criteria: { id: 5, label: "Qualification formateurs" } },
                        { id: 7, criterion_id: 6, label: "Inscription socio-éco.", criteria: { id: 6, label: "Inscription socio-éco" } },
                        { id: 8, criterion_id: 7, label: "Amélioration continue.", criteria: { id: 7, label: "Amélioration continue" } }
                    ]
                    setIndicators(fallback)
                } else {
                    setIndicators(indicatorsData)
                }

                // 2. Fetch Tenants & Cases
                const { data: tenantsData } = await supabase.from('tenants').select('id').eq('owner_id', user.id)

                if (tenantsData && tenantsData.length > 0) {
                    const tenantIds = tenantsData.map(t => t.id)
                    const { data: casesData } = await supabase
                        .from('cases').select('*').in('tenant_id', tenantIds)

                    const caseData = casesData?.sort((a, b) => {
                        const aScore = (a.training_categories?.length || 0) + (a.audit_type?.length || 0)
                        const bScore = (b.training_categories?.length || 0) + (b.audit_type?.length || 0)
                        if (aScore !== bScore) return bScore - aScore
                        return new Date(b.created_at) - new Date(a.created_at)
                    })?.[0]

                    if (caseData) {
                        setMyCase(caseData)
                        if (caseData.consultant_id) {
                            const { data: p } = await supabase.from('profiles').select('first_name, last_name').eq('id', caseData.consultant_id).single()
                            if (p) setConsultantName(`${p.first_name || ''} ${p.last_name || ''}`.trim())
                        }

                        // 3. Fetch Indicator States
                        const { data: statesData } = await supabase
                            .from('case_indicator_states')
                            .select('indicator_id, status, consultant_comment, consultant_verdict')
                            .eq('case_id', caseData.id)

                        const statesMap = {}
                        statesData?.forEach(s => {
                            statesMap[s.indicator_id] = {
                                status: s.status,
                                consultant_comment: s.consultant_comment,
                                consultant_verdict: s.consultant_verdict
                            }
                        })
                        setIndicatorStates(statesMap)
                    }
                }
            }
            fetchData()
        }
    }, [user, profile, initialized])

    const showMsg = (type, content) => {
        setMessage({ type, content })
        setTimeout(() => setMessage({ type: '', content: '' }), 5000)
    }

    const handleUploadAvatar = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setUploadingAvatar(true)
        try {
            const ext = file.name.split('.').pop()
            const filePath = `${user.id}-${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
            if (uploadError) throw uploadError
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
            const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
            if (updateError) throw updateError
            await refreshProfile()
            showMsg('success', 'Photo de profil mise à jour !')
        } catch (err) {
            showMsg('error', "Erreur lors de l'upload : " + err.message)
        } finally {
            setUploadingAvatar(false)
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setUpdatingInfo(true)
        try {
            const { error } = await supabase.from('profiles')
                .update({ first_name: formData.first_name, last_name: formData.last_name })
                .eq('id', user.id)
            if (error) throw error
            await refreshProfile()
            showMsg('success', 'Profil mis à jour avec succès.')
        } catch (err) {
            showMsg('error', 'Erreur lors de la mise à jour.')
        } finally {
            setUpdatingInfo(false)
        }
    }

    const handleUpdatePassword = async (e) => {
        e.preventDefault()
        if (!passwordData.newPassword) return
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showMsg('error', 'Les mots de passe ne correspondent pas.')
            return
        }
        if (passwordData.newPassword.length < 6) {
            showMsg('error', 'Le mot de passe doit contenir au moins 6 caractères.')
            return
        }
        setUpdatingPassword(true)
        try {
            // 1. Change Supabase Auth password
            const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword })
            if (error) throw error

            // 2. ✅ Also save the new password in tenants.initial_password
            //    so the consultant can always see the current password
            const { data: tenantsData } = await supabase
                .from('tenants')
                .select('id')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
            const tenantData = tenantsData?.[0]

            if (tenantData?.id) {
                await supabase
                    .from('tenants')
                    .update({ initial_password: passwordData.newPassword })
                    .eq('id', tenantData.id)
            }

            setShowSuccessModal(true)
            setPasswordData({ newPassword: '', confirmPassword: '' })
        } catch (err) {
            showMsg('error', err.message)
        } finally {
            setUpdatingPassword(false)
        }
    }

    const fullName = (formData.first_name || formData.last_name)
        ? `${formData.first_name || ''} ${formData.last_name || ''}`.trim()
        : profile?.commercial_name || 'Mon Profil'
    const initial = fullName[0]?.toUpperCase() || 'C'

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex">
            <ClientSidebar
                caseData={null}
                indicators={indicators}
                indicatorStates={{}}
                consultantName={consultantName}
                isOpen={showMobileMenu}
                onClose={() => setShowMobileMenu(false)}
            />
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cc6d3e]" />
            </div>
        </div>
    )

    return (
        <div className="bg-gray-50 min-h-screen flex font-sans">
            <ClientSidebar
                caseData={myCase}
                indicators={indicators}
                indicatorStates={indicatorStates}
                consultantName={consultantName}
                isOpen={showMobileMenu}
                onClose={() => setShowMobileMenu(false)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <ClientTopBar
                    breadcrumbs={[
                        { label: 'Formation', path: '/client/dashboard' },
                        { label: 'Mon Profil' }
                    ]}
                    consultantName={consultantName}
                    onContact={null}
                    setShowMobileMenu={setShowMobileMenu}
                />

                <main className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full">

                    {/* Alert message */}
                    {message.content && (
                        <div className={`mb-5 p-3.5 rounded-xl flex items-center gap-3 text-sm font-semibold border ${message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            {message.type === 'success'
                                ? <Check className="h-4 w-4 flex-shrink-0" />
                                : <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            }
                            {message.content}
                        </div>
                    )}

                    {/* ── BANNER CARD ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                        {/* Gradient banner */}
                        <div className="h-28 bg-gradient-to-r from-[#b35d32] via-purple-500 to-[#e5a383] relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20"
                                style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
                        </div>

                        {/* Avatar + info */}
                        <div className="px-7 pb-6 relative">
                            <div className="flex items-end gap-5 -mt-10">
                                {/* Avatar */}
                                <div
                                    className="relative group/av cursor-pointer flex-shrink-0"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="h-20 w-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                                                <span className="text-2xl font-black text-[#cc6d3e]">{initial}</span>
                                            </div>
                                        )}
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover/av:opacity-100 transition-opacity flex items-center justify-center">
                                            {uploadingAvatar
                                                ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                : <Camera className="h-5 w-5 text-white" />
                                            }
                                        </div>
                                    </div>
                                    <input
                                        ref={fileInputRef} type="file" accept="image/*"
                                        className="hidden" onChange={handleUploadAvatar}
                                    />
                                </div>

                                {/* Name + email */}
                                <div className="pb-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h1 className="text-xl font-black text-gray-900">
                                            {fullName || 'Mon Profil'}
                                        </h1>
                                        <span className="px-2 py-0.5 bg-[#cc6d3e] text-white text-[9px] font-black rounded-full uppercase tracking-widest">
                                            {role === 'of' ? 'Client' : role}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5" />
                                        {formData.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── FORMS GRID ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* INFORMATIONS */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50">
                                <User className="h-4 w-4 text-[#cc6d3e]" />
                                <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Informations</h2>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                        Prénom
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-gray-50 outline-none focus:border-[#cc6d3e] focus:ring-2 focus:ring-[#cc6d3e]/20 focus:bg-white transition-all"
                                        placeholder="Votre prénom"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-gray-50 outline-none focus:border-[#cc6d3e] focus:ring-2 focus:ring-[#cc6d3e]/20 focus:bg-white transition-all"
                                        placeholder="Votre nom"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={updatingInfo}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#cc6d3e] to-[#cc6d3e] text-white rounded-xl text-sm font-bold hover:from-[#b35d32] hover:to-purple-700 transition-all shadow-lg shadow-[#cc6d3e]/20 disabled:opacity-60 active:scale-[0.98]"
                                    >
                                        <Save className="h-4 w-4" />
                                        {updatingInfo ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* SÉCURITÉ */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50">
                                <Lock className="h-4 w-4 text-[#cc6d3e]" />
                                <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Sécurité</h2>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                        Nouveau mot de passe
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-gray-50 outline-none focus:border-[#cc6d3e] focus:ring-2 focus:ring-[#cc6d3e]/20 focus:bg-white transition-all"
                                            placeholder="Min. 6 caractères"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#cc6d3e] transition-colors">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                        Confirmer
                                    </label>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-gray-50 outline-none focus:border-[#cc6d3e] focus:ring-2 focus:ring-[#cc6d3e]/20 focus:bg-white transition-all"
                                        placeholder="Répétez le mot de passe"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={updatingPassword}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-[#cc6d3e] hover:text-[#b35d32] hover:bg-[#faf1ec] transition-all shadow-sm disabled:opacity-60 active:scale-[0.98]"
                                    >
                                        <Lock className="h-4 w-4" />
                                        {updatingPassword ? 'Modification...' : 'Changer mot de passe'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </main>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                        <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Mot de passe modifié !</h3>
                        <p className="text-sm text-gray-400 mb-6">Votre compte est maintenant sécurisé.</p>
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full py-3 bg-[#cc6d3e] text-white rounded-xl font-bold hover:bg-[#b35d32] transition-all"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

