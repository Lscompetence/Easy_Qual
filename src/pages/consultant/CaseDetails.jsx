import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import NewCaseModal from '../../components/consultant/NewCaseModal'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'
import {
    ChevronLeft,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    LayoutDashboard,
    Target,
    Users,
    BookOpen,
    Award,
    Globe,
    TrendingUp,
    ShieldCheck,
    RefreshCw,
    MessageSquare,
    Search,
    Send
} from 'lucide-react'

// Icon mapping for Criteria
const CRITERIA_ICONS = {
    1: <LayoutDashboard className="h-6 w-6" />,
    2: <Target className="h-6 w-6" />,
    3: <Users className="h-6 w-6" />,
    4: <BookOpen className="h-6 w-6" />,
    5: <Award className="h-6 w-6" />,
    6: <Globe className="h-6 w-6" />,
    7: <TrendingUp className="h-6 w-6" />
}

// Premium Color Gradients for Criteria
const CRITERIA_STYLES = {
    1: { bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', icon: 'bg-cyan-200 text-cyan-700', bar: 'bg-cyan-500' },
    2: { bg: 'bg-gradient-to-br from-blue-50 to-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: 'bg-blue-200 text-blue-700', bar: 'bg-blue-500' },
    3: { bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'bg-indigo-200 text-indigo-700', bar: 'bg-indigo-500' },
    4: { bg: 'bg-gradient-to-br from-purple-50 to-purple-100', text: 'text-purple-700', border: 'border-purple-200', icon: 'bg-purple-200 text-purple-700', bar: 'bg-purple-500' },
    5: { bg: 'bg-gradient-to-br from-fuchsia-50 to-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200', icon: 'bg-fuchsia-200 text-fuchsia-700', bar: 'bg-fuchsia-500' },
    6: { bg: 'bg-gradient-to-br from-pink-50 to-pink-100', text: 'text-pink-700', border: 'border-pink-200', icon: 'bg-pink-200 text-pink-700', bar: 'bg-pink-500' },
    7: { bg: 'bg-gradient-to-br from-rose-50 to-rose-100', text: 'text-rose-700', border: 'border-rose-200', icon: 'bg-rose-200 text-rose-700', bar: 'bg-rose-500' }
}

export default function CaseDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [loading, setLoading] = useState(true)
    const [caseData, setCaseData] = useState(null)
    const [criteriaData, setCriteriaData] = useState([])
    const [allIndicatorStates, setAllIndicatorStates] = useState([])
    const [indicatorStates, setIndicatorStates] = useState({})
    const [stats, setStats] = useState({ total: 32, validated: 0 })
    const [showNewCaseModal, setShowNewCaseModal] = useState(false)
    const [quizUploads, setQuizUploads] = useState({}) // { criterion_id: quiz }

    // NEW TABS STATE
    const [activeTab, setActiveTab] = useState('suivi_rno')
    const [activeCriterion, setActiveCriterion] = useState(null)
    const [selectedIndicatorId, setSelectedIndicatorId] = useState(null) // which indicator is expanded
    const [criterionComments, setCriterionComments] = useState({}) // { criterion_id: string }
    const [savingComment, setSavingComment] = useState(null) // criterion_id being saved

    const [error, setError] = useState(null)

    // DEBUGGING LOGS
    console.log('CaseDetails Render - ID:', id)
    console.log('CaseDetails Render - Auth User:', user?.id)
    console.log('CaseDetails Render - Case Data:', caseData)
    console.log('CaseDetails Render - Error:', error)

    useEffect(() => {
        if (!caseData) return

        const filteredMap = {}
        let validatedCount = 0
        const totalCount = criteriaData.reduce((acc, crit) => acc + (crit.indicators?.length || 0), 0)
        const currentAuditType = 'initial'

        allIndicatorStates.filter(s => (s.audit_type || 'initial') === currentAuditType).forEach(s => {
            filteredMap[s.indicator_id] = {
                status: s.status,
                consultant_verdict: s.consultant_verdict
            }
            if (s.status === 'done') validatedCount++
        })

        setIndicatorStates(filteredMap)
        if (totalCount > 0) {
            setStats({ total: totalCount, validated: validatedCount })
        }
    }, [allIndicatorStates, criteriaData, caseData])

    useEffect(() => {
        if (id && user) {
            fetchCaseDetails()
        } else if (!id) {
            setError("ID manquant dans l'URL")
            setLoading(false)
        }
    }, [id, user])

    const fetchCaseDetails = async () => {
        console.log('Fetching details for case:', id)
        try {
            setLoading(true)
            setError(null)

            const { data: cData, error: cError } = await supabase
                .from('cases')
                .select(`*, tenants (name, siret, logo_url)`)
                .eq('id', id)
                .single()

            if (cError) {
                console.error("Supabase Error fetching case:", cError)
                throw cError
            }
            if (!cData) throw new Error("Aucune donnée trouvée pour ce dossier")

            setCaseData(cData)

            const { data: indData, error: indError } = await supabase
                .from('indicators')
                .select(`id, code, label, criteria (id, label, description)`)
                .order('id')

            if (indError) {
                console.error("Supabase Error fetching indicators:", indError)
                throw indError
            }

            const grouped = {}
            indData.forEach(ind => {
                const cId = ind.criteria.id
                if (!grouped[cId]) grouped[cId] = { ...ind.criteria, indicators: [] }
                grouped[cId].indicators.push(ind)
            })
            setCriteriaData(Object.values(grouped).sort((a, b) => a.id - b.id))

            const { data: sData, error: sError } = await supabase
                .from('case_indicator_states')
                .select('*')
                .eq('case_id', id)

            if (sError) throw sError
            setAllIndicatorStates(sData || [])

            // Fetch quiz uploads for this case
            const { data: quizData } = await supabase
                .from('criterion_quiz_uploads')
                .select('criterion_id, file_name, uploaded_at')
                .eq('case_id', id)
            const quizMap = {}
            quizData?.forEach(q => { quizMap[q.criterion_id] = q })
            setQuizUploads(quizMap)

        } catch (error) {
            console.error('Error fetching details:', error)
            setError(error.message || "Erreur lors du chargement du dossier")
        } finally {
            setLoading(false)
        }
    }

    const handleCriterionClick = (criterion) => {
        setActiveCriterion(criterion)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleIndicatorUpdate = async (indicatorId, newStatus) => {
        // 1. Calculate new states locally first to determine progress
        let updatedStates = [...allIndicatorStates]
        const type = 'initial' // Default audit type
        const index = updatedStates.findIndex(s => s.indicator_id === indicatorId && s.audit_type === type)

        if (index >= 0) {
            updatedStates[index] = { ...updatedStates[index], status: newStatus }
        } else {
            updatedStates.push({ indicator_id: indicatorId, audit_type: type, status: newStatus, case_id: id })
        }

        // 2. Update UI State
        setAllIndicatorStates(updatedStates)

        // 3. Calculate Progress
        const total = stats.total || 1
        const validatedCount = updatedStates.filter(s => s.status === 'done' && (s.audit_type === type || !s.audit_type)).length
        const newProgress = Math.min(100, Math.round((validatedCount / total) * 100))

        // 4. Update Case in DB (Progress & Status)
        try {
            const { error } = await supabase
                .from('cases')
                .update({
                    progress: newProgress,
                    status: caseData.status === 'draft' ? 'active' : caseData.status
                })
                .eq('id', id)

            if (error) throw error

            // Update local caseData
            setCaseData(prev => ({
                ...prev,
                progress: newProgress,
                status: prev.status === 'draft' ? 'active' : prev.status
            }))

        } catch (err) {
            console.error("Error updating case progress:", err)
        }
    }

    // Save consultant verdict for an indicator
    const handleVerdict = async (indicatorId, verdict) => {
        // Optimistic update
        setIndicatorStates(prev => ({
            ...prev,
            [indicatorId]: { ...(prev[indicatorId] || {}), consultant_verdict: verdict }
        }))
        try {
            await supabase.from('case_indicator_states').upsert({
                case_id: id,
                indicator_id: indicatorId,
                audit_type: 'initial',
                status: indicatorStates[indicatorId]?.status || 'to_do',
                consultant_verdict: verdict
            }, { onConflict: 'case_id,indicator_id,audit_type' })
        } catch (err) {
            console.error('Error saving verdict:', err)
        }
        setSelectedIndicatorId(null) // collapse after verdict
    }

    // Save consultant comment for a criterion
    const handleSaveCriterionComment = async (criterionId) => {
        setSavingComment(criterionId)
        try {
            await supabase.from('criterion_quiz_uploads').upsert({
                case_id: id,
                criterion_id: criterionId,
                audit_type: 'initial',
                file_url: quizUploads[criterionId]?.file_url || '',
                file_name: quizUploads[criterionId]?.file_name || '',
                consultant_comment: criterionComments[criterionId] || ''
            }, { onConflict: 'case_id,criterion_id,audit_type' })
        } catch (err) {
            console.error('Error saving comment:', err)
        } finally {
            setSavingComment(null)
        }
    }

    const handleGenerateReport = () => {
        const doc = new jsPDF()

        // -- HEADER --
        doc.setFillColor(67, 56, 202) // Indigo 700
        doc.rect(0, 0, 210, 40, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.text("Rapport d'Audit Qualiopi", 105, 20, { align: 'center' })

        doc.setFontSize(12)
        const now = new Date()
        doc.text(`Client : ${caseData.tenant_name || 'N/A'}`, 20, 32)
        doc.text(`Généré le : ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`, 120, 32)

        let yPos = 50

        // -- GLOBAL STATS --
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(14)
        doc.text(`Score Global : ${Math.round((stats.validated / stats.total) * 100)}%`, 20, yPos)
        yPos += 15

        // -- CRITERIA LOOP --
        criteriaData.forEach((crit) => {
            const critIndicators = crit.indicators || []
            const clientProgress = Math.round((critIndicators.filter(i => indicatorStates[i.id]?.status === 'done').length / critIndicators.length) * 100)

            // Criterion Title
            yPos += 10
            doc.setFillColor(240, 240, 240)
            doc.rect(14, yPos - 7, 182, 10, 'F')
            doc.setFontSize(12)
            doc.setTextColor(0, 0, 0)
            doc.setFont('helvetica', 'bold')
            doc.text(`${crit.label} (${clientProgress}%)`, 20, yPos)
            yPos += 8

            // Quiz Section (Top)
            const quiz = quizUploads[crit.id]
            if (quiz) {
                doc.setDrawColor(200, 200, 255)
                doc.setFillColor(240, 248, 255) // AliceBlue
                doc.roundedRect(14, yPos, 182, 10, 2, 2, 'FD')

                doc.setFontSize(10)
                doc.setTextColor(0, 0, 0)
                doc.setFont('helvetica', 'bold')
                doc.text("Quiz importé : ", 20, yPos + 6)

                doc.setTextColor(37, 99, 235) // Blue link
                doc.textWithLink(quiz.file_name || 'Télécharger', 50, yPos + 6, { url: quiz.file_url })
                yPos += 15
            } else {
                yPos += 5
            }

            // Table Body
            const tableBody = critIndicators.map(ind => {
                const state = indicatorStates[ind.id] || {}
                let statusText = 'À faire'
                if (state.status === 'doing') statusText = 'En cours'
                if (state.status === 'done') statusText = 'Terminé'

                let verdictText = '-'
                if (state.consultant_verdict === 'validated') verdictText = 'VALIDE'
                if (state.consultant_verdict === 'non_conforme') verdictText = 'NON CONFORME'

                return [
                    `${ind.code} - ${ind.label.substring(0, 60)}...`,
                    statusText,
                    verdictText,
                    state.consultant_comment || ''
                ]
            })

            autoTable(doc, {
                startY: yPos,
                head: [['Indicateur', 'Statut Client', 'Décision', 'Commentaire']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: { 0: { cellWidth: 80 }, 3: { cellWidth: 50 } },
                margin: { left: 14, right: 14 }
            })

            yPos = doc.lastAutoTable.finalY + 10

            // Quiz & Main Comment
            const comment = criterionComments[crit.id]

            if (quiz || comment) {
                // Check page break
                if (yPos > 250) {
                    doc.addPage()
                    yPos = 20
                }

                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.text("Synthèse du critère :", 20, yPos)
                yPos += 6
                doc.setFont('helvetica', 'normal')

                if (quiz) {
                    // Quiz moved to top
                }

                if (comment) {
                    const splitComment = doc.splitTextToSize(`Commentaire: ${comment}`, 170)
                    doc.text(splitComment, 20, yPos)
                    yPos += (splitComment.length * 5) + 5
                }
            }
        })

        doc.save(`Rapport_Audit_${caseData.tenant_name}_${new Date().toISOString().split('T')[0]}.pdf`)
    }


    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                    <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold">!</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Une erreur est survenue</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/consultant/dashboard')}
                        className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        Retour au tableau de bord
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="block w-full mt-4 text-sm text-blue-600 hover:underline"
                    >
                        Recharger la page
                    </button>
                </div>
            </div>
        )
    }

    if (!caseData) return <div className="p-8 text-center text-gray-500">Dossier introuvable (Data is null)</div>

    // Dynamic Global Progress (Client based)
    const allIndicators = criteriaData.flatMap(c => c.indicators || [])
    const globalDone = allIndicators.filter(i => indicatorStates[i.id]?.status === 'done').length
    const progressPercent = Math.round((globalDone / (allIndicators.length || 1)) * 100) || 0

    // Get Initials for Logo
    const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : '??'

    return (
        <div className="bg-gray-50 min-h-screen font-sans flex text-slate-800">
            <ConsultantSidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <ConsultantTopBar onNewFolder={() => setShowNewCaseModal(true)} />

                <div className="p-4 sm:p-6 lg:p-8 max-w-[2000px] mx-auto w-full">
                    {/* BREADCRUMB */}
                    <button
                        onClick={() => navigate('/consultant/dashboard')}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Retour au tableau de bord
                    </button>

                    {/* HEADER CARD */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-6 w-full md:w-auto">
                            <div className="h-20 w-20 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-emerald-200">
                                {getInitials(caseData.tenants?.name)}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900">{caseData.tenants?.name}</h1>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(caseData.training_categories) && caseData.training_categories.map((cat, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded border border-gray-200">
                                                {cat.includes(' / ') ? 'CFA' : cat}
                                            </span>
                                        ))}
                                        {Array.isArray(caseData.audit_type) && caseData.audit_type.map((type, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded border border-amber-100">
                                                {type.split(' ')[1]}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    {/* Referent removed */}
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span>Modifié hier</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="w-full md:w-auto md:min-w-[300px] flex items-center gap-6">
                            <div className="flex-1">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Avancement Global</span>
                                    <span className="text-2xl font-bold text-gray-900">{progressPercent}%</span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                            </div>
                            <button
                                onClick={handleGenerateReport}
                                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2 print:hidden"
                            >
                                <FileText className="h-4 w-4" />
                                Rapport
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 border-b border-gray-200 mb-8">
                        {['Détail de l\'Audit', 'Planification', 'Messagerie'].map((tab) => {
                            const key = tab === 'Détail de l\'Audit' ? 'suivi_rno' : tab.toLowerCase().replace(' ', '_').replace('é', 'e')
                            const isActive = activeTab === key

                            // Mock badges
                            let badge = null
                            if (key === 'suivi_rno') badge = <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full">3</span>
                            if (key === 'planification') badge = <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded-full">Actif</span>
                            if (key === 'messagerie') badge = <span className="ml-2 h-2 w-2 rounded-full bg-red-500 inline-block"></span>

                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`relative pb-4 text-sm font-bold transition-colors flex items-center ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab}
                                    {badge}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* CONTENT AREA */}
                    {/* CONTENT AREA */}


                    {activeTab === 'messagerie' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex h-[600px] overflow-hidden">
                            {/* LEFT LIST */}
                            <div className="w-1/3 border-r border-gray-100 flex flex-col">
                                <div className="p-4 border-b border-gray-50">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Rechercher..."
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <div className="p-4 hover:bg-blue-50 cursor-pointer border-l-4 border-blue-600 bg-blue-50/50">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-900 text-sm">Sarah Conner</h4>
                                            <span className="text-[10px] text-gray-400">09:42</span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">
                                            Merci pour le retour sur l'indicateur...
                                        </p>
                                    </div>
                                    {/* More items... */}
                                </div>
                            </div>

                            {/* RIGHT CHAT */}
                            <div className="flex-1 flex flex-col">
                                {/* Header */}
                                <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900">Discussion - {caseData.tenants?.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs text-green-600 font-bold">En ligne</span>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 bg-gray-50 p-6 overflow-y-auto space-y-4">
                                    {messages.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl p-4 ${msg.isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white shadow-sm border border-gray-100 text-gray-700 rounded-bl-none'}`}>
                                                <p className="text-sm font-medium mb-1">{msg.text}</p>
                                                <span className={`text-[10px] block text-right ${msg.isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {msg.time}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Input */}
                                <div className="p-4 bg-white border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Écrivez votre message..."
                                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <button className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SUIVI RNO ── */}
                    {activeTab === 'suivi_rno' && (
                        <div className="space-y-5">
                            {criteriaData.length === 0 ? (
                                <div className="p-8 text-center bg-white rounded-2xl border border-gray-100">
                                    <p className="text-gray-400">Aucun référentiel chargé pour ce dossier.</p>
                                </div>
                            ) : (
                                criteriaData.map((crit) => {
                                    const critIndicators = crit.indicators || []
                                    const verdictCount = critIndicators.filter(i => indicatorStates[i.id]?.consultant_verdict === 'validated').length
                                    const nonConformeCount = critIndicators.filter(i => indicatorStates[i.id]?.consultant_verdict === 'non_conforme').length

                                    // Client Progress: based on status = 'done'
                                    const clientDoneCount = critIndicators.filter(i => indicatorStates[i.id]?.status === 'done').length
                                    const percent = Math.round((clientDoneCount / critIndicators.length) * 100) || 0

                                    const quiz = quizUploads[crit.id]

                                    return (
                                        <div key={crit.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                                            {/* ── Criterion Header ── */}
                                            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-black shadow-md shadow-indigo-200">
                                                        C{crit.id}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900">{crit.label}</h3>
                                                        <p className="text-xs text-gray-400 mt-0.5">{clientDoneCount}/{critIndicators.length} indicateurs terminés</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {/* Progress pill */}
                                                    <div className="hidden sm:flex items-center gap-2">
                                                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-400">{percent}%</span>
                                                    </div>
                                                    {/* Verdict summary */}
                                                    {verdictCount > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                                            <CheckCircle className="h-3 w-3" /> {verdictCount}
                                                        </span>
                                                    )}
                                                    {nonConformeCount > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                                                            <XCircle className="h-3 w-3" /> {nonConformeCount}
                                                        </span>
                                                    )}
                                                    {quiz && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                                            <FileText className="h-3 w-3" /> Quiz
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ── Indicator List ── */}
                                            <div className="divide-y divide-gray-50">
                                                {critIndicators.map((ind, idx) => {
                                                    const state = indicatorStates[ind.id] || {}
                                                    const verdict = state.consultant_verdict
                                                    const isOpen = selectedIndicatorId === ind.id

                                                    return (
                                                        <div key={ind.id}>
                                                            {/* Row — click to expand */}
                                                            <button
                                                                onClick={() => setSelectedIndicatorId(isOpen ? null : ind.id)}
                                                                className={`w-full flex items-center justify-between px-6 py-3.5 text-left transition-all group ${isOpen ? 'bg-indigo-50' : 'hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    {/* Number */}
                                                                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                                        {idx + 1}
                                                                    </span>
                                                                    {/* Label only */}
                                                                    <span className="text-sm font-medium text-gray-800 leading-snug truncate">
                                                                        {ind.label}
                                                                    </span>
                                                                </div>
                                                                {/* Verdict badge */}
                                                                <div className="flex-shrink-0 ml-3">
                                                                    {verdict === 'validated' && (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                                                            <CheckCircle className="h-3.5 w-3.5" /> Validé
                                                                        </span>
                                                                    )}
                                                                    {verdict === 'non_conforme' && (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                                                            <XCircle className="h-3.5 w-3.5" /> Non conforme
                                                                        </span>
                                                                    )}
                                                                    {!verdict && (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 text-xs font-medium">
                                                                            En attente
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </button>

                                                            {/* Expanded verdict panel */}
                                                            {/* Expanded verdict panel */}
                                                            {isOpen && (
                                                                <div className="px-6 pb-5 pt-3 bg-indigo-50 border-t border-indigo-100 space-y-4">

                                                                    {/* Client self-assessment */}
                                                                    <div className="bg-white rounded-xl border border-indigo-100 p-4">
                                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Statut déclaré par le client</p>
                                                                        <div className="flex gap-2">
                                                                            {/* To Do */}
                                                                            <div className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-bold transition-all ${(!state.status || state.status === 'to_do')
                                                                                ? 'bg-gray-100 text-gray-700 border-gray-300'
                                                                                : 'bg-white text-gray-300 border-gray-100'
                                                                                }`}>
                                                                                <span className="h-2 w-2 rounded-full bg-current" /> À faire
                                                                            </div>

                                                                            {/* Doing */}
                                                                            <div className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-bold transition-all ${state.status === 'doing'
                                                                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                                                                : 'bg-white text-gray-300 border-gray-100'
                                                                                }`}>
                                                                                <Clock className="h-4 w-4" /> En cours
                                                                            </div>

                                                                            {/* Done */}
                                                                            <div className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-bold transition-all ${state.status === 'done'
                                                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                                                                : 'bg-white text-gray-300 border-gray-100'
                                                                                }`}>
                                                                                <CheckCircle className="h-4 w-4" /> Terminé
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Consultant verdict */}
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Votre décision</p>
                                                                        <div className="flex gap-3">
                                                                            <button
                                                                                onClick={() => handleVerdict(ind.id, 'validated')}
                                                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${verdict === 'validated'
                                                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200'
                                                                                    : 'border-emerald-200 text-emerald-600 bg-white hover:bg-emerald-50'
                                                                                    }`}
                                                                            >
                                                                                <CheckCircle className="h-4 w-4" /> Validé
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleVerdict(ind.id, 'non_conforme')}
                                                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${verdict === 'non_conforme'
                                                                                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200'
                                                                                    : 'border-red-200 text-red-600 bg-white hover:bg-red-50'
                                                                                    }`}
                                                                            >
                                                                                <XCircle className="h-4 w-4" /> Non conforme
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* ── Criterion Footer: Quiz + Comment ── */}
                                            <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-5 space-y-4">

                                                {/* Quiz File */}
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Fichier quiz soumis par le client</p>
                                                    {quiz ? (
                                                        <a
                                                            href={quiz.file_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-3 px-4 py-3 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors group shadow-sm"
                                                        >
                                                            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <FileText className="h-4 w-4 text-white" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-indigo-900 truncate">{quiz.file_name || 'Quiz.pdf'}</p>
                                                                <p className="text-xs text-indigo-400">Soumis le {new Date(quiz.uploaded_at).toLocaleDateString('fr-FR')}</p>
                                                            </div>
                                                            <MessageSquare className="h-4 w-4 text-indigo-400 group-hover:text-indigo-600 ml-auto" />
                                                        </a>
                                                    ) : (
                                                        <div className="flex items-center gap-2 px-4 py-3 bg-white border border-dashed border-gray-200 rounded-xl text-gray-400">
                                                            <FileText className="h-4 w-4" />
                                                            <span className="text-xs">Aucun quiz soumis pour ce critère</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Comment Box */}
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Commentaire / Remarques</p>
                                                    <textarea
                                                        value={criterionComments[crit.id] || ''}
                                                        onChange={e => setCriterionComments(prev => ({ ...prev, [crit.id]: e.target.value }))}
                                                        rows={3}
                                                        placeholder="Notez les erreurs, points à corriger ou observations pour ce critère…"
                                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none transition-all"
                                                    />
                                                    <button
                                                        onClick={() => handleSaveCriterionComment(crit.id)}
                                                        disabled={savingComment === crit.id}
                                                        className="mt-2 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {savingComment === crit.id ? 'Enregistrement…' : 'Enregistrer'}
                                                    </button>
                                                </div>
                                            </div>

                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}

                    {/* VUE PLANIFICATION (Timeline Mockup) */}
                    {activeTab === 'planification' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fadeIn max-w-4xl mx-auto">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-xl font-bold text-gray-900">Parcours d'Accompagnement</h2>
                                <button className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wide">
                                    <Plus className="h-4 w-4" /> Ajouter une étape
                                </button>
                            </div>

                            <div className="relative border-l-2 border-dashed border-gray-200 ml-6 space-y-10 py-2">
                                {/* Step 1: RDV Lancement (Done) */}
                                <div className="relative pl-10">
                                    <div className="absolute -left-[9px] top-0 h-5 w-5 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                        <h3 className="text-base font-bold text-gray-900">Rendez-vous de lancement</h3>
                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase border border-green-200 mt-1 sm:mt-0">Réalisé</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">Cadrage de la mission et analyse initiale.</p>
                                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-600 font-medium">
                                        Note: Client très réactif. Documents administratifs collectés.
                                    </div>
                                </div>

                                {/* Step 2: Mentorat (Current) */}
                                <div className="relative pl-10">
                                    <div className="absolute -left-[9px] top-0 h-5 w-5 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center animate-pulse">
                                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                        <h3 className="text-base font-bold text-gray-900">Mentorat : Suivi Mi-Parcours</h3>
                                        <button className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 mt-2 sm:mt-0">
                                            Lancer Visio
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">Revue des indicateurs bloquants (C2, C3).</p>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded border border-blue-100">
                                        <Calendar className="h-3 w-3" /> 16 Fév. 2026 à 14:00
                                    </div>
                                </div>

                                {/* Step 3: Audit Blanc (Future) */}
                                <div className="relative pl-10">
                                    <div className="absolute -left-[9px] top-0 h-5 w-5 rounded-full bg-purple-50 border-2 border-purple-200 flex items-center justify-center">
                                        <span className="h-2 w-2 rounded-full bg-purple-300"></span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                        <h3 className="text-base font-bold text-gray-900">Audit Blanc</h3>
                                        <button className="text-xs font-bold text-purple-600 border border-purple-200 bg-white px-3 py-1.5 rounded hover:bg-purple-50 transition-colors mt-2 sm:mt-0">
                                            Planifier
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">Simulation complète de l'audit de surveillance.</p>
                                    <div className="flex items-center gap-1.5 text-xs text-purple-500 font-medium">
                                        <Info className="h-3 w-3" /> En attente de validation des indicateurs
                                    </div>
                                </div>

                                {/* Step 4: Audit de Surveillance (Final) */}
                                <div className="relative pl-10">
                                    <div className="absolute -left-[9px] top-0 h-5 w-5 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center">
                                        <span className="h-2 w-2 rounded-full bg-gray-300"></span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                        <h3 className="text-base font-bold text-gray-900">Audit de Surveillance</h3>
                                    </div>
                                    <p className="text-sm text-gray-500">Date prévisionnelle : Mars 2026</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>


            <NewCaseModal
                isOpen={showNewCaseModal}
                onClose={() => setShowNewCaseModal(false)}
                user={user}
                onSuccess={() => { setShowNewCaseModal(false); navigate('/consultant/cases') }}
            />
        </div >
    )
}
