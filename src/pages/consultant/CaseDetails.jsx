import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import NewCaseModal from '../../components/consultant/NewCaseModal'
import EventModal from '../../components/consultant/EventModal'
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
    MessageCircle,
    Search,
    Send,
    Plus,
    Calendar,
    Info,
    Edit2,
    Trash2,
    Video,
    CircleOff,
    AlertTriangle
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
    const [error, setError] = useState(null)
    const [stats, setStats] = useState({ total: 32, validated: 0 })
    const [showNewCaseModal, setShowNewCaseModal] = useState(false)
    const [quizUploads, setQuizUploads] = useState({}) // { criterion_id: { audit_type: quiz } }

    // NEW TABS STATE
    const [activeTab, setActiveTab] = useState('suivi_rno')
    const [selectedAudit, setSelectedAudit] = useState('initial') // 'initial' | 'surveillance 1' | ...
    const [activeCriterion, setActiveCriterion] = useState(null)
    const [selectedIndicatorId, setSelectedIndicatorId] = useState(null) // which indicator is expanded
    const [criterionComments, setCriterionComments] = useState({}) // { criterion_id: string }
    const [savingComment, setSavingComment] = useState(null) // criterion_id being saved



    // Planning State
    const [events, setEvents] = useState([])
    const [showEventModal, setShowEventModal] = useState(false)
    const [editingEvent, setEditingEvent] = useState(null)
    const [savingEvent, setSavingEvent] = useState(false)

    // Messaging State
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [scrolledToBottom, setScrolledToBottom] = useState(false)
    const messagesEndRef = useRef(null)

    // Helpers
    const isInitialAudit = (t) => !t || t === 'initial' || t.toLowerCase().includes('initial')


    // Unified Weighted Progress Calculation (Bien fait)
    const calculateWeightedProgress = (states, total) => {
        if (!total || total === 0) return 0
        let score = 0
        states.forEach(s => {
            if (s.consultant_verdict === 'validated' || s.consultant_verdict === 'non_applicable') {
                score += 100
            } else if (s.status === 'doing') {
                score += 50
            } else if (s.status === 'done' && !s.consultant_verdict) {
                score += 75
            }
        })
        return Math.min(100, Math.round(score / total))
    }

    const currentAuditStates = allIndicatorStates.filter(s => {
        const sType = s.audit_type || 'initial'
        const currentSelected = selectedAudit || 'initial'
        return isInitialAudit(currentSelected) ? isInitialAudit(sType) : sType === currentSelected
    })

    const totalPossibleIndicators = criteriaData.reduce((acc, crit) => acc + (crit.indicators?.length || 0), 0)

    // Global Progress across ALL audits in the case (Average completion of all declared audits)
    const activeAuditTypes = caseData?.audit_type || ['initial']
    const totalPossibleGlobal = totalPossibleIndicators * activeAuditTypes.length
    const globalProgress = calculateWeightedProgress(allIndicatorStates, totalPossibleGlobal)

    const calculatedProgress = calculateWeightedProgress(currentAuditStates, totalPossibleIndicators)

    // Use globalProgress for the overall dashboard value and DB sync
    const progressPercent = (allIndicatorStates.length > 0) ? globalProgress : (caseData?.progress || 0)

    // Auto-sync progress to DB if it differs from stored value
    useEffect(() => {
        if (!caseData || allIndicatorStates.length === 0 || criteriaData.length === 0) return

        const currentDBProgress = caseData.progress || 0
        const currentDBStatus = caseData.status
        const targetStatus = (currentDBStatus === 'validated') ? 'validated' : 'active'

        const needsSync = progressPercent !== currentDBProgress ||
            (progressPercent > 0 && currentDBStatus !== 'active' && currentDBStatus !== 'validated')

        if (needsSync) {
            console.log(`Syncing progress to DB: ${progressPercent}%, status: ${targetStatus}`)
            const syncProgress = async () => {
                const { error: syncError } = await supabase.from('cases').update({
                    progress: progressPercent,
                    status: targetStatus
                }).eq('id', id)

                if (syncError) {
                    console.error("Sync error:", syncError)
                } else {
                    setCaseData(prev => ({ ...prev, progress: progressPercent, status: targetStatus }))
                }
            }
            syncProgress()
        }
    }, [progressPercent, caseData?.progress, caseData?.status, id])

    useEffect(() => {
        if (!caseData || criteriaData.length === 0) return

        const filteredMap = {}
        let validatedCount = 0
        const totalCount = criteriaData.reduce((acc, crit) => acc + (crit.indicators?.length || 0), 0)

        const isMatch = (sType) => {
            const currentSelected = selectedAudit || 'initial'
            if (isInitialAudit(currentSelected)) return isInitialAudit(sType)
            return sType === currentSelected
        }

        allIndicatorStates.forEach(s => {
            if (isMatch(s.audit_type)) {
                const indId = String(s.indicator_id)
                const existing = filteredMap[indId]
                if (existing?.consultant_verdict && !s.consultant_verdict) return

                filteredMap[indId] = {
                    status: s.status,
                    consultant_verdict: s.consultant_verdict
                }
                if (s.consultant_verdict === 'validated') validatedCount++
            }
        })

        setIndicatorStates(filteredMap)
        if (totalCount > 0) {
            setStats({ total: totalCount, validated: validatedCount })
        }
    }, [allIndicatorStates, criteriaData, caseData, selectedAudit])

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

            // Fix initialization: default to first available audit type
            let defaultAudit = 'initial'
            if (cData.audit_type && cData.audit_type.length > 0) {
                defaultAudit = cData.audit_type[0]
                setSelectedAudit(defaultAudit)
            }

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
            console.log('Fetched indicator states:', sData?.length || 0)
            setAllIndicatorStates(sData || [])

            // Fetch quiz uploads & comments for this case
            const { data: quizData } = await supabase
                .from('criterion_quiz_uploads')
                .select('criterion_id, file_name, file_url, uploaded_at, audit_type, consultant_comment')
                .eq('case_id', id)

            const quizMap = {}
            const commentsMap = {}
            quizData?.forEach(q => {
                const aType = q.audit_type || 'initial'
                if (!quizMap[q.criterion_id]) quizMap[q.criterion_id] = {}
                quizMap[q.criterion_id][aType] = q

                if (q.consultant_comment) {
                    if (!commentsMap[q.criterion_id]) commentsMap[q.criterion_id] = {}
                    commentsMap[q.criterion_id][aType] = q.consultant_comment
                }
            })
            setQuizUploads(quizMap)

            // Fetch events
            const { data: eventData } = await supabase
                .from('case_events')
                .select('*')
                .eq('case_id', id)
                .order('event_date', { ascending: true })

            setEvents(eventData || [])

            // ATOMIC INITIALIZATION of indicatorStates to avoid flickers on refresh
            const initialIndicatorMap = {}
            let initialValidatedCount = 0
            const finalTotalCount = Object.values(grouped).reduce((acc, crit) => acc + crit.indicators.length, 0)

            const isMatchInitial = (sType) => {
                const currentDefault = defaultAudit || 'initial'
                if (isInitialAudit(currentDefault)) return isInitialAudit(sType)
                return sType === currentDefault
            }

            const statesArray = sData || []
            console.log('Initializing indicatorStates with', statesArray.length, 'total states. Target audit:', defaultAudit)
            statesArray.forEach(s => {
                if (isMatchInitial(s.audit_type)) {
                    const indId = String(s.indicator_id)
                    const existing = initialIndicatorMap[indId]
                    if (existing?.consultant_verdict && !s.consultant_verdict) return

                    initialIndicatorMap[indId] = {
                        status: s.status,
                        consultant_verdict: s.consultant_verdict
                    }
                    if (s.consultant_verdict === 'validated') initialValidatedCount++
                }
            })

            console.log('Resulting individual states mapped:', Object.keys(initialIndicatorMap).length)
            setIndicatorStates(initialIndicatorMap)
            setStats({ total: finalTotalCount, validated: initialValidatedCount })

            // Populate criterionComments from loaded quiz data for the selected/default audit
            const restoredComments = {}
            Object.keys(commentsMap).forEach(critId => {
                const auditsForCrit = Object.keys(commentsMap[critId])
                const matchingAudit = auditsForCrit.find(a =>
                    isInitialAudit(defaultAudit) ? isInitialAudit(a) : a === defaultAudit
                )
                if (matchingAudit) {
                    restoredComments[critId] = commentsMap[critId][matchingAudit]
                }
            })
            setCriterionComments(restoredComments)

        } catch (error) {
            console.error('Error fetching details:', error)
            setError(error.message || "Erreur lors du chargement du dossier")
        } finally {
            setLoading(false)
        }
    }

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }

    useEffect(() => {
        if (activeTab === 'messagerie') {
            fetchMessages()
            scrollToBottom()

            // Realtime subscription
            const channel = supabase
                .channel(`case_messages:${id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'case_messages',
                    filter: `case_id=eq.${id}`
                }, (payload) => {
                    setMessages(prev => [...prev, payload.new])
                    setTimeout(scrollToBottom, 100)
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [activeTab, id])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const fetchMessages = async () => {
        try {
            setLoadingMessages(true)
            const { data, error } = await supabase
                .from('case_messages')
                .select('*')
                .eq('case_id', id)
                .order('created_at', { ascending: true })

            if (error) throw error
            setMessages(data || [])
        } catch (err) {
            console.error('Error loading messages:', err)
        } finally {
            setLoadingMessages(false)
        }
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        try {
            const { data, error } = await supabase
                .from('case_messages')
                .insert({
                    case_id: id,
                    sender_id: user.id, // uses 'user' from useAuth
                    content: newMessage.trim()
                })
                .select()
                .single()

            if (error) throw error

            // Optimistically update (Realtime handles duplicates or we can check ID)
            setMessages(prev => {
                // Avoid duplicates if realtime catches it fast
                if (prev.some(m => m.id === data.id)) return prev
                return [...prev, data]
            })
            setNewMessage('')
            setTimeout(scrollToBottom, 100)
        } catch (err) {
            console.error('Error sending message:', err)
            alert("Erreur lors de l'envoi du message : " + err.message)
        }
    }

    const handleCriterionClick = (criterion) => {
        setActiveCriterion(criterion)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleIndicatorUpdate = async (indicatorId, newStatus) => {
        // This function handled CLIENT updates, but we'll keep it as is if needed by client.
        // However, the USER request implies progress should be based on CONSULTANT verdicts now.
        // Let's focus on handleVerdict for the consultant's automation.

        let updatedStates = [...allIndicatorStates]
        const type = selectedAudit || 'initial'
        const index = updatedStates.findIndex(s => s.indicator_id === indicatorId && (s.audit_type || 'initial') === type)

        if (index >= 0) {
            updatedStates[index] = { ...updatedStates[index], status: newStatus }
        } else {
            updatedStates.push({ indicator_id: indicatorId, audit_type: type, status: newStatus, case_id: id })
        }

        setAllIndicatorStates(updatedStates)
        // We'll let handleVerdict handle the main case updates for the consultant view.
    }

    // Save consultant verdict for an indicator
    const handleVerdict = async (indicatorId, verdict) => {
        const type = selectedAudit || 'initial'

        // Optimistic update - consistently use string keys
        setIndicatorStates(prev => ({
            ...prev,
            [String(indicatorId)]: { ...(prev[String(indicatorId)] || {}), consultant_verdict: verdict }
        }))

        try {
            // 1. Update/Insert current state
            const currentIndState = indicatorStates[String(indicatorId)] || {}
            const { data: updatedState, error: upsertError } = await supabase.from('case_indicator_states').upsert({
                case_id: id,
                indicator_id: indicatorId,
                audit_type: type,
                status: currentIndState.status || 'to_do',
                consultant_verdict: verdict
            }, { onConflict: 'case_id,indicator_id,audit_type' }).select().single()

            if (upsertError) throw upsertError

            // 2. Refresh all states to calculate accurate progress
            const { data: allStates } = await supabase.from('case_indicator_states').select('*').eq('case_id', id)
            if (allStates) setAllIndicatorStates(allStates)

            // 3. Global Progress Calculation (Across all audit types)
            const totalIndicators = criteriaData.reduce((acc, crit) => acc + (crit.indicators?.length || 0), 0)
            const activeAuditTypes = caseData?.audit_type || ['initial']
            const totalPossibleGlobal = totalIndicators * activeAuditTypes.length

            const newProgress = calculateWeightedProgress(allStates || [], totalPossibleGlobal)

            // 4. Determine final status (validated only if ALL indicators of ALL audits are reviewed)
            // This is a strict check: every indicator in every audit must have a verdict.
            const allReviewed = activeAuditTypes.every(aType => {
                const typeStates = (allStates || []).filter(s => (s.audit_type || 'initial') === aType)
                return criteriaData.every(crit =>
                    crit.indicators?.every(ind => {
                        const s = typeStates.find(st => st.indicator_id === ind.id)
                        return s?.consultant_verdict && (s.consultant_verdict !== 'to_do')
                    })
                )
            })
            const finalStatus = allReviewed ? 'validated' : 'active'

            // 5. Update case in DB
            const { error: updateError } = await supabase.from('cases').update({
                progress: newProgress,
                status: finalStatus
            }).eq('id', id)

            if (updateError) {
                console.error("Error updating case progress:", updateError)
                throw updateError
            }

            // Update local state - ensure progress is reflected
            setCaseData(prev => ({ ...prev, progress: newProgress, status: finalStatus }))
        } catch (err) {
            console.error('Error saving verdict or updating progress:', err)
        }
        setSelectedIndicatorId(null) // collapse after verdict
    }



    // Save consultant comment for a criterion
    const handleSaveCriterionComment = async (criterionId) => {
        setSavingComment(criterionId)
        try {
            const currentQuiz = quizUploads[criterionId]?.[selectedAudit || 'initial']
            const existingComment = currentQuiz?.consultant_comment || ''
            const commentToSave = criterionComments[criterionId] !== undefined ? criterionComments[criterionId] : existingComment

            await supabase.from('criterion_quiz_uploads').upsert({
                case_id: id,
                criterion_id: criterionId,
                audit_type: selectedAudit || 'initial',
                file_url: currentQuiz?.file_url || '',
                file_name: currentQuiz?.file_name || '',
                consultant_comment: commentToSave
            }, { onConflict: 'case_id,criterion_id,audit_type' })

            // Update local state to reflect saved comment
            setQuizUploads(prev => ({
                ...prev,
                [criterionId]: {
                    ...(prev[criterionId] || {}),
                    [selectedAudit || 'initial']: {
                        ...(prev[criterionId]?.[selectedAudit || 'initial'] || {}),
                        consultant_comment: criterionComments[criterionId]
                    }
                }
            }))
        } catch (err) {
            console.error('Error saving comment:', err)
        } finally {
            setSavingComment(null)
        }
    }

    const handleInitializeEvents = async () => {
        setSavingEvent(true)
        try {
            const startDate = new Date()
            const standardEvents = [
                {
                    case_id: id,
                    title: "Rendez-vous de lancement",
                    description: "Cadrage de la mission et analyse initiale.",
                    event_date: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // +2 days
                    event_type: 'meeting',
                    visio_link: 'https://meet.google.com/abc-defg-hij',
                    status: 'done'
                },
                {
                    case_id: id,
                    title: "Mentorat : Suivi Mi-Parcours",
                    description: "Revue des indicateurs bloquants (C2, C3).",
                    event_date: new Date(startDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(), // +15 days
                    event_type: 'meeting',
                    visio_link: '',
                    status: 'in_progress'
                },
                {
                    case_id: id,
                    title: "Audit Blanc",
                    description: "Simulation complète de l'audit de surveillance.",
                    event_date: new Date(startDate.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(), // +45 days (1.5 months)
                    event_type: 'audit',
                    visio_link: '',
                    status: 'pending'
                },
                {
                    case_id: id,
                    title: "Audit de Surveillance",
                    description: "Date prévisionnelle : Mars 2026",
                    event_date: new Date(startDate.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(), // +60 days (2 months)
                    event_type: 'audit',
                    visio_link: '',
                    status: 'pending'
                }
            ]

            const { data, error } = await supabase
                .from('case_events')
                .insert(standardEvents)
                .select()

            if (error) throw error
            setEvents(data.sort((a, b) => new Date(a.event_date) - new Date(b.event_date)))
        } catch (err) {
            console.error('Error initializing events:', err)
        } finally {
            setSavingEvent(false)
        }
    }

    // Planning Actions
    const handleSaveEvent = async (eventData) => {
        setSavingEvent(true)
        try {
            if (editingEvent) {
                // Update
                const { error } = await supabase
                    .from('case_events')
                    .update({
                        title: eventData.title,
                        description: eventData.description,
                        event_date: eventData.event_date, // Changed from date to event_date to match DB
                        event_type: eventData.type,
                        visio_link: eventData.visio_link
                    })
                    .eq('id', editingEvent.id)

                if (error) throw error
                setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...eventData, event_date: eventData.event_date, event_type: eventData.type } : e).sort((a, b) => new Date(a.event_date) - new Date(b.event_date)))
            } else {
                // Create
                const { data, error } = await supabase
                    .from('case_events')
                    .insert({
                        case_id: id,
                        title: eventData.title,
                        description: eventData.description,
                        event_date: eventData.event_date,
                        event_type: eventData.type,
                        visio_link: eventData.visio_link,
                        status: 'pending'
                    })
                    .select()
                    .single()

                if (error) throw error
                setEvents([...events, data].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)))
            }
            setShowEventModal(false)
            setEditingEvent(null)
        } catch (err) {
            console.error('Error saving event:', err)
        } finally {
            setSavingEvent(false)
        }
    }

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm("Supprimer cette étape ?")) return
        try {
            await supabase.from('case_events').delete().eq('id', eventId)
            setEvents(prev => prev.filter(e => e.id !== eventId))
        } catch (err) {
            console.error('Error deleting event:', err)
        }
    }

    const handleUpdateEventStatus = async (eventId, newStatus) => {
        // Optimistic update
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: newStatus } : e))
        try {
            await supabase.from('case_events').update({ status: newStatus }).eq('id', eventId)
        } catch (err) {
            console.error('Error updating status:', err)
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
            const consultantProgress = Math.round((critIndicators.filter(i => indicatorStates[i.id]?.consultant_verdict).length / critIndicators.length) * 100)

            // Criterion Title
            yPos += 10
            doc.setFillColor(240, 240, 240)
            doc.rect(14, yPos - 7, 182, 10, 'F')
            doc.setFontSize(12)
            doc.setTextColor(0, 0, 0)
            doc.setFont('helvetica', 'bold')
            doc.text(`${crit.label} (${consultantProgress}%)`, 20, yPos)
            yPos += 8

            // Quiz Section (Top)
            const quiz = quizUploads[crit.id]?.[selectedAudit || 'initial']
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
                if (state.consultant_verdict === 'validated') verdictText = 'CONFORME'
                if (state.consultant_verdict === 'non_applicable') verdictText = 'NON APPLICABLE'
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
            // Use local state comment if editing, else use saved comment from quiz object
            const comment = criterionComments[crit.id] || quizUploads[crit.id]?.[selectedAudit || 'initial']?.consultant_comment

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

    // Global Progress based on dynamic calculation using weighted scores
    // (removed redundant redeclaration)

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

                        {/* Progress + Status */}
                        <div className="w-full md:w-auto md:min-w-[300px] flex items-center gap-6">
                            <div className="flex-1">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Avancement Global</span>
                                    <span className="text-2xl font-bold text-gray-900">{progressPercent}%</span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                                {/* Case Status Badge */}
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Statut :</span>
                                    {caseData.status === 'validated' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                            <CheckCircle className="h-3.5 w-3.5" /> Validé
                                        </span>
                                    ) : (caseData.status === 'active' || (progressPercent > 0)) ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100 shadow-sm">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span> En cours
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 font-bold px-4">—</span>
                                    )}
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
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[600px] flex">

                            {/* Sidebar (Participants) */}
                            <div className="w-80 border-r border-gray-100 bg-gray-50 flex flex-col">
                                <div className="p-4 border-b border-gray-100 bg-white">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Rechercher..."
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <button className="w-full text-left p-4 hover:bg-white border-b border-gray-100 bg-white border-l-4 border-l-purple-600 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-gray-900 text-sm">{caseData?.tenants?.name || 'Client'}</span>
                                            <span className="text-[10px] text-gray-400">Maintenant</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">Discussion active sur le dossier.</p>
                                    </button>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 flex flex-col bg-white">

                                {/* Header */}
                                <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <h3 className="font-bold text-gray-900">Discussion - {caseData?.tenants?.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> En ligne
                                    </div>
                                </div>

                                {/* Messages List */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                                    {loadingMessages ? (
                                        <div className="flex justify-center p-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                                            <MessageCircle className="h-12 w-12 text-gray-200" />
                                            <p>Aucun message. Commencez la discussion !</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => {
                                            const isMe = msg.sender_id === user?.id
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm text-sm ${isMe
                                                        ? 'bg-purple-600 text-white rounded-br-none'
                                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                                        }`}>
                                                        <p>{msg.content}</p>
                                                        <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t border-gray-100 bg-white">
                                    <form onSubmit={handleSendMessage} className="flex gap-4">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Écrivez votre message..."
                                                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent active:scale-[0.99] transition-transform"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="bg-purple-600 text-white p-3 rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95 flex items-center justify-center font-bold"
                                        >
                                            <Send className="h-5 w-5" />
                                        </button>
                                    </form>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* ── SUIVI RNO ── */}
                    {activeTab === 'suivi_rno' && (
                        <div className="space-y-5">
                            {/* AUDIT TYPE TABS */}
                            {caseData.audit_type && caseData.audit_type.length > 0 && (
                                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                                    {caseData.audit_type.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedAudit(type)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${selectedAudit === type
                                                ? 'bg-gray-900 text-white shadow-md'
                                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900">
                                    Détail de l'Audit : <span className="text-indigo-600 capitalize">{selectedAudit}</span> <span className="text-indigo-400 text-sm font-medium ml-2">({calculatedProgress}%)</span>
                                </h2>
                            </div>

                            {criteriaData.length === 0 ? (
                                <div className="p-8 text-center bg-white rounded-2xl border border-gray-100">
                                    <p className="text-gray-400">Aucun référentiel chargé pour ce dossier.</p>
                                </div>
                            ) : (
                                criteriaData.map((crit) => {
                                    const critIndicators = crit.indicators || []
                                    const verdictCount = critIndicators.filter(i => indicatorStates[String(i.id)]?.consultant_verdict).length
                                    const nonConformeCount = critIndicators.filter(i => indicatorStates[String(i.id)]?.consultant_verdict === 'non_conforme').length
                                    const validatedCount = critIndicators.filter(i => indicatorStates[String(i.id)]?.consultant_verdict === 'validated').length

                                    // Weighted progress for this criterion
                                    let critWeightedScore = 0
                                    critIndicators.forEach(i => {
                                        const state = indicatorStates[String(i.id)] || {}
                                        if (state.consultant_verdict === 'validated') {
                                            critWeightedScore += 100
                                        } else if (state.status === 'doing') {
                                            critWeightedScore += 50
                                        } else if (state.status === 'done' && !state.consultant_verdict) {
                                            critWeightedScore += 75
                                        }
                                    })
                                    const percent = Math.round(critWeightedScore / (critIndicators.length || 1))

                                    const quiz = quizUploads[crit.id]?.[selectedAudit || 'initial']
                                    const savedComment = quiz?.consultant_comment || ''

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
                                                        <p className="text-xs text-gray-400 mt-0.5">{validatedCount}/{critIndicators.length} indicateurs validés</p>
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
                                                    const state = indicatorStates[String(ind.id)] || {}
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
                                                                            <CheckCircle className="h-3.5 w-3.5" /> Conforme
                                                                        </span>
                                                                    )}
                                                                    {verdict === 'non_conforme' && (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                                                            <XCircle className="h-3.5 w-3.5" /> Non Conforme
                                                                        </span>
                                                                    )}
                                                                    {verdict === 'non_applicable' && (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                                                                            <CircleOff className="h-3.5 w-3.5" /> Non Applicable
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

                                                                    {/* Statut Client (ReadOnly display) */}
                                                                    <div className="bg-white rounded-xl border border-slate-100 p-4">
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Statut déclaré par le client</p>
                                                                        <div className="flex gap-2">
                                                                            <div className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-bold transition-all ${state.status === 'done' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white text-slate-200 border-slate-50'}`}>
                                                                                <CheckCircle className="h-3.5 w-3.5" /> Fait
                                                                            </div>
                                                                            <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-bold transition-all bg-white text-slate-200 border-slate-50">
                                                                                <Clock className="h-3.5 w-3.5" /> En cours
                                                                            </div>
                                                                            <div className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-bold transition-all ${state.status === 'non_applicable' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white text-slate-200 border-slate-50'}`}>
                                                                                <CircleOff className="h-3.5 w-3.5" /> Non Applicable
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
                                                                                <CheckCircle className="h-4 w-4" /> Conforme
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
                                                                            <button
                                                                                onClick={() => handleVerdict(ind.id, 'non_applicable')}
                                                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${verdict === 'non_applicable'
                                                                                    ? 'bg-slate-500 border-slate-500 text-white shadow-lg shadow-slate-200'
                                                                                    : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                                                                                    }`}
                                                                            >
                                                                                <CircleOff className="h-4 w-4" /> Non Applicable
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
                                                            <span className="text-xs">Aucun quiz soumis pour ce critère ({selectedAudit})</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Consultant Comment */}
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Commentaire / Remarques</p>
                                                    <div className="relative">
                                                        <textarea
                                                            value={criterionComments[crit.id] !== undefined ? criterionComments[crit.id] : savedComment}
                                                            onChange={(e) => setCriterionComments({ ...criterionComments, [crit.id]: e.target.value })}
                                                            placeholder="Notez les erreurs, points à corriger ou observations pour ce critère..."
                                                            className="w-full min-h-[100px] p-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y"
                                                        />
                                                        <div className="absolute bottom-3 right-3">
                                                            <button
                                                                onClick={() => handleSaveCriterionComment(crit.id)}
                                                                disabled={savingComment === crit.id}
                                                                className={`px-4 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 ${savingComment === crit.id
                                                                    ? 'bg-indigo-400 cursor-wait'
                                                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'
                                                                    }`}
                                                            >
                                                                {savingComment === crit.id ? (
                                                                    <>Saving...</>
                                                                ) : 'Enregistrer'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}



                    {/* VUE PLANIFICATION (Timeline Mockup) */}
                    {
                        activeTab === 'planification' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fadeIn max-w-4xl mx-auto">
                                <div className="flex justify-between items-center mb-10">
                                    <h2 className="text-xl font-bold text-gray-900">Parcours d'Accompagnement</h2>
                                    <button
                                        onClick={() => { setEditingEvent(null); setShowEventModal(true) }}
                                        className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wide"
                                    >
                                        <Plus className="h-4 w-4" /> Ajouter une étape
                                    </button>
                                </div>

                                {events.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Aucune étape planifiée</h3>
                                        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                                            Le parcours est vide. Vous pouvez commencer par générer les étapes standards d'accompagnement.
                                        </p>
                                        <button
                                            onClick={handleInitializeEvents}
                                            disabled={savingEvent}
                                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                                        >
                                            {savingEvent ? 'Génération...' : 'Générer le Parcours Type'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative border-l-2 border-dashed border-gray-200 ml-6 space-y-10 py-2">
                                        {events.map((event) => {
                                            const isDone = event.status === 'done' || event.status === 'realise'
                                            const isToday = new Date(event.event_date).toDateString() === new Date().toDateString()

                                            let connectorColor = 'bg-gray-50 border-gray-200'
                                            let dotColor = 'bg-gray-300'
                                            if (isDone) {
                                                connectorColor = 'bg-green-100 border-green-500'
                                                dotColor = 'text-green-600' // Check icon
                                            } else if (event.status === 'in_progress' || isToday) {
                                                connectorColor = 'bg-blue-100 border-blue-500'
                                                dotColor = 'bg-blue-500'
                                            } else if (event.event_type === 'audit') {
                                                connectorColor = 'bg-purple-50 border-purple-200'
                                                dotColor = 'bg-purple-300'
                                            }

                                            return (
                                                <div key={event.id} className="relative pl-10">
                                                    {/* Connector Dot */}
                                                    <div className={`absolute -left-[9px] top-0 h-5 w-5 rounded-full border-2 flex items-center justify-center ${connectorColor} ${event.status === 'in_progress' ? 'animate-pulse' : ''}`}>
                                                        {isDone ? (
                                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                                        ) : (
                                                            <span className={`h-2 w-2 rounded-full ${dotColor}`}></span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                                            {event.title}
                                                            <button
                                                                onClick={() => { setEditingEvent(event); setShowEventModal(true) }}
                                                                className="text-gray-300 hover:text-blue-600 transition-colors"
                                                            >
                                                                <Edit2 className="h-3 w-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteEvent(event.id)}
                                                                className="text-gray-300 hover:text-red-600 transition-colors"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </h3>

                                                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                                            {/* Status Toggle - "Bien réalisé" Logic */}
                                                            {!isDone && (
                                                                <button
                                                                    onClick={() => handleUpdateEventStatus(event.id, 'done')}
                                                                    className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all shadow-sm"
                                                                >
                                                                    <div className="h-4 w-4 rounded border border-gray-300 group-hover:border-green-500 flex items-center justify-center transition-colors">
                                                                        <CheckCircle className="h-3 w-3 text-white group-hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                    <span className="text-xs font-bold uppercase tracking-wide">Marquer réalisé</span>
                                                                </button>
                                                            )}
                                                            {isDone && (
                                                                <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-lg uppercase border border-green-200 shadow-sm">
                                                                    <CheckCircle className="h-3 w-3" /> Réalisé
                                                                </span>
                                                            )}

                                                            {/* Visio Link - Special Logic for Audit Blanc ONLY */}
                                                            {isDone && event.title.toLowerCase().includes('audit blanc') && (
                                                                <a
                                                                    href={event.visio_link || '#'}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => {
                                                                        if (!event.visio_link) {
                                                                            e.preventDefault()
                                                                            setEditingEvent(event)
                                                                            setShowEventModal(true)
                                                                        }
                                                                    }}
                                                                    className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-1.5"
                                                                >
                                                                    <Video className="h-3.5 w-3.5" />
                                                                    {event.visio_link ? 'Lancer Visio' : 'Planifier Visio'}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {event.description && <p className="text-sm text-gray-500 mb-2">{event.description}</p>}
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded border border-blue-100">
                                                        <Calendar className="h-3 w-3" /> {new Date(event.event_date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* EVENT MODAL */}
                    <EventModal
                        isOpen={showEventModal}
                        onClose={() => { setShowEventModal(false); setEditingEvent(null) }}
                        onSave={handleSaveEvent}
                        eventToEdit={editingEvent}
                        isSaving={savingEvent}
                    />



                </div >
            </div >


            <NewCaseModal
                isOpen={showNewCaseModal}
                onClose={() => setShowNewCaseModal(false)}
                user={user}
                onSuccess={() => { setShowNewCaseModal(false); navigate('/consultant/cases') }}
            />
        </div >
    )
}
