import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
    FileText, Upload, CheckCircle, Clock, AlertTriangle,
    LogOut, Download, XCircle, MessageSquare, ChevronDown, ChevronUp, CircleOff
} from 'lucide-react'
import Logo from '../../components/Logo'

export default function ClientDashboard() {
    const { user, logout, profile } = useAuth()
    const navigate = useNavigate()

    const [tenant, setTenant] = useState(null)
    const [myCase, setMyCase] = useState(null)
    const [indicators, setIndicators] = useState([])
    const [indicatorStates, setIndicatorStates] = useState({}) // { indicator_id: { status, consultant_comment, consultant_verdict } }
    const [quizUploads, setQuizUploads] = useState({}) // { criterion_id: { file_url, file_name, uploaded_at } }
    const [uploadingFor, setUploadingFor] = useState(null) // criterion_id being uploaded
    const [expandedCriteria, setExpandedCriteria] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)
    const [pendingCriterionId, setPendingCriterionId] = useState(null)

    useEffect(() => {
        if (user) fetchClientData()
    }, [user])

    const fetchClientData = async () => {
        try {
            setLoading(true)

            // 1. Fetch My Tenant
            const { data: tenantData, error: tenantError } = await supabase
                .from('tenants').select('*').eq('owner_id', user.id).single()
            if (tenantError) throw tenantError
            setTenant(tenantData)

            // 2. Fetch My Case
            const { data: caseData, error: caseError } = await supabase
                .from('cases').select('*').eq('tenant_id', tenantData.id).single()
            if (caseError && caseError.code !== 'PGRST116') throw caseError
            setMyCase(caseData)

            if (caseData) {
                // 3. Fetch indicator states (with consultant data)
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

                // 4. Fetch quiz uploads
                const { data: quizData } = await supabase
                    .from('criterion_quiz_uploads')
                    .select('criterion_id, file_url, file_name, uploaded_at')
                    .eq('case_id', caseData.id)

                const quizMap = {}
                quizData?.forEach(q => { quizMap[q.criterion_id] = q })
                setQuizUploads(quizMap)
            }

            // 5. Fetch Indicators
            const { data: indicatorsData } = await supabase
                .from('indicators')
                .select('id, code, label, criterion_id, criteria (id, label)')
                .order('id', { ascending: true })
            setIndicators(indicatorsData || [])

        } catch (err) {
            console.error('Error loading client data:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (indicatorId, newStatus) => {
        if (!myCase) return
        setIndicatorStates(prev => ({
            ...prev,
            [indicatorId]: { ...(prev[indicatorId] || {}), status: newStatus }
        }))
        await supabase.from('case_indicator_states').upsert({
            case_id: myCase.id,
            indicator_id: indicatorId,
            audit_type: myCase.audit_type?.[0] || 'initial',
            status: newStatus
        }, { onConflict: 'case_id,indicator_id,audit_type' })
    }

    const handleQuizUpload = async (file, criterionId) => {
        if (!file || !myCase) return
        setUploadingFor(criterionId)
        try {
            const ext = file.name.split('.').pop()
            const path = `${myCase.id}/${criterionId}_${Date.now()}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from('quiz-uploads')
                .upload(path, file, { upsert: true })
            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage.from('quiz-uploads').getPublicUrl(path)

            const { error: dbError } = await supabase.from('criterion_quiz_uploads').upsert({
                case_id: myCase.id,
                criterion_id: criterionId,
                audit_type: myCase.audit_type?.[0] || 'initial',
                file_url: urlData.publicUrl,
                file_name: file.name,
                uploaded_by: user.id
            }, { onConflict: 'case_id,criterion_id,audit_type' })
            if (dbError) throw dbError

            setQuizUploads(prev => ({
                ...prev,
                [criterionId]: { file_url: urlData.publicUrl, file_name: file.name, uploaded_at: new Date().toISOString() }
            }))
        } catch (err) {
            console.error('Quiz upload error:', err)
            alert('Erreur lors de l\'upload : ' + err.message)
        } finally {
            setUploadingFor(null)
        }
    }

    const handleLogout = async () => {
        try { await logout(); navigate('/login?role=client') } catch (e) { console.error(e) }
    }

    // Calc Progress
    const totalIndicators = indicators.length
    const doneCount = Object.values(indicatorStates).filter(s => s?.status === 'done' || s?.status === 'non_applicable').length
    const progressPercent = totalIndicators > 0 ? Math.round((doneCount / totalIndicators) * 100) : 0

    // Group by Criterion
    const groupedIndicators = indicators.reduce((acc, ind) => {
        const key = ind.criterion_id || 'autre'
        if (!acc[key]) acc[key] = { label: ind.criteria?.label || 'Autre', id: key, items: [] }
        acc[key].items.push(ind)
        return acc
    }, {})

    const verdictConfig = {
        validated: { label: 'Conforme', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle className="h-3.5 w-3.5" /> },
        non_conforme: { label: 'Non conforme', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="h-3.5 w-3.5" /> },
        non_applicable: { label: 'Non Applicable', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <CircleOff className="h-3.5 w-3.5" /> },
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <Logo size="small" />
                            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">Client</span>
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block text-center">
                            <span className="text-sm font-semibold text-teal-600">Bonjour {profile?.first_name} {profile?.last_name}</span>
                            {tenant && <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{tenant.name}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/profile')} className="text-sm font-medium text-gray-500 hover:text-teal-600 transition-colors">Mon Profil</button>
                            <button onClick={handleLogout} className="flex items-center text-gray-500 hover:text-red-600 transition-colors">
                                <LogOut className="h-5 w-5 mr-1" />
                                <span className="hidden sm:inline text-sm">Déconnexion</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Mon Audit Qualiopi</h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Dossier N° {myCase?.id?.slice(0, 8) || '…'} • {myCase?.category === 'multi-site' ? 'Multi-site' : 'Mono-site'}
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-700">
                            <Clock className="h-4 w-4" /> En cours
                        </span>
                    </div>
                    {/* Progress */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500 font-medium">Progression globale</span>
                            <span className="font-bold text-gray-900">{progressPercent}% <span className="text-gray-400 font-normal">({doneCount}/{totalIndicators} indicateurs)</span></span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${progressPercent}%`,
                                    background: 'linear-gradient(90deg, #14b8a6, #0ea5e9)'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Indicators by Criterion */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mx-auto" />
                        <p className="mt-4 text-gray-400 text-sm">Chargement du référentiel…</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.values(groupedIndicators).map((criterion) => {
                            const allDone = criterion.items.every(ind => indicatorStates[ind.id]?.status === 'done')
                            const doneCnt = criterion.items.filter(ind => indicatorStates[ind.id]?.status === 'done' || indicatorStates[ind.id]?.status === 'non_applicable').length
                            const critPct = criterion.items.length > 0 ? Math.round((doneCnt / criterion.items.length) * 100) : 0
                            const quizUploaded = quizUploads[criterion.id]
                            const isExpanded = expandedCriteria[criterion.id] !== false // default expanded

                            return (
                                <div key={criterion.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                                    {/* Criterion Header */}
                                    <button
                                        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-100"
                                        onClick={() => setExpandedCriteria(prev => ({ ...prev, [criterion.id]: !isExpanded }))}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
                                                <FileText className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <h2 className="text-sm font-bold text-gray-900">{criterion.label}</h2>
                                                <p className="text-xs text-gray-400">{doneCnt}/{criterion.items.length} indicateurs terminés</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* Mini progress */}
                                            <div className="hidden sm:flex items-center gap-2">
                                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${critPct}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-500">{critPct}%</span>
                                            </div>
                                            {quizUploaded && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                                    <FileText className="h-3 w-3" /> Quiz soumis
                                                </span>
                                            )}
                                            {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <>
                                            {/* Indicators */}
                                            <div className="divide-y divide-gray-50">
                                                {criterion.items.map((ind) => {
                                                    const state = indicatorStates[ind.id] || {}
                                                    const status = state.status || 'to_do'
                                                    const consultantVerdict = state.consultant_verdict
                                                    const consultantComment = state.consultant_comment
                                                    const vCfg = verdictConfig[consultantVerdict]

                                                    return (
                                                        <div key={ind.id} className="px-6 py-5">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-black rounded">{ind.code}</span>
                                                                        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{ind.label}</h3>
                                                                    </div>

                                                                    {/* Consultant verdict badge */}
                                                                    {vCfg && (
                                                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border mb-2 ${vCfg.color}`}>
                                                                            {vCfg.icon} {vCfg.label} par le consultant
                                                                        </div>
                                                                    )}

                                                                    {/* Consultant comment */}
                                                                    {consultantComment && (
                                                                        <div className="flex items-start gap-2 mt-2 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                                                                            <MessageSquare className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                                                                            <p className="text-xs text-purple-800 font-medium">{consultantComment}</p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Status selector */}
                                                                <div className="flex-shrink-0">
                                                                    <div className="flex flex-col gap-1.5">
                                                                        {/* En cours */}
                                                                        <button
                                                                            onClick={() => handleStatusChange(ind.id, 'to_do')}
                                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${status === 'to_do' ? 'bg-orange-500 border-orange-500 text-white shadow-sm' : 'border-gray-100 text-gray-400 hover:border-orange-200'}`}
                                                                        >
                                                                            <Clock className="h-3.5 w-3.5" /> En cours
                                                                        </button>
                                                                        {/* Fait */}
                                                                        <button
                                                                            onClick={() => handleStatusChange(ind.id, 'done')}
                                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-gray-100 text-gray-400 hover:border-emerald-200'}`}
                                                                        >
                                                                            <CheckCircle className="h-3.5 w-3.5" /> Fait
                                                                        </button>
                                                                        {/* Non Applicable */}
                                                                        <button
                                                                            onClick={() => handleStatusChange(ind.id, 'non_applicable')}
                                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${status === 'non_applicable' ? 'bg-slate-500 border-slate-500 text-white shadow-sm' : 'border-gray-100 text-gray-400 hover:border-slate-200'}`}
                                                                        >
                                                                            <CircleOff className="h-3.5 w-3.5" /> Non Applicable
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Quiz Upload Zone — shown when all indicators are done */}
                                            <div className={`mx-6 mb-6 rounded-xl border-2 transition-all ${allDone ? 'border-indigo-200 bg-indigo-50' : 'border-dashed border-gray-200 bg-gray-50 opacity-60'}`}>
                                                {quizUploaded ? (
                                                    <div className="p-4 flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <FileText className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-indigo-900 truncate">{quizUploaded.file_name}</p>
                                                            <p className="text-xs text-indigo-500">Soumis le {new Date(quizUploaded.uploaded_at).toLocaleDateString('fr-FR')}</p>
                                                        </div>
                                                        <a href={quizUploaded.file_url} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                                                            <Download className="h-3.5 w-3.5" /> Voir
                                                        </a>
                                                        {allDone && (
                                                            <button
                                                                onClick={() => { setPendingCriterionId(criterion.id); fileInputRef.current?.click() }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-300 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                                                            >
                                                                <Upload className="h-3.5 w-3.5" /> Remplacer
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="p-5 text-center">
                                                        {allDone ? (
                                                            <>
                                                                <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                    <Upload className="h-6 w-6 text-indigo-600" />
                                                                </div>
                                                                <p className="text-sm font-bold text-indigo-900 mb-1">Tous les indicateurs sont terminés !</p>
                                                                <p className="text-xs text-indigo-500 mb-3">Téléchargez, remplissez et uploadez le quiz de ce critère.</p>
                                                                <button
                                                                    onClick={() => { setPendingCriterionId(criterion.id); fileInputRef.current?.click() }}
                                                                    disabled={uploadingFor === criterion.id}
                                                                    className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                                >
                                                                    {uploadingFor === criterion.id ? (
                                                                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Upload en cours…</>
                                                                    ) : (
                                                                        <><Upload className="h-4 w-4" /> Uploader le quiz complété</>
                                                                    )}
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-2 py-2">
                                                                <AlertTriangle className="h-4 w-4 text-gray-400" />
                                                                <p className="text-xs text-gray-400">Terminez tous les indicateurs pour soumettre le quiz</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.png"
                className="hidden"
                onChange={e => {
                    const file = e.target.files?.[0]
                    if (file && pendingCriterionId) handleQuizUpload(file, pendingCriterionId)
                    e.target.value = ''
                }}
            />
        </div>
    )
}
