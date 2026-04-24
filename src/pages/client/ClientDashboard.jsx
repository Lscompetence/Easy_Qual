import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import {
    CheckCircle, Clock, XCircle, CircleOff, AlertTriangle,
    Upload, Download, FileText, ChevronDown, ChevronUp, Send, MessageSquare,
    ArrowRight, CheckSquare, Check, Trash2, Video, Sun, Flag, Ban, PlayCircle, GraduationCap
} from 'lucide-react'
import ClientSidebar from '../../components/client/ClientSidebar'
import ClientTopBar from '../../components/client/ClientTopBar'
import UniversalPlayer from '../../components/shared/UniversalPlayer'
import StatusModal from '../../components/shared/StatusModal'
import QuizModal from '../../components/shared/QuizModal'

const isInitialAudit = (type) => {
    const t = String(type || '').toLowerCase().trim()
    return t === 'initial' || t.includes('initial') || t.includes('initiale')
}

export default function ClientDashboard() {
    const { user, profile } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [tenant, setTenant] = useState(null)
    const [myCase, setMyCase] = useState(null)
    const [casesData, setCasesData] = useState([])
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
    const [selectedVideoIndicator, setSelectedVideoIndicator] = useState(null)
    const messagesEndRef = useRef(null)

    // Manual Save States
    const [dirtyIndicators, setDirtyIndicators] = useState(new Set())
    const [pendingFiles, setPendingFiles] = useState({})
    const [savingIndicator, setSavingIndicator] = useState(null)
    const [saveSuccess, setSaveSuccess] = useState({})
    const [globalMessage, setGlobalMessage] = useState(null)
    const [selectedAudit, setSelectedAudit] = useState('initial')
    const [allStatesData, setAllStatesData] = useState([])
    const [allQuizData, setAllQuizData] = useState([])
    const [caseEvents, setCaseEvents] = useState([])
    const [isQuizOpen, setIsQuizOpen] = useState(false)

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

    // Determine current page from URL
    const isMessages = location.pathname === '/client/messages'
    const isSessions = location.pathname === '/client/sessions'
    const isCriterion = location.pathname.startsWith('/client/criterion/')
    const criterionId = isCriterion ? location.pathname.split('/').pop() : null

    useEffect(() => {
        const init = async () => {
            if (user) {
                await fetchClientData()
            }
        }
        init()
    }, [user])

    useEffect(() => {
        if (myCase?.id) fetchMessages()
    }, [myCase?.id])

    useEffect(() => {
        // Use a small timeout to ensure DOM is rendered before scrolling
        const timer = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
        return () => clearTimeout(timer)
    }, [messages])

    useEffect(() => {
        if (!myCase?.id) return

        console.log("Setting up real-time for case:", myCase.id);
        const channel = supabase
            .channel(`client_realtime:${myCase.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'case_events',
                filter: `case_id=eq.${myCase.id}`
            }, (payload) => {
                console.log("Real-time event:", payload);
                if (payload.eventType === 'DELETE') {
                    setCaseEvents(prev => prev.filter(e => e.id !== payload.old.id))
                } else if (payload.eventType === 'INSERT') {
                    setCaseEvents(prev => [...prev, payload.new].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)))
                } else if (payload.eventType === 'UPDATE') {
                    setCaseEvents(prev => prev.map(e => e.id === payload.new.id ? payload.new : e).sort((a, b) => new Date(a.event_date) - new Date(b.event_date)))
                }
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'case_messages',
                filter: `case_id=eq.${myCase.id}`
            }, (payload) => {
                console.log("Real-time message received:", payload.new);
                if (payload.new.content.startsWith('[SYSTEM]')) return
                setMessages(prev => {
                    if (prev.some(m => m.id === payload.new.id)) return prev
                    const filtered = prev.filter(m => !String(m.id).startsWith('temp-') || m.content !== payload.new.content)
                    return [...filtered, payload.new]
                })
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'cases',
                filter: `tenant_id=eq.${myCase.tenant_id}`
            }, (payload) => {
                console.log("Real-time case update:", payload);
                if (payload.eventType === 'UPDATE') {
                    setCasesData(prev => prev.map(c => c.id === payload.new.id ? payload.new : c))
                    if (myCase?.id === payload.new.id) {
                        setMyCase(payload.new)
                    }
                }
            })
            .subscribe((status) => {
                console.log("Real-time subscription status:", status);
            })

        return () => {
            console.log("Cleaning up real-time for case:", myCase.id);
            supabase.removeChannel(channel)
        }
    }, [myCase?.id])

    const fetchMessages = async () => {
        if (!myCase) return
        const { data, error } = await supabase
            .from('case_messages')
            .select('id, case_id, sender_id, content, created_at, read_at')
            .eq('case_id', myCase.id)
            .order('created_at', { ascending: true })
        
        if (error) {
            console.error("fetchMessages error:", error);
            return;
        }

        // Filter out system messages for the chat
        const userMessages = (data || []).filter(m => !m.content.startsWith('[SYSTEM]'))
        console.log("Fetched messages:", userMessages.length);
        setMessages(userMessages)
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
            // Match by either owner_id (consultant) OR client_email (client)
            const { data: tenantsData } = await supabase
                .from('tenants')
                .select('id, name, logo_url, siret, nda, client_email, owner_id, created_by, created_at')
                .or(`owner_id.eq.${user.id},client_email.eq.${user.email}`)

            if (tenantsData && tenantsData.length > 0) {
                const tenantIds = tenantsData.map(t => t.id)
                const { data: casesData } = await supabase
                    .from('cases')
                    .select('id, tenant_id, audit_type, training_categories, consultant_id, created_at')
                    .in('tenant_id', tenantIds)

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
                    setCasesData(casesData || [])
                    
                    // Default selected audit to the last one in the list if not set
                    if (!selectedAudit) {
                        const types = Array.isArray(caseData.audit_type) ? caseData.audit_type : ['initial']
                        setSelectedAudit(types[0] || 'initial')
                    }
                    
                    console.log("CLIENT CASE ID:", caseData.id)

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
                    // 1. Fetch indicator states 
                    const { data: statesData } = await supabase
                        .from('case_indicator_states')
                        .select('id, case_id, indicator_id, status, consultant_comment, consultant_verdict, client_comment, audit_type, updated_at')
                        .eq('case_id', caseData.id)
                    setAllStatesData(statesData || [])

                    // 2. Fetch quiz uploads
                    const { data: quizData } = await supabase
                        .from('criterion_quiz_uploads')
                        .select('id, case_id, criterion_id, audit_type, file_name, file_url, uploaded_at')
                        .eq('case_id', caseData.id)
                    setAllQuizData(quizData || [])

                    // 3. Fetch case events (sessions/visios)
                    const { data: eventsData } = await supabase
                        .from('case_events')
                        .select('id, case_id, event_date, title, visio_link, event_type')
                        .eq('case_id', caseData.id)
                        .order('event_date', { ascending: true })
                    setCaseEvents(eventsData || [])

                    // Process initial mapping
                    const currentAudit = selectedAudit || (caseData.audit_type?.[caseData.audit_type.length - 1] || 'initial')
                    mapIndicatorStates(statesData || [], currentAudit)
                    mapQuizUploads(quizData || [])
                }
            }
        } catch (err) {
            console.error('Error loading client data:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const mapIndicatorStates = (data, auditType) => {
        const statesMap = {}
        const normalizedAudit = (auditType || 'initial').trim().toLowerCase()
        const sortedStates = [...data]?.sort((a,b) => (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())) || []
        
        sortedStates.forEach(s => {
            const sAudit = (s.audit_type || 'initial').trim().toLowerCase()
            const isMatch = (sAudit === normalizedAudit) || (isInitialAudit(sAudit) && isInitialAudit(normalizedAudit))

            if (isMatch) {
                const obj = {
                    status: s.status,
                    consultant_comment: s.consultant_comment,
                    consultant_verdict: s.consultant_verdict,
                    client_comment: s.client_comment,
                    audit_type: sAudit,
                    updated_at: s.updated_at
                }
                statesMap[s.indicator_id] = obj
                statesMap[String(s.indicator_id)] = obj
            }
        })
        setIndicatorStates(statesMap)
    }

    const mapQuizUploads = (data) => {
        const quizMap = {}
        data?.forEach(q => { 
            const aType = (q.audit_type || 'initial').trim().toLowerCase()
            let storageKey = String(q.criterion_id)
            if (!storageKey.startsWith('crit_') && !storageKey.startsWith('ind_') && !isNaN(storageKey)) {
                storageKey = 'crit_' + storageKey
            }
            if (!quizMap[storageKey]) quizMap[storageKey] = {}
            quizMap[storageKey][aType] = q
        })
        setQuizUploads(quizMap)
    }

    // Effect to re-map states when selectedAudit changes
    useEffect(() => {
        if (allStatesData.length > 0 && selectedAudit) {
            mapIndicatorStates(allStatesData, selectedAudit)
        }
    }, [selectedAudit, allStatesData.length])

    const handleStatusChange = (indicatorId, newStatus) => {
        if (!myCase) return

        // Local UI update
        setIndicatorStates(prev => ({
            ...prev,
            [indicatorId]: { ...(prev[indicatorId] || {}), status: newStatus }
        }))
        
        // Mark as dirty
        setDirtyIndicators(prev => new Set(prev).add(indicatorId))
    }

    const handleCommentChange = (indicatorId, comment) => {
        if (!myCase) return
        setIndicatorStates(prev => ({
            ...prev,
            [indicatorId]: { ...(prev[indicatorId] || {}), client_comment: comment }
        }))
        setDirtyIndicators(prev => new Set(prev).add(indicatorId))
    }

    const handleFileSelect = (file, indicatorId) => {
        if (!file) return
        setPendingFiles(prev => ({ ...prev, [indicatorId]: file }))
        setDirtyIndicators(prev => new Set(prev).add(indicatorId))
    }

    const handleSaveIndicator = async (indicatorId) => {
        if (!myCase || !user) return;
        setSavingIndicator(indicatorId);

        try {
            const normalizedAudit = (selectedAudit || 'initial').trim().toLowerCase();
            const state = indicatorStates[indicatorId] || {};
            
            // Check if status changed compared to DB to avoid duplicate notifications
            const dbState = allStatesData.find(s => s.indicator_id === indicatorId && (s.audit_type || 'initial') === normalizedAudit);
            const statusChanged = state.status && state.status !== dbState?.status;

            // 1. Upload file if pending
            const pendingFile = pendingFiles[indicatorId];
            let fileUploaded = false;

            if (pendingFile) {
                const ext = pendingFile.name.split('.').pop();
                const path = `${myCase.id}/ind_${indicatorId}_${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('quiz-uploads').upload(path, pendingFile, { upsert: true });
                
                if (uploadError) throw uploadError;
                
                const { data: urlData } = supabase.storage.from('quiz-uploads').getPublicUrl(path);
                
                // Save file metadata
                const { error: quizError } = await supabase.from('criterion_quiz_uploads').upsert({
                    case_id: myCase.id,
                    criterion_id: 'ind_' + indicatorId,
                    audit_type: normalizedAudit,
                    file_url: urlData.publicUrl,
                    file_name: pendingFile.name,
                    uploaded_at: new Date().toISOString()
                }, { onConflict: 'case_id,criterion_id,audit_type' });

                if (quizError) throw quizError;
                fileUploaded = true;
                
                // Update local quiz states
                setQuizUploads(prev => ({
                    ...prev,
                    ['ind_' + indicatorId]: {
                        ...(prev['ind_' + indicatorId] || {}),
                        [normalizedAudit]: { 
                            file_url: urlData.publicUrl, 
                            file_name: pendingFile.name, 
                            uploaded_at: new Date().toISOString() 
                        }
                    }
                }));
            }

            // 2. Save indicator state (status, comment)
            const { error: stateError } = await supabase.from('case_indicator_states').upsert({
                case_id: myCase.id,
                indicator_id: indicatorId,
                audit_type: normalizedAudit,
                status: state.status || 'to_do',
                consultant_verdict: state.consultant_verdict,
                consultant_comment: state.consultant_comment,
                client_comment: state.client_comment,
                updated_at: new Date().toISOString()
            }, { onConflict: 'case_id,indicator_id,audit_type' });

            if (stateError) throw stateError;

            // 📩 3. AUTOMATIC NOTIFICATION MESSAGE
            const indicatorLabel = indicators.find(i => i.id === indicatorId)?.label || `Indicateur ${indicatorId}`;
            const statusLabels = { 'done': 'Fait', 'not_applicable': 'Non applicable', 'doing': 'En cours', 'to_do': 'À traiter' };
            
            if (statusChanged || fileUploaded) {
                let msgContent = `📝 Indicateur mis à jour : ${indicatorLabel.substring(0, 50)}...\n`;
                if (statusChanged) msgContent += `🔹 Statut : ${statusLabels[state.status] || state.status}\n`;
                if (state.status === 'not_applicable' && state.client_comment) {
                    msgContent += `💬 Justification : ${state.client_comment}\n`;
                }
                if (fileUploaded) msgContent += `📁 Document joint : ${pendingFile.name}\n`;
                
                try {
                    await supabase.from('case_messages').insert({
                        case_id: myCase.id,
                        sender_id: user.id,
                        content: `[SYSTEM] ${msgContent}`
                    });
                } catch (e) { console.warn("Could not insert notification:", e); }
            }

            // IMMEDIATE LOCAL SYNC
            setIndicatorStates(prev => ({
                ...prev,
                [indicatorId]: {
                    ...state,
                    status: state.status || 'to_do',
                    audit_type: normalizedAudit,
                    updated_at: new Date().toISOString()
                }
            }));

            // Clear dirty state
            setDirtyIndicators(prev => {
                const next = new Set(prev);
                next.delete(indicatorId);
                next.delete(String(indicatorId));
                return next;
            });
            setPendingFiles(prev => {
                const { [indicatorId]: _, ...rest } = prev;
                const { [String(indicatorId)]: __, ...rest2 } = rest;
                return rest2;
            });

            setSaveSuccess(prev => ({ ...prev, [indicatorId]: true }));
            showStatus('success', 'Enregistré !', 'Les informations ont été sauvegardées et votre consultant a été notifié.');
            setTimeout(() => {
                setSaveSuccess(prev => ({ ...prev, [indicatorId]: false }));
            }, 5000);

        } catch (err) {
            console.error('CRITICAL SAVE ERROR:', err);
            showStatus('error', 'Erreur', 'Impossible de sauvegarder : ' + (err.message || 'Problème de connexion.'));
        } finally {
            setSavingIndicator(null);
        }
    };

    // Standard immediate uploader for Criterion-level or Quiz
    const handleFileUpload = async (file, targetKey) => {
        if (!file || !myCase) return;
        setUploadingFor(targetKey);
        try {
            const ext = file.name.split('.').pop();
            const path = `${myCase.id}/${targetKey}_${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('quiz-uploads').upload(path, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('quiz-uploads').getPublicUrl(path);
            
            const normAudit = (selectedAudit || 'initial').trim().toLowerCase();
            
            await supabase.from('criterion_quiz_uploads').upsert({
                case_id: myCase.id, 
                criterion_id: targetKey,
                audit_type: normAudit,
                file_url: urlData.publicUrl,
                file_name: file.name,
                uploaded_at: new Date().toISOString()
            }, { onConflict: 'case_id,criterion_id,audit_type' });

            const targetLabel = targetKey.startsWith('ind_') 
                ? indicators.find(i => `ind_${i.id}` === targetKey)?.label || `Indicateur ${targetKey.replace('ind_', '')}`
                : targetKey === 'validation' ? 'Validation finale / Quiz' : `Ressource ${targetKey}`;

            try {
                await supabase.from('case_messages').insert({
                    case_id: myCase.id,
                    sender_id: user.id,
                    content: `[SYSTEM] 📁 Nouveau document déposé\n🎯 Cible : ${targetLabel.substring(0, 60)}...\n📄 Fichier : ${file.name}`
                });
            } catch (e) { console.warn("Could not insert notification:", e); }

            setQuizUploads(prev => ({
                ...prev,
                [targetKey]: {
                    ...(prev[targetKey] || {}),
                    [normAudit]: { 
                        file_url: urlData.publicUrl, 
                        file_name: file.name, 
                        uploaded_at: new Date().toISOString() 
                    }
                }
            }));
            showStatus('success', 'Fichier envoyé !', 'Votre document a été correctement téléchargé et votre consultant a été prévenu.');
        } catch (err) {
            showStatus('error', 'Échec de l\'envoi', 'Une erreur est survenue : ' + err.message);
        } finally {
            setUploadingFor(null);
        }
    };

    const handleDeleteFile = async (targetKey) => {
        if (!myCase) return;

        showStatus(
            'delete',
            'Supprimer ce fichier ?',
            'Cette action est irréversible. Êtes-vous sûr de vouloir retirer ce document ?',
            async () => {
                setStatusModal(prev => ({ ...prev, isLoading: true }))
                try {
                    const normAudit = (selectedAudit || 'initial').trim().toLowerCase()
                    const caseId = myCase.id

                    // Identify the file path first to delete from storage if possible
                    const { data: record } = await supabase.from('criterion_quiz_uploads')
                        .select('file_url')
                        .eq('case_id', caseId)
                        .eq('criterion_id', targetKey)
                        .eq('audit_type', normAudit)
                        .single()

                    if (record?.file_url) {
                        const pathParts = record.file_url.split('/')
                        const fileName = pathParts[pathParts.length - 1]
                        const fullPath = `${caseId}/${fileName}`
                        await supabase.storage.from('quiz-uploads').remove([fullPath])
                    }

                    // Delete from DB
                    const { error: error1 } = await supabase.from('criterion_quiz_uploads')
                        .delete()
                        .eq('case_id', caseId)
                        .eq('criterion_id', targetKey)
                        .eq('audit_type', normAudit)

                    if (error1) throw error1

                    // Update UI
                    setQuizUploads(prev => {
                        const updated = { ...prev }
                        if (updated[targetKey]) {
                            delete updated[targetKey][normAudit]
                            if (Object.keys(updated[targetKey]).length === 0) delete updated[targetKey]
                        }
                        return updated
                    })

                    setStatusModal(prev => ({ ...prev, isOpen: false, isLoading: false }))
                    showStatus('success', 'Fichier supprimé', 'Le document a été retiré avec succès.')
                } catch (err) {
                    console.error('Delete error:', err)
                    setStatusModal(prev => ({ ...prev, isLoading: false }))
                    showStatus('error', 'Erreur', 'Impossible de supprimer le fichier : ' + err.message)
                }
            },
            'Confirmer',
            'Annuler'
        )
    }

    useEffect(() => {
        if (isMessages && myCase?.id) {
            console.log("Entering messages view, fetching messages for case:", myCase.id);
            fetchMessages();
        }
    }, [isMessages, myCase?.id]);

    const handleSendMessage = async (e) => {
        e.preventDefault()
        const content = newMessage.trim()
        if (!content || !myCase) {
            console.warn("Cannot send message: content empty or myCase missing", { content, myCase });
            return
        }
        
        console.log("Sending message to case:", myCase.id, "Content:", content);
        setSendingMsg(true)
        
        // 🚀 OPTIMISTIC UPDATE
        const tempId = 'temp-' + Date.now()
        const optimisticMsg = {
            id: tempId,
            case_id: myCase.id,
            sender_id: user.id,
            content: content,
            created_at: new Date().toISOString(),
            is_read: false
        }
        
        setMessages(prev => [...prev, optimisticMsg])
        setNewMessage('')

        try {
            const { data, error } = await supabase.from('case_messages').insert({
                case_id: myCase.id,
                sender_id: user.id,
                content: content
            }).select()
            
            if (error) {
                console.error("Supabase insert error:", error);
                setMessages(prev => prev.filter(m => m.id !== tempId))
                throw error
            }
            
            console.log("Message inserted successfully:", data);
            // We don't strictly need fetchMessages() here if real-time is working,
            // but it helps ensure consistency. We'll wait a bit to let DB settle.
            setTimeout(() => fetchMessages(), 500);
        } catch (err) {
            console.error('Erreur envoi détaillé :', err)
            setNewMessage(content)
            setGlobalMessage('ERREUR : Impossible d\'envoyer le message')
            setTimeout(() => setGlobalMessage(null), 3000)
        } finally {
            setSendingMsg(false)
        }
    }

    // Stats
    const totalIndicators = indicators.length
    const validatedCount = Object.values(indicatorStates).filter(s => s?.status === 'done' || s?.status === 'not_applicable' || s?.status === 'non_applicable').length
    const toTreatCount = Object.values(indicatorStates).filter(s => !s?.status || (s?.status !== 'done' && s?.status !== 'not_applicable' && s?.status !== 'non_applicable')).length
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

    useEffect(() => {
        if (isCriterion && currentCriterion?.items?.length > 0) {
            // Force reset selection to the first indicator of the NEW criterion whenever the criterionId changes
            // To be precise: only reset if the currently selected indicator doesn't belong to the current criterion's items
            const isSVIValid = currentCriterion.items.some(it => it.id === selectedVideoIndicator);
            if (!isSVIValid) {
                setSelectedVideoIndicator(currentCriterion.items[0].id);
            }
        }
    }, [isCriterion, currentCriterion, criterionId, selectedVideoIndicator]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <ClientSidebar
                    caseData={myCase}
                    indicators={[]}
                    indicatorStates={indicatorStates}
                    consultantName={consultantName}
                    isOpen={showMobileMenu}
                    onClose={() => setShowMobileMenu(false)}
                    upcomingCount={caseEvents.filter(e => new Date(e.event_date) > new Date()).length}
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
                    unreadCount={messages.filter(m => m.sender_id !== user.id && !m.read_at).length}
                    upcomingCount={caseEvents.filter(e => new Date(e.event_date) > new Date()).length}
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
                    
                    {globalMessage && (
                        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
                             <div className={`px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 ${globalMessage.includes('ERREUR') || globalMessage.includes('Erreur') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-sm font-black uppercase tracking-wider">{globalMessage}</span>
                             </div>
                        </div>
                    )}
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
                                        const isTemp = String(msg.id).startsWith('temp-')
                                        return (
                                            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                {!isMe && (
                                                    <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 border border-white shadow-sm flex-shrink-0">
                                                        {consultantName[0] || 'C'}
                                                    </div>
                                                )}
                                                <div className={`relative max-w-[78%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-line ${isMe
                                                    ? 'bg-[#cc6d3e] text-white rounded-br-md shadow-lg shadow-[#cc6d3e]/10'
                                                    : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md'
                                                    } ${isTemp ? 'opacity-70 animate-pulse' : ''}`}>
                                                    {msg.content}
                                                    {isMe && isTemp && (
                                                        <div className="absolute -bottom-4 right-0">
                                                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Envoi...</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {isMe && (
                                                    <div className="h-8 w-8 rounded-lg bg-[#faf1ec] flex items-center justify-center text-[10px] font-black text-[#cc6d3e] border border-white shadow-sm flex-shrink-0">
                                                        {tenant?.name?.[0] || user.email?.[0]?.toUpperCase() || 'M'}
                                                    </div>
                                                )}
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
                    upcomingCount={caseEvents.filter(e => new Date(e.event_date) > new Date()).length}
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

                    {globalMessage && (
                        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
                             <div className={`px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 ${globalMessage.includes('ERREUR') || globalMessage.includes('Erreur') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-sm font-black uppercase tracking-wider">{globalMessage}</span>
                             </div>
                        </div>
                    )}
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

                            <div className="px-10 pb-10 space-y-4">
                                {caseEvents.length === 0 ? (
                                    <div className="bg-gray-50 rounded-2xl p-8 border border-dashed border-gray-200 text-center">
                                        <p className="text-sm text-gray-400 italic">Aucun rendez-vous planifié pour le moment.</p>
                                    </div>
                                ) : (
                                    caseEvents.map((event) => (
                                        <div key={event.id} className="bg-[#faf1ec]/30 rounded-2xl p-6 border border-[#f5e2d6] flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:bg-white hover:shadow-lg transition-all duration-300 gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-[10px] font-black text-[#cc6d3e] uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded-full border border-[#f5e2d6]/40">
                                                        {new Date(event.event_date) > new Date() ? 'Prochain RDV' : 'Passé'}
                                                    </p>
                                                    {event.event_type && (
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{event.event_type}</span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-black text-gray-900">{event.title || 'Session de suivi'}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                                    <div className={`h-2 w-2 rounded-full ${new Date(event.event_date) > new Date() ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                                    <span>
                                                        {new Date(event.event_date).toLocaleString('fr-FR', {
                                                            weekday: 'long',
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {event.visio_link ? (
                                                <button
                                                    onClick={() => window.open(event.visio_link, '_blank')}
                                                    className="h-12 px-8 bg-[#cc6d3e] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#cc6d3e]/20 hover:bg-[#b55d32] hover:scale-105 active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                                                >
                                                    <Video className="h-4 w-4" />
                                                    Rejoindre
                                                </button>
                                            ) : (
                                                <span className="text-xs font-bold text-gray-400 italic">Lien non disponible</span>
                                            )}
                                        </div>
                                    ))
                                )}
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
                    upcomingCount={caseEvents.filter(e => new Date(e.event_date) > new Date()).length}
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

                    {globalMessage && (
                        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
                             <div className={`px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 ${globalMessage.includes('ERREUR') || globalMessage.includes('Erreur') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-sm font-black uppercase tracking-wider">{globalMessage}</span>
                             </div>
                        </div>
                    )}
                    <main className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full">
                        {/* Phase Selector in Detail View */}
                        {/* Audit Selection Tabs (Consistent with Dashboard) */}
                        <div className="flex flex-wrap gap-3 mb-10">
                            {casesData?.flatMap((c) => {
                                const types = Array.isArray(c.audit_type) ? c.audit_type : [c.audit_type || 'Initial'];
                                return types.map((type, typeIdx) => {
                                    const isActive = selectedAudit === type;
                                    const cleanType = type.replace(/audit/gi, '').trim();
                                    
                                    const getColors = (t) => {
                                        const typeStr = t.toLowerCase();
                                        if (typeStr.includes('initial')) return { 
                                            active: 'bg-[#cc6d3e] text-white border-[#cc6d3e] shadow-[#cc6d3e]/30', 
                                            inactive: 'hover:border-[#cc6d3e]/30 hover:bg-[#cc6d3e]/5 text-slate-400',
                                            dot: 'bg-[#cc6d3e]' 
                                        };
                                        if (typeStr.includes('surveillance')) return { 
                                            active: 'bg-blue-600 text-white border-blue-600 shadow-blue-600/30', 
                                            inactive: 'hover:border-blue-600/30 hover:bg-blue-600/5 text-slate-400',
                                            dot: 'bg-blue-600' 
                                        };
                                        if (typeStr.includes('renouvellement')) return { 
                                            active: 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/30', 
                                            inactive: 'hover:border-emerald-600/30 hover:bg-emerald-600/5 text-slate-400',
                                            dot: 'bg-emerald-600' 
                                        };
                                        return { active: 'bg-slate-800 text-white', inactive: 'text-slate-400', dot: 'bg-slate-400' };
                                    };
                                    
                                    const colors = getColors(type);

                                    return (
                                        <button
                                            key={`${c.id}-${typeIdx}`}
                                            onClick={() => {
                                                setMyCase(c);
                                                setSelectedAudit(type);
                                            }}
                                            className={`flex items-center gap-3 px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 border-2 ${
                                                isActive 
                                                    ? `${colors.active} shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] scale-105 z-10` 
                                                    : `bg-white border-slate-50 ${colors.inactive} shadow-sm translate-y-0`
                                            } hover:-translate-y-1 active:scale-95`}
                                        >
                                            <div className={`h-2.5 w-2.5 rounded-full shadow-inner ${isActive ? 'bg-white animate-pulse' : colors.dot} transition-colors duration-500`} />
                                            AUDIT {cleanType}
                                        </button>
                                    );
                                });
                            })}
                        </div>
                        {/* Criterion Header */}
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-1">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                    CRITÈRE {criterionIndex + 1}
                                </p>
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-gray-100 text-gray-400">ID: {myCase?.id?.substring(0,8)}</span>
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                {currentCriterion.label}
                                <span className="px-3 py-1 bg-[#cc6d3e]/10 text-[#cc6d3e] border border-[#cc6d3e]/20 rounded-full text-[10px] font-black uppercase tracking-widest translate-y-[1px]">
                                    {selectedAudit || 'Initial'}
                                </span>
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Découvrez comment communiquer de manière transparente et exhaustive sur votre offre de formation vers vos publics cibles.
                            </p>
                        </div>

                        {/* Content grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Universal Player (Marque Blanche) */}
                            <div className="lg:col-span-2">
                                <UniversalPlayer 
                                    indicatorId={selectedVideoIndicator || currentCriterion?.items?.[0]?.id} 
                                    consultantId={myCase?.consultant_id || tenant?.created_by} 
                                    auditType={selectedAudit}
                                />
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

                                {/* Quiz / Ressource */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Validation</h3>
                                    <p className="text-xs text-gray-500 mb-3">Remplissez le fichier ressource et téléversez-le ici</p>
                                    
                                    {(() => {
                                        const normalizeAudit = (t) => {
                                            const str = String(t || '').toLowerCase().trim()
                                            if (str.includes('initial')) return 'initial'
                                            if (str.includes('surveillance')) return 'surveillance'
                                            if (str.includes('renouvellement')) return 'renouvellement'
                                            return str
                                        }
                                        const aKey = normalizeAudit(selectedAudit || 'initial')
                                        const quiz = (quizUploads['crit_' + currentCriterion.id] || {})[aKey] || 
                                                     Object.values(quizUploads['crit_' + currentCriterion.id] || {}).find(q => normalizeAudit(q.audit_type) === aKey)
                                        
                                        if (quiz) {
                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                        <span className="text-xs font-bold text-emerald-700 truncate">
                                                            {quiz.file_name}
                                                        </span>
                                                        <Download 
                                                            className="h-3.5 w-3.5 text-emerald-500 ml-auto cursor-pointer" 
                                                            onClick={() => window.open(quiz.file_url, '_blank')} 
                                                        />
                                                    </div>
                                                    <div className="flex justify-between items-center px-1">
                                                        <button
                                                            onClick={() => { setPendingCriterionId('crit_' + currentCriterion.id); fileInputRef.current?.click() }}
                                                            className="text-[10px] font-bold text-[#cc6d3e] hover:underline"
                                                        >
                                                            Remplacer
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteFile('crit_' + currentCriterion.id)}
                                                            className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        return (
                                            <button
                                                onClick={() => setIsQuizOpen(true)}
                                                disabled={uploadingFor === 'crit_' + currentCriterion.id}
                                                className="w-full py-2 bg-[#cc6d3e] text-white rounded-xl text-xs font-bold hover:bg-[#b35d32] transition-all shadow-md shadow-[#cc6d3e]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <PlayCircle className="h-3.5 w-3.5" />
                                                Lancer le Quiz
                                            </button>
                                        )
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Quiz Modal */}
                        <QuizModal 
                            isOpen={isQuizOpen}
                            onClose={() => setIsQuizOpen(false)}
                            criterionId={currentCriterion.id}
                            criterionLabel={currentCriterion.label}
                            onComplete={async (score, details) => {
                                try {
                                    const normAudit = (selectedAudit || 'initial').trim().toLowerCase();
                                    const targetKey = 'crit_' + currentCriterion.id;
                                    
                                    // 1. Generate detailed report content
                                    let report = `RAPPORT DE TEST QUALIOPI - EASYQUAL\n`;
                                    report += `------------------------------------\n`;
                                    report += `Date : ${new Date().toLocaleString('fr-FR')}\n`;
                                    report += `Client : ${user.email}\n`;
                                    report += `Critère : ${currentCriterion.id} - ${currentCriterion.label}\n`;
                                    report += `Score Final : ${score}%\n`;
                                    report += `Statut : ${score >= 70 ? 'RÉUSSI' : 'ÉCHEC'}\n\n`;
                                    report += `DÉTAILS DES RÉPONSES :\n`;
                                    report += `------------------------------------\n`;
                                    
                                    details.questions.forEach((q, idx) => {
                                        const userAnswerIdx = details.answers[idx];
                                        const isCorrect = userAnswerIdx === q.correct;
                                        report += `${idx + 1}. ${q.q}\n`;
                                        report += `   Réponse donnée : ${q.options[userAnswerIdx] || 'Aucune'}\n`;
                                        report += `   Résultat : ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}\n`;
                                        if (!isCorrect) {
                                            report += `   Réponse attendue : ${q.options[q.correct]}\n`;
                                        }
                                        report += `\n`;
                                    });

                                    // 2. Create a File (Blob)
                                    const fileName = `Rapport_Quiz_C${currentCriterion.id}_${Date.now()}.txt`;
                                    const blob = new Blob([report], { type: 'text/plain' });
                                    const file = new File([blob], fileName, { type: 'text/plain' });

                                    // 3. Upload to Storage
                                    const path = `${myCase.id}/${fileName}`;
                                    const { error: uploadError } = await supabase.storage
                                        .from('quiz-uploads').upload(path, file, { upsert: true });
                                    
                                    if (uploadError) throw uploadError;
                                    
                                    const { data: urlData } = supabase.storage.from('quiz-uploads').getPublicUrl(path);

                                    // 4. Save to DB
                                    const { error: dbError } = await supabase.from('criterion_quiz_uploads').upsert({
                                        case_id: myCase.id,
                                        criterion_id: targetKey,
                                        audit_type: normAudit,
                                        file_name: fileName,
                                        file_url: urlData.publicUrl,
                                        uploaded_at: new Date().toISOString()
                                    }, { onConflict: 'case_id,criterion_id,audit_type' });

                                    if (dbError) throw dbError;

                                    // 5. Notify Consultant
                                    await supabase.from('case_messages').insert({
                                        case_id: myCase.id,
                                        sender_id: user.id,
                                        content: `[SYSTEM] 🏆 Quiz validé avec rapport détaillé !\n🎯 Critère ${currentCriterion.id}\n📊 Score : ${score}%\n📄 Fichier généré : ${fileName}`
                                    });

                                    // 6. Update local UI
                                    setQuizUploads(prev => ({
                                        ...prev,
                                        [targetKey]: {
                                            ...(prev[targetKey] || {}),
                                            [normAudit]: { 
                                                file_name: fileName,
                                                file_url: urlData.publicUrl,
                                                uploaded_at: new Date().toISOString() 
                                            }
                                        }
                                    }));

                                    showStatus('success', 'Rapport généré !', `Votre score de ${score}% et le détail de vos réponses ont été transmis à votre consultant.`);
                                } catch (err) {
                                    console.error("Error saving detailed quiz score:", err);
                                    showStatus('error', 'Erreur', "Impossible de générer le rapport : " + err.message);
                                }
                            }}
                        />




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
                                    // Robust state lookup: try both number and string keys
                                     const state = indicatorStates[ind.id] || indicatorStates[String(ind.id)] || {}
                                     const status = state.status || null
                                    const verdict = state.consultant_verdict
                                    const currentAuditKey = (selectedAudit || 'initial').trim().toLowerCase()
                                    const fileData = quizUploads['ind_' + ind.id]?.[currentAuditKey]

                                    const isDone = status === 'done'
                                    const isNonApplicable = status === 'not_applicable' || status === 'non_applicable'

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
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${status === 'not_applicable' || status === 'non_applicable' ? 'text-slate-500 bg-slate-50' :
                                                                 status === 'to_do' || status === 'doing' ? 'text-blue-600 bg-blue-50' :
                                                                 status === 'done' ? 'text-emerald-600 bg-emerald-50' :
                                                                     'text-blue-600 bg-blue-50'
                                                                 }`}>
                                                                {status === 'done' ? 'FAIT' : (status === 'not_applicable' || status === 'non_applicable' ? 'NA' : (status === 'to_do' || status === 'doing' ? 'EN COURS' : 'À DÉCLARER'))}
                                                            </span>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedVideoIndicator(ind.id);
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}
                                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                                    selectedVideoIndicator === ind.id 
                                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                                                                        : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'
                                                                }`}
                                                            >
                                                                <PlayCircle className="h-3 w-3" />
                                                                {selectedVideoIndicator === ind.id ? 'Vidéo en cours' : 'Voir la vidéo'}
                                                            </button>
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
                                                    {status !== 'non_applicable' && (
                                                        <div className="absolute top-6 right-8">
                                                            <button className="flex items-center gap-2 px-4 py-2 bg-[#f5f0ff] text-[#7c3aed] rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#ede5ff] transition-all">
                                                                <Download className="h-3.5 w-3.5" /> Télécharger le modèle type
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                                        {/* Status Selection (Left) */}
                                                        <div className="lg:col-span-4">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Déclarez votre statut</p>
                                                            <div className="space-y-2.5">
                                                                {[
                                                                    { val: 'to_do', label: 'En cours', icon: Sun, color: 'text-blue-600', active: 'border-blue-200 bg-blue-50 text-blue-700' },
                                                                    { val: 'done', label: 'Fait', icon: Flag, color: 'text-emerald-500', active: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
                                                                    { val: 'not_applicable', label: 'Non applicable', icon: Ban, color: 'text-orange-500', active: 'border-orange-500 bg-orange-50 text-orange-700' },
                                                                ].map(opt => (
                                                                    <button
                                                                        key={opt.val}
                                                                        onClick={() => handleStatusChange(ind.id, opt.val)}
                                                                        disabled={!dirtyIndicators.has(ind.id) && !pendingFiles[ind.id] && status !== null}
                                                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-[13px] font-bold transition-all ${status === opt.val
                                                                            ? opt.active
                                                                            : 'border-transparent bg-gray-50/50 text-gray-400 hover:bg-gray-50'
                                                                            } ${(!dirtyIndicators.has(ind.id) && !pendingFiles[ind.id] && status !== null) ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
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
                                                                Preuve documentaire
                                                            </p>

                                                            <div className="flex-1">
                                                                { (fileData || pendingFiles[ind.id]) ? (
                                                                    <div className="h-[154px] flex flex-col justify-center bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-2xl px-8 relative">
                                                                        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-5 shadow-sm">
                                                                            <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-red-500">
                                                                                <FileText className="h-7 w-7" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-black text-gray-900 truncate mb-1">
                                                                                    {pendingFiles[ind.id]?.name || (fileData ? fileData.file_name : '')}
                                                                                </p>
                                                                                <p className={`text-[11px] ${pendingFiles[ind.id] ? 'text-blue-500' : 'text-emerald-600'} font-bold flex items-center gap-1.5 uppercase tracking-wider`}>
                                                                                    {pendingFiles[ind.id] ? (
                                                                                        <>Non enregistré</>
                                                                                    ) : (
                                                                                        <><Check className="h-3 w-3 stroke-[3px]" /> Prêt pour l'audit</>
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    if (pendingFiles[ind.id] || pendingFiles[String(ind.id)]) {
                                                                                        setPendingFiles(prev => {
                                                                                            const { [ind.id]: _, [String(ind.id)]: __, ...rest } = prev
                                                                                            return rest
                                                                                        })
                                                                                    } else {
                                                                                        handleDeleteFile('ind_' + ind.id)
                                                                                    }
                                                                                }}
                                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer z-20"
                                                                                title="Supprimer le fichier"
                                                                            >
                                                                                <Trash2 className="h-5 w-5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => { setPendingCriterionId(ind.id); fileInputRef.current?.click() }}
                                                                        disabled={uploadingFor === 'ind_' + ind.id || savingIndicator === ind.id}
                                                                        className="w-full h-[154px] flex flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-gray-100 text-gray-500 hover:border-[#7c3aed]/30 hover:bg-[#fbf9ff] transition-all group"
                                                                    >
                                                                        <div className="h-12 w-12 bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                            <Upload className="h-6 w-6 text-[#7c3aed]" />
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <p className="text-sm font-black text-gray-800">Cliquez pour ajouter un document</p>
                                                                            <p className="text-[11px] text-gray-400 mt-1 font-medium">Sera enregistré avec l'indicateur</p>
                                                                        </div>
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* SAVE BUTTON AT BOTTOM OF CARD */}
                                                            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                                                                {saveSuccess[ind.id] && (
                                                                    <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 animate-in fade-in zoom-in duration-300">
                                                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                                        <span className="text-emerald-600 text-[11px] font-black uppercase tracking-widest leading-none">
                                                                            Enregistrement réussi !
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                
                                                                 <button
                                                                     onClick={() => {
                                                                         if (!dirtyIndicators.has(ind.id) && !pendingFiles[ind.id] && status !== null) {
                                                                             // "Modifier" mode triggered by making it dirty (using current status as starting point)
                                                                             setDirtyIndicators(prev => new Set(prev).add(ind.id))
                                                                         } else {
                                                                             handleSaveIndicator(ind.id)
                                                                         }
                                                                     }}
                                                                     disabled={savingIndicator === ind.id}
                                                                     className={`min-w-[140px] h-11 px-8 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                                                         savingIndicator === ind.id 
                                                                             ? 'bg-gray-100 text-gray-400 cursor-progress'
                                                                             : (dirtyIndicators.has(ind.id) || pendingFiles[ind.id] || status === null)
                                                                                 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95'
                                                                                 : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                                                     }`}
                                                                 >
                                                                     {savingIndicator === ind.id ? (
                                                                         'Enregistrement...'
                                                                     ) : (dirtyIndicators.has(ind.id) || pendingFiles[ind.id] || status === null) ? (
                                                                         'Enregistrer'
                                                                     ) : (
                                                                         'Modifier mon choix'
                                                                     )}
                                                                 </button>
                                                            </div>
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
                        if (file && pendingCriterionId) {
                            if (typeof pendingCriterionId === 'number') {
                                handleFileSelect(file, pendingCriterionId)
                            } else {
                                // Legacy path for criterion-level uploads
                                handleFileUpload(file, pendingCriterionId)
                            }
                        }
                        e.target.value = ''
                    }}
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

    // ─── MAIN DASHBOARD (Vue d'ensemble) ─────────────────────────────────────
    return (
        <div className="bg-gray-50 min-h-screen flex font-sans">
            <ClientSidebar
                caseData={myCase}
                indicators={indicators}
                indicatorStates={indicatorStates}
                consultantName={consultantName}
                unreadCount={messages.filter(m => m.sender_id !== user.id && !m.read_at).length}
                upcomingCount={caseEvents.filter(e => new Date(e.event_date) > new Date()).length}
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

                {globalMessage && (
                    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
                        <div className={`px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 ${globalMessage.includes('ERREUR') || globalMessage.includes('Erreur') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm font-black uppercase tracking-wider">{globalMessage}</span>
                        </div>
                    </div>
                )}

                <main className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full">
                    {/* Audit Selection Tabs (Horizontal Badges) */}
                    <div className="flex flex-wrap gap-3 mb-10">
                        {casesData?.flatMap((c) => {
                            const types = Array.isArray(c.audit_type) ? c.audit_type : [c.audit_type || 'Initial'];
                            return types.map((type, typeIdx) => {
                                const getColors = (t) => {
                                    const typeStr = t.toLowerCase();
                                    if (typeStr.includes('initial')) return { 
                                        active: 'bg-[#cc6d3e] text-white border-[#cc6d3e] shadow-[#cc6d3e]/30', 
                                        inactive: 'hover:border-[#cc6d3e]/30 hover:bg-[#cc6d3e]/5 text-slate-400',
                                        dot: 'bg-[#cc6d3e]' 
                                    };
                                    if (typeStr.includes('surveillance')) return { 
                                        active: 'bg-blue-600 text-white border-blue-600 shadow-blue-600/30', 
                                        inactive: 'hover:border-blue-600/30 hover:bg-blue-600/5 text-slate-400',
                                        dot: 'bg-blue-600' 
                                    };
                                    if (typeStr.includes('renouvellement')) return { 
                                        active: 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/30', 
                                        inactive: 'hover:border-emerald-600/30 hover:bg-emerald-600/5 text-slate-400',
                                        dot: 'bg-emerald-600' 
                                    };
                                    return { active: 'bg-slate-800 text-white', inactive: 'text-slate-400', dot: 'bg-slate-400' };
                                };
                                
                                const colors = getColors(type);
                                const isSelected = myCase?.id === c.id && selectedAudit === type;
                                const cleanType = type.replace(/audit/gi, '').trim();

                                return (
                                    <button
                                        key={`${c.id}-${typeIdx}`}
                                        onClick={() => {
                                            setMyCase(c);
                                            setSelectedAudit(type);
                                        }}
                                        className={`flex items-center gap-3 px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 border-2 ${
                                            isSelected 
                                                ? `${colors.active} shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] scale-105 z-10` 
                                                : `bg-white border-slate-50 ${colors.inactive} shadow-sm translate-y-0`
                                        } hover:-translate-y-1 active:scale-95`}
                                    >
                                        <div className={`h-2.5 w-2.5 rounded-full shadow-inner ${isSelected ? 'bg-white animate-pulse' : colors.dot} transition-colors duration-500`} />
                                        AUDIT {cleanType}
                                    </button>
                                );
                            });
                        })}
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

