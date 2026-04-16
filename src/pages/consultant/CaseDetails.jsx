import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import NewCaseModal from '../../components/consultant/NewCaseModal'
import EventModal from '../../components/consultant/EventModal'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'
import StatusModal from '../../components/shared/StatusModal'
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
    AlertTriangle,
    Settings,
    Shield,
    Eye
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

const isInitialAudit = (type) => {
    const t = String(type || '').toLowerCase().trim()
    return t === 'initial' || t.includes('initial') || t.includes('initiale')
}

const normalizeAudit = (type) => {
    const t = String(type || '').toLowerCase().trim()
    if (t.includes('initial')) return 'initial'
    if (t.includes('surveillance')) return 'surveillance'
    if (t.includes('renouvellement')) return 'renouvellement'
    return t
}

export default function CaseDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()

    const [loading, setLoading] = useState(true)
    const [caseData, setCaseData] = useState(null)
    const [criteriaData, setCriteriaData] = useState([])
    const [allIndicatorStates, setAllIndicatorStates] = useState([])
    const [error, setError] = useState(null)
    const [stats, setStats] = useState({ total: 32, validated: 0 })
    const [showNewCaseModal, setShowNewCaseModal] = useState(false)
    const [quizUploads, setQuizUploads] = useState({}) // { criterion_id: { audit_type: quiz } }
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    // NEW TABS STATE
    const [activeTab, setActiveTab] = useState('suivi_rno')
    const [selectedAudit, setSelectedAudit] = useState('initial') // 'initial' | 'surveillance 1' | ...
    const [activeCriterion, setActiveCriterion] = useState(null)
    const [selectedIndicatorId, setSelectedIndicatorId] = useState(null) // which indicator is expanded
    const [criterionComments, setCriterionComments] = useState({}) // { criterion_id: string }
    const [savingComment, setSavingComment] = useState(null) // criterion_id being saved
    const [saveConfirmation, setSaveConfirmation] = useState(null) // { id: criterion_id, type: 'success' | 'error' }



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

    // Status Modal State
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'OK',
        cancelText: 'Annuler',
        isLoading: false
    })

    const showStatus = (type, title, message, onConfirm = null, confirmText = 'OK', cancelText = 'Annuler') => {
        setStatusModal({
            isOpen: true,
            type,
            title,
            message,
            onConfirm,
            confirmText,
            cancelText,
            isLoading: false
        })
    }

    // Removed redundant isInitialAudit helper (using global version)


    // Grouped Results used for EVERYTHING (Progress + UI)
    // Now with MERGING logic to handle potential duplicate rows for the same audit type
    const getGroupedStates = useCallback((auditFilter) => {
        const grouped = {}
        allIndicatorStates.forEach(s => {
            const indId = String(s.indicator_id || s.indicator_id_fix)
            if (!grouped[indId]) grouped[indId] = []
            grouped[indId].push(s)
        })

        const results = {}
        Object.entries(grouped).forEach(([indId, states]) => {
            // Filter states that match the audit title or fuzzy matches 'initial'
            const target = auditFilter ? String(auditFilter).trim().toLowerCase() : null
            
            // 1. Tag all potential matches with their matching level
            const potentialMatches = states.map(s => {
                const sRawType = String(s.audit_type || 'initial').trim().toLowerCase()
                
                let level = 0
                if (target) {
                    const targetL = String(target).trim().toLowerCase()
                    // Normalize both for comparison
                    const normTarget = normalizeAudit(targetL)
                    const normType = normalizeAudit(sRawType)
                    
                    if (normType === normTarget) level = 3
                    else level = 1
                } else {
                    level = 3 
                }
                return { level, state: s }
            }).filter(m => m.level >= 2 || (!target && m.level === 3))

            if (potentialMatches.length === 0) return

            // 2. STRIKT logic: Within the best level, take ONLY the newest record.
            // NO merging pieces, it cause confusion with old stale data.
            potentialMatches.sort((a, b) => {
                if (b.level !== a.level) return b.level - a.level
                
                // If calculating global progress (no target), prefer more advanced states over newer ones
                if (!target) {
                    const scoreA = (a.state.consultant_verdict === 'validated' || a.state.consultant_verdict === 'non_applicable') ? 100 :
                                  (a.state.status === 'done') ? 50 : 
                                  (a.state.status === 'doing') ? 25 : 0
                    const scoreB = (b.state.consultant_verdict === 'validated' || b.state.consultant_verdict === 'non_applicable') ? 100 :
                                  (b.state.status === 'done') ? 50 : 
                                  (b.state.status === 'doing') ? 25 : 0
                    if (scoreB !== scoreA) return scoreB - scoreA
                }

                const aDate = new Date(a.state.updated_at || 0).getTime()
                const bDate = new Date(b.state.updated_at || 0).getTime()
                return bDate - aDate
            })

            // The absolute winner for this indicator + audit combo
            results[indId] = potentialMatches[0].state
        })
        return results
    }, [allIndicatorStates])

    const indicatorStatesMap = useMemo(() => getGroupedStates(selectedAudit), [getGroupedStates, selectedAudit])
    const globalResults = useMemo(() => getGroupedStates(null), [getGroupedStates])
    
    // For local usage in current view
    const currentAuditStates = Object.values(indicatorStatesMap)
    
    // Improved progress scoring (0-100 per indicator)
    const calculateScore = (stateList, total) => {
        if (!total || total === 0) return 0
        let score = 0
        stateList.forEach(s => {
            if (s.consultant_verdict === 'validated' || s.consultant_verdict === 'non_applicable') score += 100
            else if (s.status === 'done') score += 50 // In wait for validation
            else if (s.status === 'doing') score += 25
        })
        return Math.min(100, Math.ceil(score / total))
    }

    const totalPossibleIndicators = criteriaData.reduce((acc, crit) => acc + (crit.indicators?.length || 0), 0)
    const calculatedProgress = calculateScore(currentAuditStates, totalPossibleIndicators)

    // Global Progress across all audits combined
    const globalProgress = calculateScore(Object.values(globalResults), totalPossibleIndicators)

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

    // Handle tab initialization from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const tab = params.get('tab')
        if (tab === 'planification' || tab === 'messagerie' || tab === 'suivi_rno') {
            setActiveTab(tab)
        }
    }, [location.search])

    useEffect(() => {
        if (!caseData || criteriaData.length === 0) return
        
        let validatedCount = 0
        Object.values(indicatorStatesMap).forEach(s => {
            if (s.consultant_verdict === 'validated' || s.consultant_verdict === 'non_applicable') validatedCount++
        })
        setStats({ total: totalPossibleIndicators, validated: validatedCount })
    }, [indicatorStatesMap, criteriaData, caseData])

    useEffect(() => {
        if (id && user) {
            fetchCaseDetails()
        } else if (!id) {
            setError("ID manquant dans l'URL")
            setLoading(false)
        }

        // Realtime subscription for ALL relevant case data
        if (id) {
            const channel = supabase
                .channel(`case_realtime:${id}`)
                // Indicator States Subscription
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'case_indicator_states',
                    filter: `case_id=eq.${id}`
                }, (payload) => {
                    console.log('Realtime indicator sync:', payload.eventType)
                    if (payload.eventType === 'DELETE') {
                        setAllIndicatorStates(prev => prev.filter(s => s.id !== (payload.old.id || payload.old.id_indicateur_perdu))) // Fallback to id
                    } else {
                        // For INSERT and UPDATE: Replace or add into the local array by ID
                        setAllIndicatorStates(prev => {
                            const filtered = prev.filter(s => s.id !== payload.new.id)
                            return [...filtered, payload.new]
                        })
                    }
                })
                // Quiz Uploads Subscription
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'criterion_quiz_uploads',
                    filter: `case_id=eq.${id}`
                }, (payload) => {
                    if (payload.eventType === 'DELETE') {
                        setQuizUploads(prev => {
                            const next = { ...prev }
                            const critId = payload.old.criterion_id
                            if (next[critId]) {
                                const aType = payload.old.audit_type || 'initial'
                                delete next[critId][aType]
                            }
                            return next
                        })
                    } else {
                        const q = payload.new
                        const aType = (q.audit_type || 'initial').trim().toLowerCase()
                        const storageKey = String(q.criterion_id) // 'crit_X' or 'ind_X'
                        setQuizUploads(prev => ({
                            ...prev,
                            [storageKey]: {
                                ...(prev[storageKey] || {}),
                                [aType]: q
                            }
                        }))
                    }
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [id, user])

    const fetchCaseDetails = async () => {
        console.log('Fetching details for case:', id)
        try {
            setLoading(true)
            setError(null)

            const { data: cData, error: cError } = await supabase
                .from('cases')
                .select(`*, tenants (name, siret, logo_url, owner_id, client_email)`)
                .eq('id', id)
                .single()

            if (cError) {
                console.error("Supabase Error fetching case:", cError)
                throw cError
            }
            if (!cData) throw new Error("Aucune donnée trouvée pour ce dossier")

            // Fetch owner avatar as fallback for logo
            if (cData.tenants?.owner_id) {
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', cData.tenants.owner_id)
                    .single()
                if (prof?.avatar_url) {
                    cData.tenants.avatar_url = prof.avatar_url
                }
            }

            setCaseData(cData)

            // Fix initialization: default to first available audit type (trimmed)
            let defaultAudit = 'initial'
            if (cData.audit_type && cData.audit_type.length > 0) {
                defaultAudit = String(cData.audit_type[0]).trim()
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
                .order('updated_at', { ascending: true })

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
                const aType = (q.audit_type || 'initial').trim().toLowerCase()
                const storageKey = String(q.criterion_id) // 'crit_X' or 'ind_X'
                if (!quizMap[storageKey]) quizMap[storageKey] = {}
                quizMap[storageKey][aType] = q

                if (q.consultant_comment) {
                    if (!commentsMap[storageKey]) commentsMap[storageKey] = {}
                    commentsMap[storageKey][aType] = q.consultant_comment
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

            // Delegate all indicator state processing to the centralized useEffect
            setAllIndicatorStates(sData || [])

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
                    setMessages(prev => {
                        if (prev.some(m => m.id === payload.new.id)) return prev
                        return [...prev, payload.new]
                    })
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
            // Filter out system messages for the chat tab
            const userMessages = (data || []).filter(m => !m.content.startsWith('[SYSTEM]'))
            setMessages(userMessages)

            // Mark messages from client as read
            const unreadIds = data?.filter(m => m.sender_id !== user.id && !m.read_at).map(m => m.id)
            if (unreadIds && unreadIds.length > 0) {
                await supabase
                    .from('case_messages')
                    .update({ read_at: new Date().toISOString() })
                    .in('id', unreadIds)
            }
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
            showStatus('error', 'Erreur d\'envoi', err.message)
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
        const type = (selectedAudit || 'initial').trim().toLowerCase()

        try {
            // 1. Update/Insert current state - PRESERVE client status if it exists
            const currentIndState = indicatorStatesMap[String(indicatorId)] || {}
            
            // Critical: Don't default to 'to_do' if it would overwrite 'not_applicable' from client
            const clientStatus = currentIndState.status === 'non_applicable' ? 'not_applicable' : currentIndState.status
            const statusToSave = clientStatus || (verdict === 'non_applicable' ? 'not_applicable' : 'to_do')

            const { data: updatedState, error: upsertError } = await supabase.from('case_indicator_states').upsert({
                case_id: id,
                indicator_id: indicatorId,
                audit_type: type,
                status: statusToSave,
                consultant_verdict: verdict,
                updated_at: new Date().toISOString()
            }, { onConflict: 'case_id,indicator_id,audit_type' }).select().single()

            if (upsertError) throw upsertError

            // 2. Refresh all states to calculate accurate progress
            const { data: allStates } = await supabase.from('case_indicator_states').select('*').eq('case_id', id)
            if (allStates) setAllIndicatorStates(allStates)

            // 3. Global Progress Calculation (Across all audit types)
            const totalIndicators = criteriaData.reduce((acc, crit) => acc + (crit.indicators?.length || 0), 0)
            const activeAuditTypes = caseData?.audit_type || ['initial']
            const totalPossibleGlobal = totalIndicators * activeAuditTypes.length

            const newProgress = calculateScore(Object.values(getGroupedStates(null)), totalIndicators)

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



    const handleSendCommentToChat = async (criterionId) => {
        const commentToSend = criterionComments[criterionId] || ''
        if (!commentToSend.trim()) {
            showStatus('warning', 'Champ vide', 'Veuillez écrire une remarque avant d\'envoyer.')
            return
        }

        try {
            setSavingComment(criterionId)
            
            // 1. SAVE TO DATABASE (Same as handleSaveCriterionComment)
            const idStr = String(criterionId)
            const currentAuditKey = (selectedAudit || 'initial').trim().toLowerCase()
            const currentQuiz = quizUploads[idStr.startsWith('crit_') ? idStr : 'crit_' + idStr]?.[currentAuditKey]
            
            const { error: saveError } = await supabase.from('criterion_quiz_uploads').upsert({
                case_id: id,
                criterion_id: idStr.startsWith('crit_') ? idStr : 'crit_' + idStr,
                audit_type: currentAuditKey,
                file_url: currentQuiz?.file_url || '',
                file_name: currentQuiz?.file_name || '',
                consultant_comment: commentToSend.trim()
            }, { onConflict: 'case_id,criterion_id,audit_type' })

            if (saveError) throw saveError

            // 2. SEND TO CHAT
            const labelId = idStr.replace('crit_', '')
            const { error: msgError } = await supabase.from('case_messages').insert({
                case_id: id,
                sender_id: user.id,
                content: `[Remarque - Critère ${labelId}] : ${commentToSend.trim()}`
            })

            if (msgError) throw msgError
            
            // Success feedback
            setSaveConfirmation({ id: criterionId, type: 'sent' })
            setTimeout(() => setSaveConfirmation(null), 3000)
            
            // CLEAR THE FIELD after sending
            setCriterionComments(prev => ({ ...prev, [criterionId]: '' }))
            
            // UPDATE LOCAL QUIZ DATA to keep track of the last comment if needed
            setQuizUploads(prev => ({
                ...prev,
                [idStr]: {
                    ...prev[idStr],
                    [currentAuditKey]: {
                        ...(prev[idStr]?.[currentAuditKey] || {}),
                        consultant_comment: commentToSend.trim()
                    }
                }
            }))
            
            fetchMessages()
        } catch (err) {
            console.error('Error sending remark:', err)
            showStatus('error', 'Erreur', err.message)
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
        showStatus(
            'delete',
            'Supprimer cette étape ?',
            'Êtes-vous sûr de vouloir retirer cette étape du parcours ? Cette action est irréversible.',
            async () => {
                setStatusModal(prev => ({ ...prev, isLoading: true }))
                try {
                    const { error } = await supabase.from('case_events').delete().eq('id', eventId)
                    if (error) throw error
                    setEvents(prev => prev.filter(e => e.id !== eventId))
                    setStatusModal(prev => ({ ...prev, isOpen: false, isLoading: false }))
                    showStatus('success', 'Étape supprimée', 'L\'étape a été retirée du parcours avec succès.')
                } catch (err) {
                    console.error('Error deleting event:', err)
                    setStatusModal(prev => ({ ...prev, isLoading: false }))
                    showStatus('error', 'Erreur', 'Impossible de supprimer cette étape : ' + err.message)
                }
            },
            'Confirmer',
            'Annuler'
        )
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

    const handleGenerateReport = async () => {
        const doc = new jsPDF()
        const tenantName = caseData.tenants?.name || 'Client'
        const auditType = selectedAudit || 'initial'

        // -- MODERN HEADER DESIGN (Popping Style) --
        doc.setFillColor(67, 56, 202) // Indigo 700 
        doc.rect(0, 0, 210, 85, 'F')
        
        // Stylish Background Pattern 
        doc.setFillColor(79, 70, 229) // Indigo 600
        doc.rect(0, 0, 210, 5, 'F')

        // Add Logo with structured frame
        const logoUrl = caseData.tenants?.logo_url || caseData.tenants?.avatar_url
        if (logoUrl) {
            try {
                const img = new Image()
                img.crossOrigin = 'Anonymous'
                img.src = logoUrl
                await new Promise((resolve, reject) => {
                    img.onload = resolve
                    img.onerror = reject
                })
                // White rounded frame for logo
                doc.setFillColor(255, 255, 255)
                doc.roundedRect(15, 12, 35, 35, 8, 8, 'F')
                doc.addImage(img, 'PNG', 18, 15, 29, 29)
            } catch (err) {
                console.error("Logo load failed:", err)
            }
        }

        // Title Section
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(26)
        doc.setFont('helvetica', 'bold')
        doc.text("RAPPORT D'AUDIT", 125, 30, { align: 'center' })
        doc.setFontSize(18)
        doc.text("QUALIOPI", 125, 40, { align: 'center' })
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(199, 210, 254) // Indigo 200
        doc.text("Généré par Easy'Qual - Votre assistant conformité intelligent", 125, 48, { align: 'center' })

        // Horizontal Separator inside header
        doc.setDrawColor(99, 102, 241) // Indigo 500
        doc.setLineWidth(0.5)
        doc.line(70, 55, 180, 55)

        // Metadata Grid inside Header
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        
        // Left Column Meta
        doc.setFont('helvetica', 'bold')
        doc.text(`ORGANISME :`, 15, 68)
        doc.setFont('helvetica', 'normal')
        doc.text(tenantName.toUpperCase(), 45, 68)
        
        doc.setFont('helvetica', 'bold')
        doc.text(`SIRET :`, 15, 76)
        doc.setFont('helvetica', 'normal')
        doc.text(caseData.tenants?.siret || 'N/A', 45, 76)

        // Right Column Meta
        doc.setFont('helvetica', 'bold')
        doc.text(`TYPE D'AUDIT :`, 110, 68)
        doc.setFont('helvetica', 'normal')
        doc.text((auditType === 'initial' ? 'AUDIT INITIAL' : auditType.toUpperCase()), 145, 68)

        doc.setFont('helvetica', 'bold')
        doc.text(`DATE :`, 110, 76)
        doc.setFont('helvetica', 'normal')
        doc.text(new Date().toLocaleDateString('fr-FR'), 145, 76)

        let yPos = 100

        // -- PROGRESS SUMMARY --
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text("Synthèse de l'avancement", 20, yPos)
        yPos += 10

        // Progress Bar
        doc.setDrawColor(229, 231, 235)
        doc.setFillColor(243, 244, 246)
        doc.roundedRect(20, yPos, 170, 12, 2, 2, 'FD')
        
        const docProgress = progressPercent
        const progressWidth = (docProgress / 100) * 170
        doc.setFillColor(67, 56, 202) // Indigo 700
        doc.roundedRect(20, yPos, progressWidth, 12, 2, 2, 'F')
        
        doc.setFontSize(10)
        doc.setTextColor(docProgress > 15 ? 255 : 67, docProgress > 15 ? 255 : 56, docProgress > 15 ? 255 : 202)
        const textX = docProgress > 15 ? 20 + (progressWidth / 2) : 25 + progressWidth
        doc.text(`${docProgress}% terminé`, textX, yPos + 8.5, { align: docProgress > 15 ? 'center' : 'left' })

        doc.setTextColor(0, 0, 0)
        yPos += 20

        // Categories Info
        if (Array.isArray(caseData.training_categories) && caseData.training_categories.length > 0) {
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.text("Catégories d'actions :", 20, yPos)
            doc.setFont('helvetica', 'normal')
            doc.text(caseData.training_categories.join(', '), 65, yPos)
            yPos += 15
        }

        // -- CRITERIA LOOP --
        criteriaData.forEach((crit, index) => {
            // Check page break
            if (yPos > 240) {
                doc.addPage()
                yPos = 20
            }
            const critIndicators = crit.indicators || []
            const currentStates = critIndicators.map(ind => indicatorStatesMap[String(ind.id)] || {})
            const critProgress = calculateScore(currentStates, critIndicators.length)

            // Criterion Section Header
            doc.setFillColor(249, 250, 251)
            doc.rect(14, yPos, 182, 12, 'F')
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(67, 56, 202)
            doc.text(`CRITÈRE ${crit.id} : ${crit.label}`, 20, yPos + 8)
            doc.setFontSize(10)
            doc.setTextColor(107, 114, 128)
            doc.text(`${critProgress}% validé`, 175, yPos + 8, { align: 'right' })
            
            yPos += 18

            // Quiz Section for Criterion
            const critIdStr = 'crit_' + crit.id
            const quiz = quizUploads[critIdStr]?.[normalizeAudit(auditType)]
            if (quiz) {
                doc.setFontSize(9)
                doc.setTextColor(0, 0, 0)
                doc.setFont('helvetica', 'bold')
                doc.text("Fichier Quiz : ", 20, yPos)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(37, 99, 235)
                doc.text(quiz.file_name || 'Télécharger', 45, yPos)
                if (quiz.file_url) doc.link(45, yPos - 3, 100, 5, { url: quiz.file_url })
                yPos += 6
            }

            // Indicator Table
            const tableBody = critIndicators.map(ind => {
                const state = indicatorStatesMap[String(ind.id)] || {}
                
                // Client Choice
                let clientChoice = '-'
                if (state.status === 'done') clientChoice = 'Réalisé'
                else if (state.status === 'doing') clientChoice = 'En cours'
                else if (state.status === 'not_applicable') clientChoice = 'N/A'
                
                if (state.client_comment) clientChoice += `\n(Com: ${state.client_comment})`

                // Proof File
                const indIdStr = 'ind_' + ind.id
                const proof = quizUploads[indIdStr]?.[normalizeAudit(auditType)]
                const proofName = proof ? (proof.file_name || 'Preuve') : 'Aucune'

                // Consultant Verdict
                let verdictText = 'À valider'
                if (state.consultant_verdict === 'validated') verdictText = 'CONFORME'
                else if (state.consultant_verdict === 'non_conforme') verdictText = 'NON CONFORME'
                else if (state.consultant_verdict === 'non_applicable') verdictText = 'N/A'

                return [
                    `${ind.code}`,
                    `${ind.label}`,
                    clientChoice,
                    proofName,
                    verdictText
                ]
            })

            autoTable(doc, {
                startY: yPos,
                head: [['Id', 'Indicateur', 'Choix Client', 'Preuve', 'Décision']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [67, 56, 202], textColor: 255, fontWeight: 'bold' },
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                columnStyles: { 
                    0: { cellWidth: 8 }, 
                    1: { cellWidth: 60 },
                    2: { cellWidth: 40 },
                    3: { cellWidth: 40 },
                    4: { cellWidth: 25, halign: 'center' }
                },
                didDrawCell: (data) => {
                    // Add link to proof if present
                    if (data.column.index === 3 && data.cell.text[0] !== 'Aucune') {
                        const ind = critIndicators[data.row.index]
                        const indIdStr = 'ind_' + ind.id
                        const proof = quizUploads[indIdStr]?.[normalizeAudit(auditType)]
                        if (proof?.file_url) {
                            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: proof.file_url })
                        }
                    }
                },
                margin: { left: 14, right: 14 }
            })

            yPos = doc.lastAutoTable.finalY + 10

            // Criterion Global Comment
            const comment = quizUploads[critIdStr]?.[normalizeAudit(auditType)]?.consultant_comment || criterionComments[crit.id]
            if (comment) {
                if (yPos > 260) {
                    doc.addPage()
                    yPos = 20
                }
                doc.setFontSize(9)
                doc.setFont('helvetica', 'bold')
                doc.text("Commentaire du consultant :", 20, yPos)
                yPos += 5
                doc.setFont('helvetica', 'normal')
                const splitComment = doc.splitTextToSize(comment, 170)
                doc.text(splitComment, 20, yPos)
                yPos += (splitComment.length * 5) + 10
            } else {
                yPos += 5
            }
        })

        // -- EVENTS / PLANNING SECTION --
        if (events && events.length > 0) {
            doc.addPage()
            yPos = 25
            doc.setTextColor(67, 56, 202)
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.text("Calendrier & Étapes du Parcours", 20, yPos)
            yPos += 12

            const eventBody = events.map(e => [
                new Date(e.event_date).toLocaleDateString('fr-FR'),
                e.title,
                e.description || '-',
                e.status === 'done' ? 'RÉALISÉ' : (e.status === 'in_progress' ? 'EN COURS' : 'À VENIR')
            ])

            autoTable(doc, {
                startY: yPos,
                head: [['Date', 'Étape', 'Description', 'Statut']],
                body: eventBody,
                theme: 'striped',
                headStyles: { fillColor: [67, 56, 202], textColor: 255 },
                styles: { fontSize: 9 },
                columnStyles: { 
                    0: { cellWidth: 25 }, 
                    1: { cellWidth: 50 },
                    2: { cellWidth: 80 }
                },
                margin: { left: 14, right: 14 }
            })
        }

        // -- FOOTER ALL PAGES --
        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(156, 163, 175)
            
            // Separator Line
            doc.setDrawColor(229, 231, 235)
            doc.line(14, 285, 196, 285)
            
            // Left Text
            doc.text(`Rapport d'Accompagnement Qualiopi - Généré par Easy'Qual`, 14, 290)
            
            // Right Text (Page count)
            doc.text(`Page ${i} sur ${pageCount}`, 196, 290, { align: 'right' })
        }

        doc.save(`Rapport_Audit_${tenantName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
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
            <ConsultantSidebar isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                <ConsultantTopBar
                    onNewFolder={() => setShowNewCaseModal(true)}
                    showMobileMenu={showMobileMenu}
                    setShowMobileMenu={setShowMobileMenu}
                />

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
                            {(caseData.tenants?.logo_url || caseData.tenants?.avatar_url) ? (
                                <img 
                                    src={caseData.tenants.logo_url || caseData.tenants.avatar_url} 
                                    alt={caseData.tenants.name} 
                                    className="h-20 w-20 rounded-2xl object-cover shadow-lg border-2 border-white"
                                />
                            ) : (
                                <div className="h-20 w-20 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-emerald-200">
                                    {getInitials(caseData.tenants?.name)}
                                </div>
                            )}
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
                            <div className="flex items-center gap-3 print:hidden">
                                <button
                                    onClick={handleGenerateReport}
                                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    Rapport
                                </button>
                            </div>
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
                                                    <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-line ${isMe
                                                        ? 'bg-purple-600 text-white rounded-br-none'
                                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                                        }`}>
                                                        <p className="whitespace-pre-line">{msg.content}</p>
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
                                <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                                    {caseData.audit_type.map((type, i) => {
                                        const trimmedType = String(type).trim()
                                        const isActive = normalizeAudit(selectedAudit) === normalizeAudit(trimmedType)
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedAudit(trimmedType)}
                                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border-2 ${
                                                    isActive
                                                        ? 'bg-indigo-600 text-white border-indigo-600 scale-105 shadow-indigo-100'
                                                        : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-gray-200'}`} />
                                                    {trimmedType}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-8">
                                <div className="flex flex-col">
                                    <h2 className="flex items-center gap-3 text-lg font-bold text-gray-900 group">
                                        Détail de l'Audit : <span className="text-indigo-600 capitalize">{selectedAudit}</span> 
                                        <span className="text-indigo-400 text-sm font-medium ml-1">({calculatedProgress}%)</span>
                                    </h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="px-3 py-1 bg-slate-900 text-white rounded-lg flex items-center gap-2 shadow-lg">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Vérif ID:</span>
                                            <span className="text-[10px] font-mono font-bold tracking-widest">{id}</span>
                                        </div>
                                        <span className="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-500 border border-amber-100 uppercase">Phase: {selectedAudit}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                </div>
                            </div>

                            {/* Alerte si vide */}
                            {/* Alerte si Compte Non Lié uniquement */}
                            {!loading && allIndicatorStates.length === 0 && !caseData?.tenants?.owner_id && (
                                <div className="mb-6 p-6 border-2 border-dashed rounded-3xl text-center bg-amber-50 border-amber-200">
                                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                                    <h3 className="text-sm font-black text-amber-900 uppercase">Compte client non activé</h3>
                                    <p className="text-xs text-amber-600 mt-1">
                                        Le compte de connexion pour <strong>{caseData?.tenants?.client_email}</strong> n'a pas été créé correctement lors de l'invitation.
                                        <br />Veuillez utiliser l'option "Modifier" pour ré-enregistrer l'email ou contacter le support.
                                    </p>
                                </div>
                            )}

                            {criteriaData.length === 0 ? (
                                <div className="p-8 text-center bg-white rounded-2xl border border-gray-100">
                                    <p className="text-gray-400">Aucun référentiel chargé pour ce dossier.</p>
                                </div>
                            ) : (
                                criteriaData.map((crit) => {
                                    const critIndicators = crit.indicators || []
                                    const verdictCount = critIndicators.filter(i => indicatorStatesMap[String(i.id)]?.consultant_verdict).length
                                    const nonConformeCount = critIndicators.filter(i => indicatorStatesMap[String(i.id)]?.consultant_verdict === 'non_conforme').length
                                    const validatedCount = critIndicators.filter(i => indicatorStatesMap[String(i.id)]?.consultant_verdict === 'validated').length

                                    // Weighted progress for this criterion
                                    let critWeightedScore = 0
                                    critIndicators.forEach(i => {
                                        const state = indicatorStatesMap[String(i.id)] || {}
                                        if (state.consultant_verdict === 'validated') {
                                            critWeightedScore += 100
                                        } else if (state.status === 'doing') {
                                            critWeightedScore += 50
                                        } else if (state.status === 'done' && !state.consultant_verdict) {
                                            critWeightedScore += 75
                                        }
                                    })
                                    const percent = Math.round(critWeightedScore / (critIndicators.length || 1))

                                    const currentAuditKey = normalizeAudit(selectedAudit || 'initial')
                                    const quizEntries = quizUploads['crit_' + crit.id] || {}
                                    const quiz = quizEntries[currentAuditKey] || Object.values(quizEntries).find(q => normalizeAudit(q.audit_type) === currentAuditKey)
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
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold animate-pulse">
                                                            <FileText className="h-3 w-3" /> Fichier Reçu
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ── Indicator List ── */}
                                            <div className="divide-y divide-gray-50">
                                                {critIndicators.map((ind, idx) => {
                                                    const state = indicatorStatesMap[String(ind.id)] || {}
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
                                                            {isOpen && (
                                                                <div className="px-6 pb-5 pt-3 bg-indigo-50 border-t border-indigo-100 space-y-4">
                                                                    
                                                                    {/* Document Proof from Client */}
                                                                    {(() => {
                                                                        const aKey = normalizeAudit(selectedAudit || 'initial')
                                                                        const uploadsForInd = quizUploads['ind_' + ind.id] || {}
                                                                        const indFile = uploadsForInd[aKey] || Object.values(uploadsForInd).find(u => normalizeAudit(u.audit_type) === aKey)
                                                                        if (!indFile) return null
                                                                        return (
                                                                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-3">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                                                            <FileText className="h-4 w-4" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Preuve documentaire</p>
                                                                                            <p className="text-xs font-bold text-emerald-900 truncate max-w-[200px]">{indFile.file_name}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <a 
                                                                                        href={indFile.file_url} 
                                                                                        target="_blank" 
                                                                                        rel="noreferrer"
                                                                                        className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 rounded-lg text-[10px] font-black hover:bg-emerald-50 transition-all flex items-center gap-1.5 shadow-sm"
                                                                                    >
                                                                                        <Eye className="h-3 w-3" /> VOIR LE FICHIER
                                                                                    </a>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })()}

                                                                    {/* Statut Client (ReadOnly display) */}
                                                                    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Statut déclaré par le client</p>
                                                                        <div className="flex gap-2 mb-3">
                                                                            <div className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold transition-all ${(state.status === 'to_do' || state.status === 'doing' || state.status === 'à déclarer') ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-gray-50 text-gray-300 border-gray-100'}`}>
                                                                                <Clock className="h-3.5 w-3.5" /> En cours
                                                                            </div>
                                                                            <div className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold transition-all ${(state.status === 'done' || state.status === 'fait') ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-gray-50 text-gray-300 border-gray-100'}`}>
                                                                                <CheckCircle className="h-3.5 w-3.5" /> Fait
                                                                            </div>
                                                                            <div className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold transition-all ${(state.status === 'not_applicable' || state.status === 'non_applicable' || state.status === 'na') ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm' : 'bg-gray-50 text-gray-300 border-gray-100'}`}>
                                                                                <CircleOff className="h-3.5 w-3.5" /> Non Applicable
                                                                            </div>
                                                                        </div>
                                                                        {(state.status === 'not_applicable' || state.status === 'non_applicable' || state.status === 'na') && state.client_comment && (
                                                                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Justification du client</p>
                                                                                <p className="text-sm text-orange-700 italic">« {state.client_comment} »</p>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Simplified view: Removed suggestions and auto-validation buttons */}

                                                                    {/* Consultant verdict */}
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Votre décision finale</p>
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
                                                                                    ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200'
                                                                                    : 'border-orange-200 text-orange-600 bg-white hover:bg-orange-50'
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
                                                                <p className="text-xs text-indigo-400">Soumis le {new Date(quiz.uploaded_at || Date.now()).toLocaleDateString('fr-FR')}</p>
                                                            </div>
                                                            <MessageSquare className="h-4 w-4 text-indigo-400 group-hover:text-indigo-600 ml-auto" />
                                                        </a>
                                                    ) : (
                                                        <div className="flex items-center gap-2 px-4 py-3 bg-white border border-dashed border-gray-200 rounded-xl text-gray-400">
                                                            <FileText className="h-4 w-4" />
                                                            <span className="text-xs">Aucun quiz soumis pour ce critère ({normalizeAudit(selectedAudit||'initial')})</span>
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
                                                                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                                                    {saveConfirmation?.id === crit.id && (
                                                                        <span className="text-[10px] font-bold text-emerald-500 animate-fade-in flex items-center gap-1">
                                                                            <CheckCircle className="h-3 w-3" /> Envoyé
                                                                        </span>
                                                                    )}
                                                                    
                                                                    <button
                                                                        onClick={() => handleSendCommentToChat(crit.id)}
                                                                        disabled={savingComment === crit.id || !criterionComments[crit.id]?.trim()}
                                                                        className={`px-6 py-2 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center gap-2 ${savingComment === crit.id
                                                                            ? 'bg-indigo-400 cursor-wait'
                                                                            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md hover:scale-105 active:scale-95'
                                                                            }`}
                                                                    >
                                                                        <Send className="h-3 w-3" />
                                                                        {savingComment === crit.id ? 'Envoi...' : 'Envoyer'}
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

            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={statusModal.onConfirm}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
                confirmText={statusModal.confirmText}
                cancelText={statusModal.cancelText}
                isLoading={statusModal.isLoading}
            />
        </div>
    )
}
