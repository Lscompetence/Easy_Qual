import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import {
    CheckCircle, Clock, XCircle, CircleOff, AlertTriangle,
    Upload, Download, FileText, ChevronDown, ChevronUp, Send, MessageSquare,
    ArrowRight, CheckSquare, Check, Trash2, Video, Sun, Flag, Ban
} from 'lucide-react'
import ClientSidebar from '../../components/client/ClientSidebar'
import ClientTopBar from '../../components/client/ClientTopBar'

export default function ClientDashboard() {
    const { user, profile } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [tenant, setTenant] = useState(null)
    const [myCase, setMyCase] = useState(null)
    const [indicators, setIndicators] = useState([
        { id: 1, criterion_id: 1, label: "Information accessible au public, détaillée et vérifiable.", criteria: { id: 1, label: "Information du public" } },
        { id: 2, criterion_id: 1, label: "Indicateurs de résultats adaptés à la nature des prestations.", criteria: { id: 1, label: "Information du public" } },
        { id: 3, criterion_id: 1, label: "Taux d'obtention des certifications.", criteria: { id: 1, label: "Information du public" } },
        { id: 4, criterion_id: 2, label: "Objectifs de la prestation.", criteria: { id: 2, label: "Objectifs & public" } },
        { id: 5, criterion_id: 3, label: "Adaptation aux publics.", criteria: { id: 3, label: "Adaptation aux publics" } },
        { id: 6, criterion_id: 4, label: "Moyens pédagogiques.", criteria: { id: 4, label: "Moyens pédagogiques" } },
        { id: 7, criterion_id: 5, label: "Qualification formateurs.", criteria: { id: 5, label: "Qualification formateurs" } },
        { id: 8, criterion_id: 6, label: "Inscription socio-éco.", criteria: { id: 6, label: "Inscription socio-éco" } },
        { id: 9, criterion_id: 7, label: "Amélioration continue.", criteria: { id: 7, label: "Amélioration continue" } }
    ])
    const [indicatorStates, setIndicatorStates] = useState({})
    const [quizUploads, setQuizUploads] = useState({})
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [sendingMsg, setSendingMsg] = useState(false)
    const [uploadingFor, setUploadingFor] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [consultantName, setConsultantName] = useState('')
    const fileInputRef = useRef(null)
    const [pendingCriterionId, setPendingCriterionId] = useState(null)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const messagesEndRef = useRef(null)

    // Determine current page from URL
    const isMessages = location.pathname === '/client/messages'
    const isSessions = location.pathname === '/client/sessions'
    const isCriterion = location.pathname.startsWith('/client/criterion/')
    const criterionId = isCriterion ? location.pathname.split('/').pop() : null

    useEffect(() => {
        if (user) fetchClientData()
    }, [user])

    useEffect(() => {
        if (isMessages && myCase) fetchMessages()
    }, [isMessages, myCase])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchMessages = async () => {
        if (!myCase) return
        const { data } = await supabase
            .from('case_messages')
            .select('*')
            .eq('case_id', myCase.id)
            .order('created_at', { ascending: true })
        setMessages(data || [])
    }

    const fetchClientData = async () => {
        try {
            setLoading(true)

            // 1. Fetch Indicators FIRST (Always needed)
            const { data: indicatorsData } = await supabase
                .from('indicators')
                .select('id, code, label, criterion_id, criteria (id, label)')
                .order('id', { ascending: true })

            if (!indicatorsData || indicatorsData.length === 0) {
                const fallback = [
                    { id: 1, criterion_id: 1, label: "Information accessible au public, détaillée et vérifiable.", criteria: { id: 1, label: "Information du public" } },
                    { id: 2, criterion_id: 1, label: "Indicateurs de résultats adaptés à la nature des prestations.", criteria: { id: 1, label: "Information du public" } },
                    { id: 3, criterion_id: 1, label: "Taux d'obtention des certifications.", criteria: { id: 1, label: "Information du public" } },
                    { id: 4, criterion_id: 2, label: "Objectifs de la prestation.", criteria: { id: 2, label: "Objectifs & public" } },
                    { id: 5, criterion_id: 3, label: "Adaptation aux publics.", criteria: { id: 3, label: "Adaptation aux publics" } },
                    { id: 6, criterion_id: 4, label: "Moyens pédagogiques.", criteria: { id: 4, label: "Moyens pédagogiques" } },
                    { id: 7, criterion_id: 5, label: "Qualification formateurs.", criteria: { id: 5, label: "Qualification formateurs" } },
                    { id: 8, criterion_id: 6, label: "Inscription socio-éco.", criteria: { id: 6, label: "Inscription socio-éco" } },
                    { id: 9, criterion_id: 7, label: "Amélioration continue.", criteria: { id: 7, label: "Amélioration continue" } }
                ]
                setIndicators(fallback)
            } else {
                setIndicators(indicatorsData)
            }

            // 2. Fetch Tenants & Cases
            const { data: tenantsData } = await supabase
                .from('tenants').select('*').eq('owner_id', user.id)

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
                    const tenantData = tenantsData.find(t => t.id === caseData.tenant_id)
                    setTenant(tenantData)
                    setMyCase(caseData)

                    // Fetch consultant name
                    const consultantIdToFetch = caseData.consultant_id || tenantData.created_by;
                    if (consultantIdToFetch) {
                        const { data: p } = await supabase
                            .from('profiles')
                            .select('first_name, last_name')
                            .eq('id', consultantIdToFetch)
                            .single()
                        if (p) setConsultantName(`${p.first_name || ''} ${p.last_name || ''}`.trim())
                    }

                    // Fetch indicator states
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

                    // Fetch quiz uploads
                    const { data: quizData } = await supabase
                        .from('criterion_quiz_uploads')
                        .select('criterion_id, file_url, file_name, uploaded_at')
                        .eq('case_id', caseData.id)

                    const quizMap = {}
                    quizData?.forEach(q => { quizMap[q.criterion_id] = q })
                    setQuizUploads(quizMap)
                }
            }
        } catch (err) {
            console.error('Error loading client data:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (indicatorId, newStatus) => {
        if (!myCase) return

        // Optimistic update
        setIndicatorStates(prev => ({
            ...prev,
            [indicatorId]: { ...(prev[indicatorId] || {}), status: newStatus }
        }))

        try {
            const { error } = await supabase.from('case_indicator_states').upsert({
                case_id: myCase.id,
                indicator_id: indicatorId,
                audit_type: myCase.audit_type?.[0] || 'initial',
                status: newStatus,
                updated_at: new Date().toISOString()
            }, { onConflict: 'case_id,indicator_id,audit_type' })

            if (error) throw error
        } catch (err) {
            console.error('Error updating status:', err)
            // Rollback on error could be added here if needed
        }
    }

    const handleCommentChange = async (indicatorId, comment) => {
        if (!myCase) return
        try {
            const { error } = await supabase.from('case_indicator_states').upsert({
                case_id: myCase.id,
                indicator_id: indicatorId,
                audit_type: myCase.audit_type?.[0] || 'initial',
                client_comment: comment,
                updated_at: new Date().toISOString()
            }, { onConflict: 'case_id,indicator_id,audit_type' })
            if (error) throw error
        } catch (err) {
            console.error('Error updating comment:', err)
        }
    }

    const handleFileUpload = async (file, criterionId) => {
        if (!file || !myCase) return
        setUploadingFor(criterionId)
        try {
            const ext = file.name.split('.').pop()
            const path = `${myCase.id}/${criterionId}_${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage
                .from('quiz-uploads').upload(path, file, { upsert: true })
            if (uploadError) throw uploadError
            const { data: urlData } = supabase.storage.from('quiz-uploads').getPublicUrl(path)
            await supabase.from('criterion_quiz_uploads').upsert({
                case_id: myCase.id, criterion_id: criterionId,
                audit_type: myCase.audit_type?.[0] || 'initial',
                file_url: urlData.publicUrl, file_name: file.name, uploaded_by: user.id
            }, { onConflict: 'case_id,criterion_id,audit_type' })
            setQuizUploads(prev => ({
                ...prev,
                [criterionId]: { file_url: urlData.publicUrl, file_name: file.name, uploaded_at: new Date().toISOString() }
            }))
        } catch (err) {
            alert('Erreur upload : ' + err.message)
        } finally {
            setUploadingFor(null)
        }
    }

    const handleDeleteFile = async (criterionId) => {
        if (!myCase) return
        if (!confirm('Voulez-vous supprimer ce document ?')) return
        try {
            const { error } = await supabase.from('criterion_quiz_uploads')
                .delete()
                .eq('case_id', myCase.id)
                .eq('criterion_id', criterionId)
                .eq('audit_type', myCase.audit_type?.[0] || 'initial')
            if (error) throw error
            setQuizUploads(prev => {
                const next = { ...prev }
                delete next[criterionId]
                return next
            })
        } catch (err) {
            alert('Erreur suppression : ' + err.message)
        }
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !myCase) return
        setSendingMsg(true)
        try {
            const { error } = await supabase.from('case_messages').insert({
                case_id: myCase.id,
                sender_id: user.id,
                sender_role: 'of',
                content: newMessage.trim()
            })
            if (error) throw error
            setNewMessage('')
            fetchMessages()
        } catch (err) {
            alert('Erreur envoi : ' + err.message)
        } finally {
            setSendingMsg(false)
        }
    }

    // Stats
    const totalIndicators = indicators.length
    const validatedCount = Object.values(indicatorStates).filter(s => s?.status === 'done').length
    const toTreatCount = Object.values(indicatorStates).filter(s => s?.status === 'to_do' || !s?.status).length
    const rejectedCount = Object.values(indicatorStates).filter(s => s?.consultant_verdict === 'non_conforme').length
    const progressPercent = totalIndicators > 0 ? Math.round((validatedCount / totalIndicators) * 100) : 0

    // Group indicators by criterion
    const criteriaMap = {}

    // Fallback for dashboard chips if empty
    const effectiveIndicatorsForDashboard = (indicators && indicators.length > 0) ? indicators : [
        { id: -1, criterion_id: 1, label: "Information du public", criteria: { id: 1, label: "Information du public" } },
        { id: -2, criterion_id: 2, label: "Objectifs & public", criteria: { id: 2, label: "Objectifs & public" } },
        { id: -3, criterion_id: 3, label: "Adaptation aux publics", criteria: { id: 3, label: "Adaptation aux publics" } },
        { id: -4, criterion_id: 4, label: "Moyens pédagogiques", criteria: { id: 4, label: "Moyens pédagogiques" } },
        { id: -5, criterion_id: 5, label: "Qualification formateurs", criteria: { id: 5, label: "Qualification formateurs" } },
        { id: -6, criterion_id: 6, label: "Inscription socio-éco", criteria: { id: 6, label: "Inscription socio-éco" } },
        { id: -7, criterion_id: 7, label: "Amélioration continue", criteria: { id: 7, label: "Amélioration continue" } }
    ]

    effectiveIndicatorsForDashboard.forEach(ind => {
        const cid = ind.criterion_id
        if (!criteriaMap[cid]) {
            criteriaMap[cid] = {
                id: cid,
                label: ind.criteria?.label || `Critère ${cid}`,
                items: []
            }
        }
        criteriaMap[cid].items.push(ind)
    })
    const criteriaList = Object.values(criteriaMap)

    // Current criterion for detail view
    const currentCriterion = criteriaList.find(c => String(c.id) === String(criterionId))
    const criterionIndex = criteriaList.findIndex(c => String(c.id) === String(criterionId))

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <ClientSidebar
                    caseData={myCase}
                    indicators={[]}
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
    }

    // ─── MESSAGERIE VIEW ────────────────────────────────────────────────────────
    if (isMessages) {
        return (
            <div className="bg-gray-50 min-h-screen flex font-sans">
                <ClientSidebar
                    caseData={myCase}
                    indicators={indicators}
                    indicatorStates={indicatorStates}
                    consultantName={consultantName}
                    unreadCount={messages.filter(m => m.sender_id !== user.id && !m.is_read).length}
                    isOpen={showMobileMenu}
                    onClose={() => setShowMobileMenu(false)}
                />
                <div className="flex-1 flex flex-col min-w-0">
                    <ClientTopBar
                        breadcrumbs={[
                            { label: 'Formation', path: '/client/dashboard' },
                            { label: 'Messagerie' }
                        ]}
                        consultantName={consultantName}
                        onContact={() => navigate('/client/messages')}
                        setShowMobileMenu={setShowMobileMenu}
                    />
                    <main className="flex-1 flex items-center justify-center p-8">
                        <div className="w-full max-w-xl bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="p-8 text-center border-b border-gray-50">
                                <div className="h-14 w-14 rounded-2xl bg-[#faf1ec] flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare className="h-7 w-7 text-[#cc6d3e]" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-1">Discussion Privée</h2>
                                <p className="text-sm text-[#cc6d3e] font-medium">
                                    Échangez en temps réel avec votre consultant pour toute question sur la plateforme.
                                </p>
                            </div>

                            {/* Messages */}
                            <div className="p-6 space-y-3 min-h-[200px] max-h-[340px] overflow-y-auto bg-gray-50/50">
                                {messages.length === 0 ? (
                                    <p className="text-center text-sm text-gray-400 py-8">Aucun message. Commencez la discussion !</p>
                                ) : (
                                    messages.map((msg) => {
                                        const isMe = msg.sender_id === user.id
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${isMe
                                                    ? 'bg-[#cc6d3e] text-white rounded-br-md'
                                                    : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Écrire un message..."
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-[#cc6d3e] focus:ring-2 focus:ring-[#cc6d3e]/20 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={sendingMsg || !newMessage.trim()}
                                    className="px-4 py-2.5 bg-[#cc6d3e] text-white rounded-xl text-sm font-bold hover:bg-[#b35d32] transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-[#cc6d3e]/20"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>

                            <div className="px-4 pb-3 text-center">
                                <button
                                    onClick={() => navigate('/client/dashboard')}
                                    className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                                >
                                    Retour
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    // ─── SESSIONS & VISIOS VIEW ────────────────────────────────────────────────
    if (isSessions) {
        return (
            <div className="bg-gray-50 min-h-screen flex font-sans">
                <ClientSidebar
                    caseData={myCase}
                    indicators={indicators}
                    indicatorStates={indicatorStates}
                    consultantName={consultantName}
                    unreadCount={messages.filter(m => m.sender_id !== user.id && !m.is_read).length}
                    isOpen={showMobileMenu}
                    onClose={() => setShowMobileMenu(false)}
                />
                <div className="flex-1 flex flex-col min-w-0">
                    <ClientTopBar
                        breadcrumbs={[
                            { label: 'Formation', path: '/client/dashboard' },
                            { label: 'Agenda' }
                        ]}
                        consultantName={consultantName}
                        onContact={() => navigate('/client/messages')}
                        setShowMobileMenu={setShowMobileMenu}
                    />
                    <main className="flex-1 flex items-center justify-center p-8">
                        <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all">
                            <div className="p-10 text-center">
                                <div className="h-20 w-20 rounded-3xl bg-[#faf1ec] flex items-center justify-center mx-auto mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300 shadow-md">
                                    <Video className="h-10 w-10 text-[#cc6d3e]" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 mb-3">Vos Rendez-vous</h2>
                                <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                                    Retrouvez ici le lien visio pour votre prochain point de mentoring avec <span className="text-[#cc6d3e] font-bold">{consultantName || 'votre consultant'}</span>.
                                </p>
                            </div>

                            <div className="px-10 pb-6">
                                <div className="bg-[#faf1ec]/30 rounded-2xl p-6 border border-[#f5e2d6] flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all duration-300">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-[#cc6d3e] uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded-full inline-block mb-1 border border-[#f5e2d6]/40">Prochain RDV</p>
                                        <h3 className="text-lg font-black text-gray-900">Suivi Mi-Parcours</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span>Demain, 14:00 (Google Meet)</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.open('https://meet.google.com', '_blank')}
                                        className="h-12 px-8 bg-[#cc6d3e] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#cc6d3e]/20 hover:bg-[#b55d32] hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Rejoindre
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 text-center border-t border-gray-50">
                                <button
                                    onClick={() => navigate('/client/dashboard')}
                                    className="text-sm text-gray-400 hover:text-gray-900 font-bold transition-colors py-2 px-4"
                                >
                                    Retour
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    // ─── CRITERION DETAIL VIEW ────────────────────────────────────────────────
    if (isCriterion && currentCriterion) {
        return (
            <div className="bg-gray-50 min-h-screen flex font-sans">
                <ClientSidebar
                    caseData={myCase}
                    indicators={indicators}
                    indicatorStates={indicatorStates}
                    consultantName={consultantName}
                    unreadCount={messages.filter(m => m.sender_id !== user.id && !m.is_read).length}
                    isOpen={showMobileMenu}
                    onClose={() => setShowMobileMenu(false)}
                />
                <div className="flex-1 flex flex-col min-w-0">
                    <ClientTopBar
                        breadcrumbs={[
                            { label: 'Formation', path: '/client/dashboard' },
                            { label: `Critère ${criterionIndex + 1}` }
                        ]}
                        consultantName={consultantName}
                        onContact={() => navigate('/client/messages')}
                        setShowMobileMenu={setShowMobileMenu}
                    />
                    <main className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full">
                        {/* Criterion Header */}
                        <div className="mb-6">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                                CRITÈRE {criterionIndex + 1}
                            </p>
                            <h1 className="text-2xl font-black text-gray-900">{currentCriterion.label}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Découvrez comment communiquer de manière transparente et exhaustive sur votre offre de formation vers vos publics cibles.
                            </p>
                        </div>

                        {/* Content grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Video placeholder */}
                            <div className="lg:col-span-2">
                                <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#cc6d3e]/20 to-gray-900"></div>
                                    <div className="relative z-10 text-center">
                                        <div className="h-14 w-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-3 border border-white/20">
                                            <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1" />
                                        </div>
                                        <p className="text-white/60 text-sm font-medium">Vidéo du cours</p>
                                    </div>
                                    <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded font-mono">
                                        Vidéo Cours · {currentCriterion.label?.split(' ').slice(0, 2).join(' ')}
                                    </div>
                                </div>
                            </div>

                            {/* Resources + Quiz */}
                            <div className="space-y-4">
                                {/* Resources */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Ressources</h3>
                                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl hover:bg-[#faf1ec] transition-all cursor-pointer group">
                                        <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileText className="h-4 w-4 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">Référentiel_C{criterionIndex + 1}.pdf</p>
                                            <p className="text-[10px] text-gray-400">Télécharger le fichier</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quiz */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Validation</h3>
                                    <p className="text-xs text-gray-500 mb-3">Remplissez le fichier ressource et téléversez-le ici</p>
                                    {quizUploads[currentCriterion.id] ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                <span className="text-xs font-bold text-emerald-700 truncate">
                                                    {quizUploads[currentCriterion.id].file_name}
                                                </span>
                                                <Download className="h-3.5 w-3.5 text-emerald-500 ml-auto cursor-pointer" onClick={() => window.open(quizUploads[currentCriterion.id].file_url, '_blank')} />
                                            </div>
                                            <button
                                                onClick={() => { setPendingCriterionId(currentCriterion.id); fileInputRef.current?.click() }}
                                                className="w-full py-1.5 text-[10px] font-bold text-[#cc6d3e] hover:underline"
                                            >
                                                Remplacer le fichier
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setPendingCriterionId(currentCriterion.id); fileInputRef.current?.click() }}
                                            disabled={uploadingFor === currentCriterion.id}
                                            className="w-full py-2 bg-[#cc6d3e] text-white rounded-xl text-xs font-bold hover:bg-[#b35d32] transition-all shadow-md shadow-[#cc6d3e]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {uploadingFor === currentCriterion.id ? (
                                                <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : <Upload className="h-3.5 w-3.5" />}
                                            {uploadingFor === currentCriterion.id ? 'Téléchargement...' : 'Lancer le Quiz'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Preuves documentaires */}
                        <div className="relative">
                            <h2 className="text-lg font-black text-gray-900 mb-1">Preuves documentaires</h2>
                            <p className="text-sm text-gray-400 mb-8">
                                Renseignez le statut de chaque indicateur et téléversez vos documents.
                            </p>

                            <div className="space-y-10 relative">
                                {/* Vertical connector line */}
                                <div className="absolute left-[13px] top-8 bottom-8 w-0.5 bg-gray-100 -z-0" />

                                {currentCriterion.items.map((ind, idx) => {
                                    const state = indicatorStates[ind.id] || {}
                                    const status = state.status || 'to_do'
                                    const verdict = state.consultant_verdict
                                    const fileData = quizUploads[ind.id + '_ind']

                                    const isDone = status === 'done'
                                    const isNonApplicable = status === 'non_applicable'

                                    return (
                                        <div key={ind.id} className="relative z-10 group">
                                            {/* Indicator header */}
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className={`mt-3 h-[28px] w-[28px] rounded-full border-2 flex items-center justify-center flex-shrink-0 text-[11px] font-black shadow-sm transition-all ${isDone ? 'bg-[#10b981] border-[#10b981] text-white' :
                                                    isNonApplicable ? 'bg-slate-400 border-slate-400 text-white' :
                                                        'bg-white border-gray-200 text-gray-400'
                                                    }`}>
                                                    {isDone ? <Check className="h-3.5 w-3.5" /> : (isNonApplicable ? '–' : idx + 1)}
                                                </div>
                                                <div className="flex-1 min-w-0 bg-slate-50/50 rounded-[20px] px-6 py-4 border border-slate-100/50 group-hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-base font-black text-slate-900">Indicateur {idx + 1}</h3>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${status === 'done' ? 'text-emerald-600 bg-emerald-50' :
                                                            status === 'non_applicable' ? 'text-slate-500 bg-slate-50' :
                                                                'text-blue-600 bg-blue-50'
                                                            }`}>
                                                            {status === 'done' ? 'FAIT' : (status === 'non_applicable' ? 'NA' : 'EN COURS')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500 mt-1.5 font-medium leading-relaxed">{ind.label}</p>
                                                </div>
                                                <div className="mt-4 flex items-center gap-3">
                                                    {fileData && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                                            <CheckCircle className="h-3 w-3 text-gray-400" /> Fichier joint
                                                        </div>
                                                    )}
                                                    <button className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                                                        <ChevronUp className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Content Card */}
                                            <div className="ml-[14px] pl-8">
                                                <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 relative transition-all">
                                                    {/* Top Right Model Button */}
                                                    <div className="absolute top-6 right-8">
                                                        <button className="flex items-center gap-2 px-4 py-2 bg-[#f5f0ff] text-[#7c3aed] rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#ede5ff] transition-all">
                                                            <Download className="h-3.5 w-3.5" /> Télécharger le modèle type
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                                        {/* Status Selection (Left) */}
                                                        <div className="lg:col-span-4">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Déclarez votre statut</p>
                                                            <div className="space-y-2.5">
                                                                {[
                                                                    { val: 'to_do', label: 'En cours', icon: Sun, color: 'text-blue-600', active: 'border-blue-200 bg-blue-50 text-blue-700' },
                                                                    { val: 'done', label: 'Fait', icon: Flag, color: 'text-emerald-500', active: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
                                                                    { val: 'non_applicable', label: 'Non applicable', icon: Ban, color: 'text-slate-500', active: 'border-slate-300 bg-slate-50 text-slate-700' },
                                                                ].map(opt => (
                                                                    <button
                                                                        key={opt.val}
                                                                        onClick={() => handleStatusChange(ind.id, opt.val)}
                                                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-[13px] font-bold transition-all ${status === opt.val
                                                                            ? opt.active
                                                                            : 'border-transparent bg-gray-50/50 text-gray-400 hover:bg-gray-50'
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <opt.icon className={`h-4 w-4 ${status === opt.val ? '' : 'text-gray-300'}`} />
                                                                            {opt.label}
                                                                        </div>
                                                                        {status === opt.val && <CheckCircle className={`h-4 w-4`} />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* File Management (Right) */}
                                                        <div className="lg:col-span-8">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">
                                                                {status === 'non_applicable' ? 'Justification de non-applicabilité' : 'Preuve documentaire'}
                                                            </p>

                                                            {status === 'non_applicable' ? (
                                                                <div className="h-full">
                                                                    <textarea
                                                                        placeholder="Pourquoi cet indicateur ne s'applique pas à votre organisme ?"
                                                                        value={state.client_comment || ''}
                                                                        onChange={(e) => setIndicatorStates(prev => ({...prev, [ind.id]: { ...(prev[ind.id] || {}), client_comment: e.target.value }}))}
                                                                        onBlur={(e) => handleCommentChange(ind.id, e.target.value)}
                                                                        className="w-full h-[154px] px-5 py-4 rounded-2xl border-2 border-gray-50 text-sm text-gray-600 outline-none focus:border-blue-100 focus:bg-white transition-all resize-none bg-gray-50/50"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="h-full">
                                                                    {fileData ? (
                                                                        <div className="h-[154px] flex flex-col justify-center bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-2xl px-8 relative">
                                                                            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-5 shadow-sm">
                                                                                <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-red-500">
                                                                                    <FileText className="h-7 w-7" />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-sm font-black text-gray-900 truncate mb-1">{fileData.file_name}</p>
                                                                                    <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                                                                        <Check className="h-3 w-3 stroke-[3px]" /> Prêt pour l'audit
                                                                                    </p>
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => handleDeleteFile(ind.id + '_ind')}
                                                                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                                                >
                                                                                    <Trash2 className="h-5 w-5" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => { setPendingCriterionId(ind.id + '_ind'); fileInputRef.current?.click() }}
                                                                            disabled={uploadingFor === ind.id + '_ind'}
                                                                            className="w-full h-[154px] flex flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-gray-100 text-gray-500 hover:border-[#7c3aed]/30 hover:bg-[#fbf9ff] transition-all group"
                                                                        >
                                                                            <div className="h-12 w-12 bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                                <Upload className="h-6 w-6 text-[#7c3aed]" />
                                                                            </div>
                                                                            <div className="text-center">
                                                                                <p className="text-sm font-black text-gray-800">Cliquez pour uploader un document</p>
                                                                                <p className="text-[11px] text-gray-400 mt-1 font-medium">Simule un upload et passe en "Fait"</p>
                                                                            </div>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </main>
                </div>

                <input
                    ref={fileInputRef} type="file"
                    accept=".pdf,.doc,.docx,.jpg,.png" className="hidden"
                    onChange={e => {
                        const file = e.target.files?.[0]
                        if (file && pendingCriterionId) handleFileUpload(file, pendingCriterionId)
                        e.target.value = ''
                    }}
                />
            </div>
        )
    }

    // ─── MAIN DASHBOARD (Vue d'ensemble) ─────────────────────────────────────
    return (
        <div className="bg-gray-50 min-h-screen flex font-sans">
            <ClientSidebar
                caseData={myCase}
                indicators={indicators}
                indicatorStates={indicatorStates}
                consultantName={consultantName}
                unreadCount={messages.filter(m => m.sender_id !== user.id && !m.is_read).length}
                isOpen={showMobileMenu}
                onClose={() => setShowMobileMenu(false)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <ClientTopBar
                    breadcrumbs={[{ label: 'Formation' }, { label: "Vue d'ensemble" }]}
                    consultantName={consultantName}
                    onContact={() => navigate('/client/messages')}
                    setShowMobileMenu={setShowMobileMenu}
                />

                <main className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full">

                    {/* Title + audit badges */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-black text-gray-900 mb-3">Tableau de bord de votre audit</h1>
                        <div className="flex gap-2 flex-wrap">
                            {(Array.isArray(myCase?.audit_type) ? myCase.audit_type : []).map((type, i) => (
                                <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 shadow-sm">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    {type.toUpperCase()}
                                </span>
                            ))}
                            {(Array.isArray(myCase?.training_categories) ? myCase.training_categories : []).map((cat, i) => (
                                <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 shadow-sm">
                                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                    ACTION DE FORMATION ({cat})
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Welcome card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                        <h2 className="text-base font-black text-gray-900 mb-1">
                            Bienvenue dans votre espace d'accompagnement Qualiopi 👋
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">
                            Cette plateforme est conçue pour vous guider pas à pas vers votre certification. Pour chaque critère du référentiel,{' '}
                            <span className="text-[#cc6d3e] font-semibold">vous retrouverez des ressources pédagogiques</span>{' '}
                            et un espace pour déposer vos éléments. Voici le déroulé de votre préparation :
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { n: 1, title: 'Formez-vous', desc: 'Visionnez les vidéos de cours et validez les quiz interactifs.' },
                                { n: 2, title: 'Préparez les preuves', desc: 'Adaptez les modèles et déposez vos documents pour chaque indicateur.' },
                                { n: 3, title: 'Soumettez le dossier', desc: "Une fois les indicateurs 'Faits', envoyez le dossier complet au consultant." },
                                { n: 4, title: 'Audit blanc', desc: 'Le consultant révise vos preuves et vous prépare à l\'audit final.' },
                            ].map(step => (
                                <div key={step.n} className="flex flex-col gap-2 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                                    <div className="h-7 w-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-black text-gray-400 shadow-sm">
                                        {step.n}
                                    </div>
                                    <p className="text-xs font-black text-gray-800">{step.title}</p>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Progress Bar with criteria */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Avancement Global</p>
                            <span className="text-xl font-black text-[#cc6d3e]">{progressPercent}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full bg-gradient-to-r from-[#b35d32] to-[#cc6d3e] rounded-full transition-all duration-1000"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        {/* Criteria chips */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {criteriaList.map((criterion, idx) => {
                                const done = criterion.items.filter(ind =>
                                    indicatorStates[ind.id]?.status === 'done' || indicatorStates[ind.id]?.status === 'non_applicable'
                                ).length
                                const allDone = done === criterion.items.length && criterion.items.length > 0
                                return (
                                    <button
                                        key={criterion.id}
                                        onClick={() => navigate(`/client/criterion/${criterion.id}`)}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all hover:scale-105 ${allDone ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-100 hover:border-[#cc6d3e]/40'
                                            }`}
                                    >
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black border-2 ${allDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                                            done > 0 ? 'border-[#cc6d3e] text-[#cc6d3e] bg-[#faf1ec]' :
                                                'border-gray-200 text-gray-400 bg-white'
                                            }`}>
                                            {allDone ? '✓' : idx + 1}
                                        </div>
                                        <span className={`text-[10px] font-bold ${allDone ? 'text-emerald-600' : 'text-gray-400'}`}>C{idx + 1}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {/* Validated */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
                            <div className="absolute top-3 right-3">
                                <CheckCircle className="h-10 w-10 text-emerald-100" />
                            </div>
                            <p className="text-3xl font-black text-emerald-600 mb-1">{validatedCount}</p>
                            <p className="text-sm font-bold text-gray-800">Indicateurs validés</p>
                            <p className="text-xs text-gray-400 mt-1">Prêts pour l'audit blanc.</p>
                        </div>

                        {/* To treat */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
                            <div className="absolute top-3 right-3">
                                <Clock className="h-10 w-10 text-gray-100" />
                            </div>
                            <p className="text-3xl font-black text-gray-600 mb-1">
                                {totalIndicators - validatedCount - rejectedCount}
                            </p>
                            <p className="text-sm font-bold text-gray-800">À traiter</p>
                            <p className="text-xs text-gray-400 mt-1">Preuves manquantes ou en cours.</p>
                        </div>

                        {/* Action required */}
                        <div className={`rounded-2xl border shadow-sm p-5 relative overflow-hidden ${rejectedCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'
                            }`}>
                            <div className="absolute top-3 right-3">
                                <AlertTriangle className={`h-10 w-10 ${rejectedCount > 0 ? 'text-red-200' : 'text-gray-100'}`} />
                            </div>
                            <p className={`text-3xl font-black mb-1 ${rejectedCount > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                                {rejectedCount}
                            </p>
                            <p className={`text-sm font-bold ${rejectedCount > 0 ? 'text-red-800' : 'text-gray-400'}`}>Action requise</p>
                            <p className={`text-xs mt-1 ${rejectedCount > 0 ? 'text-red-500' : 'text-gray-300'}`}>
                                Indicateurs rejetés par le consultant.
                            </p>
                            {rejectedCount > 0 && (
                                <button
                                    onClick={() => criteriaList[0] && navigate(`/client/criterion/${criteriaList[0].id}`)}
                                    className="mt-3 w-full py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all"
                                >
                                    Corriger maintenant
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Soumission finale */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                        <h3 className="text-base font-black text-gray-900 mb-1">Soumission finale</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Une fois les {totalIndicators} indicateurs traités,{' '}
                            <span className="text-[#cc6d3e] font-semibold">vous pourrez envoyer</span>{' '}
                            le dossier complet à votre consultant.
                        </p>
                        <button
                            disabled={validatedCount < totalIndicators}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-400 rounded-xl text-sm font-bold cursor-not-allowed transition-all disabled:opacity-60"
                        >
                            <CheckSquare className="h-4 w-4" />
                            Soumettre mon dossier complet
                        </button>
                    </div>

                </main>
            </div>
        </div>
    )
}

