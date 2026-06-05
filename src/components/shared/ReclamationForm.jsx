import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { User, Briefcase, Building, ShieldCheck, ArrowRight, Paperclip, CheckCircle } from 'lucide-react'

export default function ReclamationForm({ user, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)

    const [formData, setFormData] = useState({
        role: 'Consultant',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        organization: '',
        interventionQuality: '',
        subjectCategory: '',
        incidentDate: '',
        shortSubject: '',
        description: '',
        consent: false
    })

    useEffect(() => {
        if (user) {
            fetchProfile()
        }
    }, [user])

    const fetchProfile = async () => {
        try {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    firstName: data.first_name || '',
                    lastName: data.last_name || '',
                    email: data.email || user.email || '',
                    phone: data.phone || '',
                    organization: data.commercial_name || '',
                    role: data.role === 'consultant' ? 'Consultant' : 'Financeur / Partie prenante'
                }))
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleRoleSelect = (roleName) => {
        setFormData(prev => ({ ...prev, role: roleName }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.consent) {
            setError("Veuillez accepter la politique de confidentialité pour continuer.")
            return
        }

        setLoading(true)
        setError(null)

        try {
            let type = 'reclamation'
            const subject = formData.subjectCategory.toLowerCase()
            if (subject.includes('avis') || subject.includes('idée') || subject.includes('suggestion')) type = 'avis'
            if (subject.includes('bug') || subject.includes('technique') || subject.includes('plateforme')) type = 'bug'

            const contentText = `
Role sélectionné : ${formData.role}
Qualité : ${formData.interventionQuality}
Contact : ${formData.firstName} ${formData.lastName} (${formData.email} - ${formData.phone || 'Non renseigné'})
Organisme : ${formData.organization || 'Non renseigné'}
Date de l'incident : ${formData.incidentDate ? new Date(formData.incidentDate).toLocaleDateString('fr-FR') : 'Non renseignée'}

--- Description détaillée ---
${formData.description}
            `.trim()

            let attachmentUrl = null
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop()
                const fileName = `${user.id}-${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('reclamations')
                    .upload(fileName, selectedFile)
                
                if (uploadError) {
                    console.error('Error uploading file:', uploadError)
                    throw new Error("Erreur lors de l'envoi de la pièce jointe.")
                }
                
                const { data: publicUrlData } = supabase.storage
                    .from('reclamations')
                    .getPublicUrl(fileName)
                    
                attachmentUrl = publicUrlData.publicUrl
            }

            const { error: submitError } = await supabase
                .from('reclamations')
                .insert({
                    user_id: user.id,
                    type: type,
                    title: formData.shortSubject,
                    content: contentText,
                    status: 'pending',
                    attachment_url: attachmentUrl
                })

            if (submitError) throw submitError

            setSuccess(true)
            if (onSuccess) {
                setTimeout(onSuccess, 2000)
            }
        } catch (err) {
            console.error(err)
            setError("Une erreur est survenue lors de l'envoi de votre réclamation. Veuillez réessayer.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center max-w-3xl mx-auto flex flex-col items-center">
                <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Réclamation envoyée avec succès</h2>
                <p className="text-slate-600 max-w-md mx-auto mb-8">
                    Nous avons bien reçu votre demande. Notre équipe qualité l'examinera et vous apportera une réponse dans les meilleurs délais.
                </p>
                <button 
                    onClick={onSuccess}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                >
                    Retour à l'historique
                </button>
            </div>
        )
    }

    return (
        <div className="w-full pb-12">
            {/* Header Section */}
            <div className="text-center mb-12">
                <div className="text-sm font-semibold text-slate-500 mb-2 tracking-wide uppercase">Accueil &gt; Réclamation</div>
                <h1 className="text-4xl font-extrabold text-[#112a46] mb-4">Réclamation & Signalement</h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                    Une insatisfaction ? Un dysfonctionnement ? Faites-nous en part. L'amélioration continue est au cœur de nos engagements.
                </p>
            </div>

            {/* Engagement Qualité */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#24b4c4] to-blue-500"></div>
                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-blue-50 rounded-full">
                        <ShieldCheck className="h-8 w-8 text-[#24b4c4]" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-[#112a46] mb-3">Notre engagement Qualité</h3>
                <p className="text-slate-600">
                    Dans le cadre de notre démarche qualité, toute réclamation est prise en charge sous 72h.<br/>
                    Nous nous engageons à vous apporter une réponse motivée sous 15 jours ouvrés.
                </p>
            </div>

            {/* Role Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
                <button
                    type="button"
                    onClick={() => handleRoleSelect('Bénéficiaire')}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                        formData.role === 'Bénéficiaire' 
                        ? 'border-[#24b4c4] bg-[#24b4c4]/5 shadow-md shadow-[#24b4c4]/10' 
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                    }`}
                >
                    <User className={`h-8 w-8 mb-3 ${formData.role === 'Bénéficiaire' ? 'text-[#24b4c4]' : 'text-[#24b4c4]'}`} />
                    <span className={`font-bold ${formData.role === 'Bénéficiaire' ? 'text-[#112a46]' : 'text-slate-700'}`}>Bénéficiaire</span>
                </button>
                
                <button
                    type="button"
                    onClick={() => handleRoleSelect('Consultant')}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                        formData.role === 'Consultant' 
                        ? 'border-[#3b82f6] bg-[#3b82f6]/5 shadow-md shadow-[#3b82f6]/10' 
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                    }`}
                >
                    <Briefcase className={`h-8 w-8 mb-3 ${formData.role === 'Consultant' ? 'text-[#3b82f6]' : 'text-[#3b82f6]'}`} />
                    <span className={`font-bold ${formData.role === 'Consultant' ? 'text-[#112a46]' : 'text-slate-700'}`}>Consultant</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleRoleSelect('Financeur / Partie prenante')}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                        formData.role === 'Financeur / Partie prenante' 
                        ? 'border-[#f97316] bg-[#f97316]/5 shadow-md shadow-[#f97316]/10' 
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                    }`}
                >
                    <Building className={`h-8 w-8 mb-3 ${formData.role === 'Financeur / Partie prenante' ? 'text-[#f97316]' : 'text-[#f97316]'}`} />
                    <span className={`font-bold ${formData.role === 'Financeur / Partie prenante' ? 'text-[#112a46]' : 'text-slate-700'}`}>Financeur / Partie prenante</span>
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 md:p-12">
                {error && (
                    <div className="mb-8 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl font-medium">
                        {error}
                    </div>
                )}

                {/* Section 01 */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-[#112a46] flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <span className="text-slate-300 font-black text-2xl">01</span>
                        Vos coordonnées
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-[#112a46] mb-2">Nom *</label>
                            <input 
                                type="text" 
                                name="lastName"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#24b4c4]/30 focus:border-[#24b4c4] transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#112a46] mb-2">Prénom *</label>
                            <input 
                                type="text" 
                                name="firstName"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#24b4c4]/30 focus:border-[#24b4c4] transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#112a46] mb-2">Email *</label>
                            <input 
                                type="email" 
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#24b4c4]/30 focus:border-[#24b4c4] transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#112a46] mb-2">Téléphone</label>
                            <input 
                                type="tel" 
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#24b4c4]/30 focus:border-[#24b4c4] transition-all"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-[#112a46] mb-2">Organisme / Entreprise (facultatif)</label>
                            <input 
                                type="text" 
                                name="organization"
                                value={formData.organization}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#24b4c4]/30 focus:border-[#24b4c4] transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 02 */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-[#112a46] flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <span className="text-slate-300 font-black text-2xl">02</span>
                        Votre profil
                    </h2>
                    
                    <div>
                        <label className="block text-sm font-bold text-[#112a46] mb-2">En quelle qualité intervenez-vous ? *</label>
                        <select 
                            name="interventionQuality"
                            required
                            value={formData.interventionQuality}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white border border-[#24b4c4] text-[#24b4c4] font-medium rounded-xl focus:outline-none focus:ring-4 focus:ring-[#24b4c4]/20 transition-all appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2324b4c4'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
                        >
                            <option value="">Sélectionnez...</option>
                            <option value="Consultant(e) formateur">Consultant(e) formateur</option>
                            <option value="Responsable pédagogique">Responsable pédagogique</option>
                            <option value="Stagiaire / Apprenant">Stagiaire / Apprenant</option>
                            <option value="Financeur (OPCO, etc.)">Financeur (OPCO, etc.)</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                </div>

                {/* Section 03 */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-[#112a46] flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <span className="text-slate-300 font-black text-2xl">03</span>
                        Nature de la demande
                    </h2>
                    
                    <div>
                        <label className="block text-sm font-bold text-[#112a46] mb-2">Sujet principal *</label>
                        <select 
                            name="subjectCategory"
                            required
                            value={formData.subjectCategory}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#24b4c4]/30 focus:border-[#24b4c4] transition-all appearance-none cursor-pointer text-slate-700"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
                        >
                            <option value="">Sélectionnez la nature...</option>
                            <option value="Réclamation - Problème administratif">Réclamation - Problème administratif</option>
                            <option value="Réclamation - Déroulement de la prestation">Réclamation - Déroulement de la prestation</option>
                            <option value="Bug technique - Plateforme">Bug technique - Plateforme (Accès, fichiers, etc.)</option>
                            <option value="Avis / Suggestion d'amélioration">Avis / Suggestion d'amélioration</option>
                            <option value="Autre demande">Autre demande</option>
                        </select>
                    </div>
                </div>

                {/* Section 04 */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-[#112a46] flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <span className="text-slate-300 font-black text-2xl">04</span>
                        Description
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-[#112a46] mb-2">Date de l'incident (si applicable)</label>
                            <input 
                                type="date" 
                                name="incidentDate"
                                value={formData.incidentDate}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#24b4c4]/30 focus:border-[#24b4c4] transition-all text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#112a46] mb-2">Objet court *</label>
                            <input 
                                type="text" 
                                name="shortSubject"
                                required
                                placeholder="Ex: Problème d'accès plateforme"
                                value={formData.shortSubject}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#24b4c4]/30 focus:border-[#24b4c4] transition-all"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-[#112a46] mb-2">Description détaillée *</label>
                        <textarea 
                            name="description"
                            required
                            placeholder="Merci de détailler les faits le plus précisément possible..."
                            rows={6}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#24b4c4]/30 focus:border-[#24b4c4] transition-all resize-y"
                        ></textarea>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-bold text-[#112a46] mb-2">Pièce jointe (facultatif - max 10 Mo)</label>
                        <div className="flex items-center gap-4 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl">
                            <label className="cursor-pointer text-sm font-bold text-[#24b4c4] hover:text-blue-600 transition-colors flex items-center gap-2 shrink-0">
                                <Paperclip className="h-4 w-4" />
                                Choisir un fichier
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" 
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setSelectedFile(e.target.files[0])
                                        }
                                    }}
                                />
                            </label>
                            <span className="text-sm text-slate-500 truncate flex-1">
                                {selectedFile ? selectedFile.name : "Aucun fichier choisi"}
                            </span>
                            {selectedFile && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedFile(null);
                                    }}
                                    className="text-slate-400 hover:text-red-500 shrink-0"
                                    title="Retirer le fichier"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Consent */}
                    <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-4">
                        <div className="pt-0.5">
                            <input 
                                type="checkbox" 
                                name="consent"
                                id="consent"
                                checked={formData.consent}
                                onChange={handleChange}
                                className="w-5 h-5 text-[#24b4c4] border-gray-300 rounded focus:ring-[#24b4c4] cursor-pointer"
                            />
                        </div>
                        <label htmlFor="consent" className="text-sm text-slate-600 cursor-pointer select-none">
                            J'accepte que les données saisies soient exploitées par la plateforme dans le strict cadre du traitement de ma réclamation. En savoir plus sur la gestion de vos données et vos droits dans notre <a href="#" className="text-[#24b4c4] hover:underline font-medium">Politique de Confidentialité</a>. *
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-10 flex justify-center">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="group flex items-center justify-center gap-2 w-full md:w-auto md:px-12 py-4 bg-[#f97316] hover:bg-[#ea580c] text-white text-lg font-bold rounded-xl shadow-lg shadow-[#f97316]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Envoi en cours...' : 'Envoyer ma réclamation'}
                        {!loading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                    </button>
                </div>
            </form>
        </div>
    )
}
