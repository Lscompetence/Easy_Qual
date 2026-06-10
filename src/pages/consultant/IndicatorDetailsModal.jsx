import { useState, useEffect, useCallback } from 'react'
import { X, CheckCircle, XCircle, MessageSquare, Download, FileText, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function IndicatorDetailsModal({ indicator, caseId, auditType, onClose, onUpdate }) {
    const [clientStatus, setClientStatus] = useState('to_do')
    const [consultantComment, setConsultantComment] = useState('')
    const [verdict, setVerdict] = useState(null) // 'validated' | 'non_conforme' | null
    const [quizFile, setQuizFile] = useState(null) // { file_url, file_name, uploaded_at }
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        if (indicator && caseId) fetchDetails()
    }, [indicator, caseId, auditType, fetchDetails])

    const fetchDetails = useCallback(async () => {
        setLoading(true)
        try {
            // 1. Fetch indicator state (client status + consultant data)
            const { data: stateData } = await supabase
                .from('case_indicator_states')
                .select('status, consultant_comment, consultant_verdict')
                .eq('case_id', caseId)
                .eq('indicator_id', indicator.id)
                .eq('audit_type', auditType)
                .maybeSingle()

            if (stateData) {
                setClientStatus(stateData.status || 'to_do')
                setConsultantComment(stateData.consultant_comment || '')
                setVerdict(stateData.consultant_verdict || null)
            }

            // 2. Fetch quiz upload for this criterion
            if (indicator.criterion_id) {
                const { data: quizData } = await supabase
                    .from('criterion_quiz_uploads')
                    .select('file_url, file_name, uploaded_at')
                    .eq('case_id', caseId)
                    .eq('criterion_id', indicator.criterion_id)
                    .eq('audit_type', auditType)
                    .maybeSingle()

                if (quizData) setQuizFile(quizData)
            }
        } catch (error) {
            console.error('fetchDetails error:', error)
        } finally {
            setLoading(false)
        }
    }, [indicator, caseId, auditType])

    const handleSaveVerdict = async (newVerdict) => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('case_indicator_states')
                .upsert({
                    case_id: caseId,
                    indicator_id: indicator.id,
                    audit_type: auditType,
                    status: clientStatus,
                    consultant_comment: consultantComment,
                    consultant_verdict: newVerdict,
                    updated_at: new Date()
                }, { onConflict: 'case_id,indicator_id,audit_type' })

            if (error) throw error
            setVerdict(newVerdict)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
            onUpdate(indicator.id, clientStatus)
        } catch (err) {
            console.error('Error saving verdict:', err)
        } finally {
            setSaving(false)
        }
    }

    const handleSaveComment = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('case_indicator_states')
                .upsert({
                    case_id: caseId,
                    indicator_id: indicator.id,
                    audit_type: auditType,
                    status: clientStatus,
                    consultant_comment: consultantComment,
                    consultant_verdict: verdict,
                    updated_at: new Date()
                }, { onConflict: 'case_id,indicator_id,audit_type' })

            if (error) throw error
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            console.error('Error saving comment:', err)
        } finally {
            setSaving(false)
        }
    }

    const clientStatusConfig = {
        to_do: { label: 'À faire', color: 'bg-gray-100 text-gray-600', icon: <Clock className="h-3.5 w-3.5" /> },
        doing: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: <AlertCircle className="h-3.5 w-3.5" /> },
        done: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
    }
    const statusCfg = clientStatusConfig[clientStatus] || clientStatusConfig.to_do

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider">
                                {indicator.code}
                            </span>
                            <span className="text-gray-400 text-xs font-medium">Critère {indicator.criterion_id}</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 leading-snug max-w-xl">{indicator.label}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">

                        {/* ── Section 1: Client Self-Assessment (READ-ONLY) ── */}
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                Auto-évaluation du client
                            </h3>
                            <div className="flex items-center gap-3">
                                {/* Status badge */}
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${statusCfg.color}`}>
                                    {statusCfg.icon}
                                    {statusCfg.label}
                                </div>
                                <span className="text-xs text-gray-400">— mis à jour par le client</span>
                            </div>

                            {/* Visual progress bars */}
                            <div className="mt-4 space-y-2">
                                {/* Bar 1: Non conforme */}
                                <div className="flex items-center gap-3">
                                    <div className="w-28 text-xs font-bold text-gray-500 text-right">Non conforme</div>
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${clientStatus === 'to_do' ? 'bg-red-400 w-full' : 'w-0'}`}
                                        />
                                    </div>
                                    {clientStatus === 'to_do' && <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}
                                </div>
                                {/* Bar 2: Validé */}
                                <div className="flex items-center gap-3">
                                    <div className="w-28 text-xs font-bold text-gray-500 text-right">Validé</div>
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${clientStatus === 'done' ? 'bg-emerald-400 w-full' : clientStatus === 'doing' ? 'bg-blue-400 w-1/2' : 'w-0'}`}
                                        />
                                    </div>
                                    {clientStatus === 'done' && <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
                                </div>
                            </div>

                            {/* Percentage */}
                            {clientStatus === 'done' && (
                                <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm font-bold text-emerald-700">100% — Indicateur complété par le client</span>
                                </div>
                            )}
                            {clientStatus === 'doing' && (
                                <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-bold text-blue-700">50% — En cours de traitement</span>
                                </div>
                            )}
                        </div>

                        {/* ── Section 2: Quiz Upload (from client) ── */}
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                Quiz soumis par le client
                            </h3>
                            {quizFile ? (
                                <a
                                    href={quizFile.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors group"
                                >
                                    <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-indigo-900 truncate">{quizFile.file_name || 'Quiz.pdf'}</p>
                                        <p className="text-xs text-indigo-500">
                                            Soumis le {new Date(quizFile.uploaded_at).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                    <Download className="h-4 w-4 text-indigo-500 group-hover:text-indigo-700 ml-auto" />
                                </a>
                            ) : (
                                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-400">
                                    <FileText className="h-5 w-5" />
                                    <span className="text-sm">Aucun quiz soumis pour ce critère</span>
                                </div>
                            )}
                        </div>

                        {/* ── Section 3: Consultant Comment ── */}
                        <div className="px-6 py-5 border-b border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                                <MessageSquare className="h-4 w-4 text-purple-500" />
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Remarque du consultant
                                </h3>
                            </div>
                            <textarea
                                value={consultantComment}
                                onChange={e => setConsultantComment(e.target.value)}
                                rows={3}
                                placeholder="Laissez une remarque visible par le client (ex: document manquant, point à corriger…)"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none transition-all"
                            />
                            <button
                                onClick={handleSaveComment}
                                disabled={saving}
                                className="mt-2 px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer la remarque'}
                            </button>
                        </div>

                        {/* ── Section 4: Consultant Verdict ── */}
                        <div className="px-6 py-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                                Décision du consultant
                            </h3>

                            {verdict && (
                                <div className={`mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${verdict === 'validated' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {verdict === 'validated' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                    {verdict === 'validated' ? 'Validé' : 'Non conforme'}
                                    <span className="text-xs font-normal opacity-70 ml-1">— décision actuelle</span>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleSaveVerdict('validated')}
                                    disabled={saving}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border-2 ${verdict === 'validated'
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                        }`}
                                >
                                    <CheckCircle className="h-5 w-5" />
                                    Validé ✅
                                </button>
                                <button
                                    onClick={() => handleSaveVerdict('non_conforme')}
                                    disabled={saving}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border-2 ${verdict === 'non_conforme'
                                        ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30'
                                        : 'border-red-200 text-red-600 hover:bg-red-50'
                                        }`}
                                >
                                    <XCircle className="h-5 w-5" />
                                    Non conforme ❌
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
