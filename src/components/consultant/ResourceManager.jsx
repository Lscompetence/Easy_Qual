import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Video, Upload, Link as LinkIcon, Save, CheckCircle, Trash2, X, AlertCircle, Loader2, PlayCircle, FileText, ChevronRight, Eye } from 'lucide-react';
import StatusModal from '../shared/StatusModal';
import UniversalPlayer from '../shared/UniversalPlayer';

export default function ResourceManager() {
    const getUrlParam = (key) => new URLSearchParams(window.location.search).get(key);
    
    const [auditType, setAuditType] = useState(getUrlParam('audit') || 'initial');
    const resourceType = 'video'; 
    const [indicators, setIndicators] = useState([]);
    const [resources, setResources] = useState({});
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    
    const [activeCriterion, setActiveCriterion] = useState(null);
    const [activeIndicator, setActiveIndicator] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    
    // Form state
    const [sourceType, setSourceType] = useState('youtube');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        isLoading: false
    });
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, [auditType]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Indicators
            const { data: indData } = await supabase
                .from('indicators')
                .select('id, label, code, criterion_id, criteria(label)')
                .order('id', { ascending: true });
            setIndicators(indData || []);

            // 2. Fetch User & Resources
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                const { data: resData } = await supabase
                    .from('consultant_resources')
                    .select('id, consultant_id, indicator_id, audit_type, resource_type, source_type, url, file_path')
                    .eq('consultant_id', user.id)
                    .eq('resource_type', 'video')
                    .eq('audit_type', auditType);
                
                const resMap = {};
                resData?.forEach(r => { resMap[r.indicator_id] = r; });
                setResources(resMap);

                // 3. Handle Initial Selection from URL if not yet set
                const urlCritId = getUrlParam('crit');
                const urlIndId = getUrlParam('ind');

                if (urlCritId && !activeCriterion && indData) {
                    const critInds = indData.filter(i => String(i.criterion_id) === String(urlCritId));
                    if (critInds.length > 0) {
                        const critObj = {
                            id: Number(urlCritId),
                            label: critInds[0].criteria?.label || `Critère ${urlCritId}`,
                            indicators: critInds
                        };
                        setActiveCriterion(critObj);
                        
                        if (urlIndId) {
                            const targetInd = critInds.find(i => String(i.id) === String(urlIndId));
                            if (targetInd) {
                                setActiveIndicator(targetInd);
                                const existing = resMap[targetInd.id];
                                if (existing) {
                                    setSourceType(existing.source_type);
                                    setUrl(existing.url || '');
                                    setShowPreview(true);
                                }
                            }
                        }
                    }
                } else if (activeIndicator) {
                    const existing = resMap[activeIndicator.id];
                    if (existing) {
                        setSourceType(existing.source_type);
                        setUrl(existing.url || '');
                    }
                }
            }
        } catch (error) {
            console.error("Erreur fetchData:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateUrl = (params) => {
        const url = new URL(window.location);
        Object.entries(params).forEach(([k, v]) => {
            if (v) url.searchParams.set(k, v);
            else url.searchParams.delete(k);
        });
        window.history.replaceState({}, '', url);
    };

    const handleEditCriterion = (crit) => {
        setActiveCriterion(crit);
        handleEditIndicator(crit.indicators[0]);
        updateUrl({ crit: crit.id, ind: crit.indicators[0].id });
    };

    const handleEditIndicator = (ind) => {
        setActiveIndicator(ind);
        const existing = resources[ind.id];
        if (existing) {
            setSourceType(existing.source_type);
            setUrl(existing.url || '');
            setFile(null);
            setShowPreview(true);
        } else {
            setSourceType('youtube');
            setUrl('');
            setFile(null);
            setShowPreview(false);
        }
        setUploadProgress(0);
        updateUrl({ ind: ind.id });
    };

    const handleSave = async () => {
        if (!activeIndicator) return;
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Non authentifié");
            
            // Input Validation & Sanitization
            const consultantId = user.id;
            const sanitizedUrl = url?.trim();
            const normAudit = auditType?.trim().toLowerCase();
            const indicatorId = activeIndicator?.id;

            if (!indicatorId) throw new Error("Indicateur non sélectionné");
            
            let filePath = null;

            if (sourceType === 'upload' && file) {
                const limit = 200;
                if (file.size > limit * 1024 * 1024) {
                    throw new Error(`Fichier trop volumineux (Max ${limit}Mo)`);
                }
                
                // Secure extension check
                const allowedExts = ['mp4', 'mov', 'avi', 'wmv'];
                const ext = file.name.split('.').pop()?.toLowerCase();
                if (!allowedExts.includes(ext)) {
                    throw new Error("Format de vidéo non supporté");
                }

                setUploadProgress(10);
                filePath = `${consultantId}/video/${normAudit}_${indicatorId}_${Date.now()}.${ext}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('consultant-assets')
                    .upload(filePath, file, { cacheControl: '3600', upsert: true });
                
                if (uploadError) throw uploadError;
                setUploadProgress(100);
            }

            const payload = {
                consultant_id: consultantId,
                indicator_id: indicatorId,
                resource_type: 'video',
                audit_type: normAudit,
                source_type: sourceType,
                url: (sourceType === 'youtube' || sourceType === 'vimeo') ? sanitizedUrl : null,
                file_path: sourceType === 'upload' ? (filePath || resources[indicatorId]?.file_path) : null,
                updated_at: new Date().toISOString()
            };
            
            const { error: dbError } = await supabase
                .from('consultant_resources')
                .upsert(payload, { onConflict: 'consultant_id,indicator_id,resource_type,audit_type' });

            if (dbError) throw dbError;

            await fetchData();
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Sauvegardé',
                message: "La vidéo a été mise à jour avec succès. Vous pouvez maintenant la prévisualiser.",
                confirmText: 'OK'
            });
            setShowPreview(true);
        } catch (error) {
            console.error("Erreur de sauvegarde:", error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Erreur',
                message: error.message,
                confirmText: 'OK'
            });
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    };

    if (loading && indicators.length === 0) return (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-12 text-center">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Chargement...</p>
        </div>
    );

    const groupedIndicators = indicators.reduce((acc, ind) => {
        if (!acc[ind.criterion_id]) {
            acc[ind.criterion_id] = {
                id: ind.criterion_id,
                label: ind.criteria?.label || `Critère ${ind.criterion_id}`,
                indicators: []
            };
        }
        acc[ind.criterion_id].indicators.push(ind);
        return acc;
    }, {});

    return (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-[20px] flex items-center justify-center shadow-sm border border-indigo-100/50">
                        <Video className="h-7 w-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Gestionnaire Marque Blanche</h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">
                            Personnalisez les vidéos de cours
                        </p>
                    </div>
                </div>

                <div className="flex bg-gray-50 p-1.5 rounded-[20px] border border-gray-100 w-full sm:w-auto overflow-x-auto">
                    {[
                        { id: 'initial', label: 'AUDIT INITIAL' },
                        { id: 'surveillance', label: 'SURVEILLANCE' },
                        { id: 'renouvellement', label: 'RENOUVELLEMENT' }
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => {
                                setAuditType(type.id);
                                setActiveCriterion(null);
                                setActiveIndicator(null);
                                updateUrl({ audit: type.id, crit: '', ind: '' });
                            }}
                            className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2.5 rounded-[14px] text-[10px] font-black tracking-widest transition-all ${
                                auditType === type.id 
                                    ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeCriterion && (
                <div className="mb-10 bg-indigo-50/40 border border-indigo-100/50 rounded-[28px] p-8 relative animate-in slide-in-from-top-4 duration-300">
                    <button 
                        onClick={() => { 
                            setActiveCriterion(null); 
                            setActiveIndicator(null); 
                            updateUrl({ crit: '', ind: '' });
                        }} 
                        className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-white transition-all shadow-sm"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-full uppercase tracking-tighter shadow-sm">
                            {auditType.toUpperCase()}
                        </span>
                        <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3">
                            <PlayCircle className="h-4 w-4" />
                            Critère {activeCriterion.id} : <span className="text-indigo-900 font-black">{activeCriterion.label}</span>
                        </h3>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8 bg-white/40 p-2 rounded-[20px] border border-indigo-100/50">
                        {activeCriterion.indicators.map(ind => {
                            const res = resources[ind.id];
                            const hasCustom = res && res.source_type !== 'default';
                            const isCurrent = activeIndicator?.id === ind.id;
                            
                            return (
                                <button
                                    key={ind.id}
                                    onClick={() => handleEditIndicator(ind)}
                                    className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all flex items-center gap-2 ${
                                        isCurrent 
                                            ? 'bg-indigo-600 text-white shadow-lg' 
                                            : 'bg-transparent text-gray-400 hover:text-indigo-600'
                                    }`}
                                >
                                    {ind.code}
                                    {hasCustom && <div className={`h-1.5 w-1.5 rounded-full ${isCurrent ? 'bg-white' : 'bg-emerald-500'}`} />}
                                </button>
                            );
                        })}
                    </div>
                    
                    {activeIndicator && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-md font-bold text-gray-900">Indicateur {activeIndicator.code} : {activeIndicator.label}</h4>
                                {resources[activeIndicator.id] && !showPreview && (
                                    <button 
                                        onClick={() => setShowPreview(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl text-[11px] font-black border border-indigo-100 shadow-sm hover:bg-indigo-50 transition-all"
                                    >
                                        <Eye className="h-3.5 w-3.5" /> VOIR LA VIDÉO ACTUELLE
                                    </button>
                                )}
                            </div>
                            
                            {showPreview ? (
                                <div className="mb-8 animate-in zoom-in-95 duration-300">
                                    <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                                        <UniversalPlayer 
                                            indicatorId={activeIndicator.id} 
                                            consultantId={currentUserId}
                                            auditType={auditType} 
                                        />
                                        <button 
                                            onClick={() => setShowPreview(false)}
                                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-all"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <p className="text-center text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-widest">Aperçu de la vidéo configurée</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    {[
                                        { id: 'youtube', label: 'Youtube', icon: <LinkIcon className="h-4 w-4" /> },
                                        { id: 'vimeo', label: 'Vimeo', icon: <PlayCircle className="h-4 w-4" /> },
                                        { id: 'upload', label: 'Fichier natif (.mp4)', icon: <Upload className="h-4 w-4" /> },
                                        { id: 'default', label: 'Revenir par défaut', icon: <Trash2 className="h-4 w-4" /> }
                                    ].map(type => (
                                        <label key={type.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${sourceType === type.id ? 'bg-white border-indigo-500 text-indigo-700 shadow-sm' : 'bg-indigo-50/20 border-transparent text-gray-500 hover:bg-white/50'}`}>
                                            <input type="radio" checked={sourceType === type.id} onChange={() => setSourceType(type.id)} className="hidden" />
                                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${sourceType === type.id ? 'border-indigo-500' : 'border-gray-300'}`}>
                                                {sourceType === type.id && <div className="h-2.5 w-2.5 bg-indigo-500 rounded-full" />}
                                            </div>
                                            <span className={`text-[13px] font-bold ${sourceType === type.id ? 'text-indigo-900' : 'text-gray-500'}`}>{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {!showPreview && (sourceType === 'youtube' || sourceType === 'vimeo') && (
                                <div className="mb-8 group">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block ml-1">Lien {sourceType === 'youtube' ? 'Youtube' : 'Vimeo'}</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input type="url" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-gray-900" />
                                    </div>
                                </div>
                            )}

                            {!showPreview && sourceType === 'upload' && (
                                <div className="mb-8">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block ml-1">Fichier .mp4</label>
                                    <input type="file" accept='video/mp4' ref={fileInputRef} onChange={e => setFile(e.target.files[0])} className="hidden" />
                                    <div onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between px-6 py-5 bg-white border border-indigo-100 text-indigo-700 font-bold rounded-2xl hover:shadow-md transition-all cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                                                <Upload className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black truncate max-w-[300px]">
                                                    {file ? file.name : (resources[activeIndicator.id]?.file_path ? "Remplacer le fichier actuel" : "Choisir un fichier .mp4")}
                                                </span>
                                                <span className="text-[9px] text-gray-400 font-bold">Limite : 200 Mo</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-400 uppercase">Parcourir</span>
                                    </div>
                                    {uploadProgress > 0 && uploadProgress < 100 && (
                                        <div className="mt-4 bg-white/50 rounded-full h-3 p-0.5 border border-indigo-100 overflow-hidden">
                                          <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!showPreview && (
                                <div className="flex justify-end pt-2">
                                    <button onClick={handleSave} disabled={isSaving} className={`flex items-center gap-3 px-10 py-4 font-black text-sm rounded-2xl transition-all shadow-xl disabled:opacity-50 ${isSaving ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}>
                                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-4" />}
                                        Sauvegarder pour {activeIndicator.code}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                {Object.values(groupedIndicators).map(crit => {
                    const hasCustomInCriterion = crit.indicators.some(ind => resources[ind.id] && resources[ind.id].source_type !== 'default');
                    const isActive = activeIndicator?.criterion_id === crit.id;
                    
                    return (
                        <div key={crit.id} className={`flex justify-between items-center p-6 rounded-[28px] border transition-all duration-300 ${isActive ? 'bg-indigo-600 border-indigo-600 shadow-xl ring-4 ring-indigo-50' : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-lg'}`}>
                            <div className="flex items-center gap-6 overflow-hidden text-left">
                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                    C{crit.id}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`text-md font-black truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>{crit.label}</span>
                                        {hasCustomInCriterion && !isActive && (
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">Personnalisé</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-[12px] font-medium ${isActive ? 'text-indigo-100 opacity-90' : 'text-gray-400'}`}>{crit.indicators.length} indicateurs</p>
                                        <span className={`h-1 w-1 rounded-full ${isActive ? 'bg-white/40' : 'bg-gray-200'}`} />
                                        <p className={`text-[12px] font-bold ${isActive ? 'text-white/80' : 'text-indigo-500'}`}>{auditType.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 flex-shrink-0">
                                <button onClick={() => handleEditCriterion(crit)} className={`px-8 py-3 text-xs font-black rounded-2xl border uppercase tracking-wider ${isActive ? 'bg-white text-indigo-600 border-transparent shadow-md' : 'bg-indigo-50/50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm'}`}>
                                    {isActive ? 'Configuration' : 'Gérer'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <StatusModal {...statusModal} onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))} />
        </div>
    );
}
