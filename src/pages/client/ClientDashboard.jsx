import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import {
    FileText, Upload, CheckCircle, Clock, AlertTriangle,
    Download, XCircle, MessageSquare, ChevronDown, ChevronUp, CircleOff,
    CheckSquare, Target, BookOpen, Layers
} from 'lucide-react'
import ClientSidebar from '../../components/client/ClientSidebar'
import ClientTopBar from '../../components/client/ClientTopBar'

export default function ClientDashboard() {
    const { user, profile, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // Tab Logic
    const activeTab = location.pathname.split('/').pop() || 'dashboard'

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <ClientSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mx-auto" />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans flex text-slate-800">
            <ClientSidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <ClientTopBar />

                <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-8">

                    {/* Header Summary */}
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                            {/* Accent background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 z-0"></div>

                            <div className="relative z-10">
                                <h1 className="text-3xl font-black text-gray-900 mb-2">Suivi de votre Audit</h1>
                                <p className="text-gray-400 text-sm mb-8">Préparez sereinement votre certification Qualiopi.</p>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-black text-teal-600 uppercase tracking-widest">Progression Globale</span>
                                        <span className="text-2xl font-black text-teal-600">{progressPercent}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                        <div className="px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                                            {doneCount}/{totalIndicators} Indicateurs
                                        </div>
                                        <div className="px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                            {myCase?.audit_type?.[0] || 'Initial'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-80 space-y-4 flex flex-col">
                            <div className="flex-1 bg-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-100 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-lg font-bold mb-1">Besoin d'aide ?</h3>
                                    <p className="text-emerald-100 text-xs mb-4">Votre consultant est prêt à répondre à toutes vos questions via la messagerie.</p>
                                    <button
                                        onClick={() => navigate('/client/messages')}
                                        className="w-full py-3 bg-white text-emerald-600 rounded-xl font-black text-sm hover:bg-emerald-50 transition-colors shadow-xl shadow-emerald-700/20"
                                    >
                                        Contacter le consultant
                                    </button>
                                </div>
                                <MessageSquare className="absolute -right-4 -bottom-4 h-24 w-24 text-emerald-500/30" />
                            </div>
                            <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-teal-200 transition-all">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Prochain RDV</p>
                                    <p className="text-sm font-black text-gray-900">Aucun planifié</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                                    <ChevronRight className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Referential Action Items */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-50 rounded-xl">
                                        <CheckSquare className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900">Plan d'action Qualiopi</h2>
                                </div>
                                <div className="flex bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
                                    <button className="px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-900 rounded-lg">Tous</button>
                                    <button className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600">À faire</button>
                                    <button className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600">Terminés</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {Object.values(groupedIndicators).map((criterion) => {
                                    const isExpanded = expandedCriteria[criterion.id] !== false
                                    const doneCnt = criterion.items.filter(ind => indicatorStates[ind.id]?.status === 'done' || indicatorStates[ind.id]?.status === 'non_applicable').length
                                    const critPct = criterion.items.length > 0 ? Math.round((doneCnt / criterion.items.length) * 100) : 0
                                    const quizUploaded = quizUploads[criterion.id]

                                    return (
                                        <div key={criterion.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:border-teal-200 transition-all overflow-hidden">
                                            <button
                                                className="w-full px-6 py-5 flex items-center justify-between text-left group"
                                                onClick={() => setExpandedCriteria(prev => ({ ...prev, [criterion.id]: !isExpanded }))}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${critPct === 100 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-gray-100 text-gray-500 group-hover:bg-teal-50 group-hover:text-teal-600'}`}>
                                                        C{criterion.id}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{criterion.label}</h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs text-gray-400 font-bold">{doneCnt}/{criterion.items.length} indicateurs</span>
                                                            {quizUploaded && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">• Quiz prêt</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="hidden sm:flex flex-col items-end gap-1">
                                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className={`h-full transition-all ${critPct === 100 ? 'bg-emerald-500' : 'bg-teal-500'}`} style={{ width: `${critPct}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-400">{critPct}%</span>
                                                    </div>
                                                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-300" /> : <ChevronDown className="h-5 w-5 text-gray-300" />}
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="px-6 pb-6 pt-2 space-y-4">
                                                    <div className="h-px bg-gray-50 mb-4" />
                                                    <div className="space-y-1">
                                                        {criterion.items.map((ind) => {
                                                            const state = indicatorStates[ind.id] || {}
                                                            const status = state.status || 'to_do'
                                                            const consultantVerdict = state.consultant_verdict
                                                            const verdictCfg = verdictConfig[consultantVerdict]

                                                            return (
                                                                <div key={ind.id} className="group/item flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
                                                                    <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                                                                        <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-transparent group-hover/item:border-teal-300'}`}>
                                                                            <CheckCircle className="h-4 w-4" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">{ind.code}</p>
                                                                            <p className="text-sm font-bold text-gray-800 truncate">{ind.label}</p>
                                                                            {verdictCfg && (
                                                                                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-black text-emerald-600 uppercase">
                                                                                    {verdictCfg.icon} {verdictCfg.label}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleStatusChange(ind.id, 'done')}
                                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${status === 'done' ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'}`}
                                                                        >
                                                                            {status === 'done' ? 'Terminé' : 'Marquer Fait'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleStatusChange(ind.id, 'to_do')}
                                                                            className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${status === 'to_do' ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-300 hover:text-amber-500'}`}
                                                                            title="En cours"
                                                                        >
                                                                            <Clock className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>

                                                    {/* Quiz Submissions */}
                                                    <div className={`mt-6 p-5 rounded-3xl border-2 transition-all ${critPct === 100 ? 'bg-teal-50/50 border-teal-100' : 'bg-gray-50 border-dashed border-gray-200 opacity-60'}`}>
                                                        {quizUploaded ? (
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-teal-600 shadow-sm border border-teal-100">
                                                                    <FileText className="h-6 w-6" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-black text-teal-700 uppercase tracking-widest leading-tight mb-1">Dossier de preuves (Quiz)</p>
                                                                    <p className="text-sm font-bold text-teal-900 truncate">{quizUploaded.file_name}</p>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <a href={quizUploaded.file_url} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white text-teal-600 hover:bg-teal-600 hover:text-white transition-all border border-teal-100 shadow-sm">
                                                                        <Download className="h-4 w-4" />
                                                                    </a>
                                                                    <button
                                                                        onClick={() => { setPendingCriterionId(criterion.id); fileInputRef.current?.click() }}
                                                                        className="p-2.5 rounded-xl bg-white text-gray-400 hover:text-teal-600 transition-all border border-gray-100 shadow-sm"
                                                                    >
                                                                        <Upload className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center">
                                                                <p className="text-sm font-bold text-gray-600 mb-3">{critPct === 100 ? 'Prêt à uploader le dossier de preuves' : 'Terminez tous les indicateurs pour uploader le quiz'}</p>
                                                                <button
                                                                    disabled={critPct < 100 || uploadingFor === criterion.id}
                                                                    onClick={() => { setPendingCriterionId(criterion.id); fileInputRef.current?.click() }}
                                                                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-black transition-all ${critPct === 100 ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                                >
                                                                    {uploadingFor === criterion.id ? 'Upload...' : 'Uploader le Quiz'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Right Sidebar Assets */}
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-teal-600" />
                                    Guide d'audit
                                </h3>
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-2">
                                    {[
                                        { title: 'Information du public', sub: 'Critère 1', time: '5 min' },
                                        { title: 'Conception des prestations', sub: 'Critère 2', time: '10 min' },
                                        { title: 'Accompagnement du public', sub: 'Critère 3', time: '8 min' },
                                    ].map((guide, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all group cursor-pointer border border-transparent hover:border-gray-50">
                                            <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                                                <Target className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{guide.sub}</p>
                                                <p className="text-sm font-bold text-gray-900 leading-tight">{guide.title}</p>
                                                <p className="text-[10px] text-teal-600 font-bold mt-0.5 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {guide.time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                                <Layers className="absolute -right-4 -bottom-4 h-24 w-24 text-white/5" />
                                <div className="relative z-10">
                                    <h3 className="text-xl font-normal leading-tight mb-4">
                                        <span className="font-black">95%</span> des organismes réussissent leur audit avec <span className="text-teal-400 font-bold italic">EasyQual</span>.
                                    </h3>
                                    <div className="h-1 w-12 bg-teal-500 mb-6 rounded-full"></div>
                                    <p className="text-gray-400 text-xs leading-relaxed">
                                        Assurez-vous de bien uploader vos dossiers de preuves pour chaque critère terminé avant le jour J.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </main>
            </div>

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
