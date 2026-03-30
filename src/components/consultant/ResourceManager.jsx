import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Video, Upload, Link as LinkIcon, Save, CheckCircle, Trash2, X, AlertCircle, Loader2, PlayCircle } from 'lucide-react';
import StatusModal from '../shared/StatusModal';

export default function ResourceManager() {
    const [auditType, setAuditType] = useState('initial');
    const [indicators, setIndicators] = useState([]);
    const [resources, setResources] = useState({});
    const [loading, setLoading] = useState(true);
    
    // Selection state
    const [activeCriterion, setActiveCriterion] = useState(null);
    const [activeIndicator, setActiveIndicator] = useState(null);
    
    // Form state
    const [sourceType, setSourceType] = useState('youtube');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    
    // Status Modal State
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
            // Fetch all indicators with their criterion info
            const { data: indData } = await supabase
                .from('indicators')
                .select('id, label, code, criterion_id, criteria(label)')
                .order('id', { ascending: true });
            setIndicators(indData || []);

            // Fetch current consultant's resources for the specific audit type
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: resData } = await supabase
                    .from('consultant_resources')
                    .select('*')
                    .eq('consultant_id', user.id)
                    .eq('resource_type', 'video')
                    .eq('audit_type', auditType);
                
                const resMap = {};
                resData?.forEach(r => { resMap[r.indicator_id] = r; });
                setResources(resMap);

                // If an indicator is active, update form values
                if (activeIndicator) {
                    const existing = resMap[activeIndicator.id];
                    if (existing) {
                        setSourceType(existing.source_type);
                        setUrl(existing.url || '');
                    } else {
                        setSourceType('youtube');
                        setUrl('');
                    }
                }
            }
        } catch (error) {
            console.error("Erreur fetchData:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditCriterion = (crit) => {
        setActiveCriterion(crit);
        // Default to first indicator of this criterion
        handleEditIndicator(crit.mainIndicator);
    };

    const handleEditIndicator = (ind) => {
        setActiveIndicator(ind);
        const existing = resources[ind.id];
        if (existing) {
            setSourceType(existing.source_type);
            setUrl(existing.url || '');
            setFile(null);
        } else {
            setSourceType('youtube');
            setUrl('');
            setFile(null);
        }
        setUploadProgress(0);
    };

    const handleSave = async () => {
        if (!activeIndicator) return;
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Non authentifié");
            
            const consultantId = user.id;
            let filePath = null;

            // Handle File Upload if selected
            if (sourceType === 'upload' && file) {
                if (file.size > 200 * 1024 * 1024) throw new Error("Fichier trop volumineux (Max 200Mo)");
                setUploadProgress(10);
                
                const ext = file.name.split('.').pop();
                filePath = `${consultantId}/video/${auditType}_${activeIndicator.id}_${Date.now()}.${ext}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('consultant-assets')
                    .upload(filePath, file, { cacheControl: '3600', upsert: true });
                
                if (uploadError) throw uploadError;
                setUploadProgress(100);
            }

            // Save for the selected indicator AND specific audit type
            const payload = {
                consultant_id: consultantId,
                indicator_id: activeIndicator.id,
                resource_type: 'video',
                audit_type: auditType,
                source_type: sourceType,
                url: sourceType === 'youtube' ? url : null,
                file_path: sourceType === 'upload' ? (filePath || resources[activeIndicator.id]?.file_path) : null,
                updated_at: new Date().toISOString()
            };
            
            // Upsert single row to DB - including audit_type in conflict detection
            const { error: dbError } = await supabase
                .from('consultant_resources')
                .upsert(payload, { onConflict: 'consultant_id,indicator_id,resource_type,audit_type' });

            if (dbError) throw dbError;

            await fetchData(); // Refresh all
            // Keep the criterion panel open but showing updated data
            const updatedInd = indicators.find(i => i.id === activeIndicator.id);
            setActiveIndicator(updatedInd);
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

    const handleDelete = (indicatorId) => {
        setStatusModal({
            isOpen: true,
            type: 'delete',
            title: 'Supprimer cette vidéo ?',
            message: `Cette vidéo sera réinitialisée pour l'${auditType === 'initial' ? 'Audit Initial' : auditType === 'surveillance' ? 'Audit de Surveillance' : 'Audit de Renouvellement'} spécifiquement.`,
            confirmText: 'Confirmer',
            cancelText: 'Annuler',
            onConfirm: async () => {
                setStatusModal(prev => ({ ...prev, isLoading: true }));
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    
                    const { error } = await supabase
                        .from('consultant_resources')
                        .delete()
                        .eq('consultant_id', user.id)
                        .eq('indicator_id', indicatorId)
                        .eq('resource_type', 'video')
                        .eq('audit_type', auditType);
                        
                    if (error) throw error;
                    await fetchData();
                    setStatusModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
                } catch (error) {
                    console.error(error);
                    setStatusModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    if (loading && indicators.length === 0) return (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-12 text-center">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Chargement des ressources...</p>
        </div>
    );

    return (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-[20px] flex items-center justify-center shadow-sm border border-indigo-100/50">
                        <Video className="h-7 w-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Gestionnaire Marque Blanche</h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">Personnalisez les vidéos de cours pour vos clients (Max 200Mo / .mp4)</p>
                    </div>
                </div>

                {/* Audit Type Selector */}
                <div className="flex bg-gray-50 p-1.5 rounded-[20px] border border-gray-100 self-end md:self-auto">
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
                            }}
                            className={`px-5 py-2.5 rounded-[14px] text-[10px] font-black tracking-widest transition-all ${
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

            {/* Active Configuration Panel */}
            {activeCriterion && (
                <div className="mb-10 bg-indigo-50/40 border border-indigo-100/50 rounded-[28px] p-8 relative animate-in slide-in-from-top-4 duration-300">
                    <button 
                        onClick={() => { setActiveCriterion(null); setActiveIndicator(null); }} 
                        className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-white transition-all shadow-sm"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-full uppercase tracking-tighter shadow-sm">
                            {auditType}
                        </span>
                        <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3">
                            <PlayCircle className="h-4 w-4" />
                            Critère {activeCriterion.id} : <span className="text-indigo-900 font-black">{activeCriterion.label}</span>
                        </h3>
                    </div>

                    {/* Sub-navigation for indicators of this criterion */}
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
                            <h4 className="text-md font-bold text-gray-900 mb-4">{activeIndicator.label}</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {[
                                    { id: 'youtube', label: 'Youtube', icon: <LinkIcon className="h-4 w-4" /> },
                                    { id: 'upload', label: 'Fichier natif (.mp4)', icon: <Upload className="h-4 w-4" /> },
                                    { id: 'default', label: 'Revenir par défaut', icon: <Trash2 className="h-4 w-4" /> }
                                ].map(type => (
                                    <label 
                                        key={type.id} 
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                                            sourceType === type.id 
                                                ? 'bg-white border-indigo-500 text-indigo-700 shadow-sm' 
                                                : 'bg-indigo-50/20 border-transparent text-gray-500 hover:bg-white/50'
                                        }`}
                                    >
                                        <input 
                                            type="radio" 
                                            checked={sourceType === type.id} 
                                            onChange={() => setSourceType(type.id)} 
                                            className="hidden" 
                                        />
                                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${sourceType === type.id ? 'border-indigo-500' : 'border-gray-300'}`}>
                                            {sourceType === type.id && <div className="h-2.5 w-2.5 bg-indigo-500 rounded-full" />}
                                        </div>
                                        <span className={`text-[13px] font-bold ${sourceType === type.id ? 'text-indigo-900' : 'text-gray-500'}`}>{type.label}</span>
                                    </label>
                                ))}
                            </div>

                            {sourceType === 'youtube' && (
                                <div className="mb-8 group">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block ml-1">Lien de la vidéo Youtube</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input 
                                            type="url" 
                                            placeholder="https://www.youtube.com/watch?v=..." 
                                            value={url} 
                                            onChange={e => setUrl(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all font-medium text-gray-900"
                                        />
                                    </div>
                                </div>
                            )}

                            {sourceType === 'upload' && (
                                <div className="mb-8">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block ml-1">Fichier de cours personnalisé</label>
                                    <input 
                                        type="file" 
                                        accept="video/mp4"
                                        ref={fileInputRef}
                                        onChange={e => setFile(e.target.files[0])}
                                        className="hidden"
                                    />
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full flex items-center justify-between px-6 py-5 bg-white border border-indigo-100 text-indigo-700 font-bold rounded-2xl hover:bg-white hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                                                <Upload className="h-5 w-5" />
                                            </div>
                                            <span className="text-sm font-black truncate max-w-[300px]">
                                                {file ? file.name : (resources[activeIndicator.id]?.file_path ? "Remplacer le fichier actuel" : "Choisir une vidéo .mp4")}
                                            </span>
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

                            <div className="flex justify-end pt-2">
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    className={`flex items-center gap-3 px-10 py-4 font-black text-sm rounded-2xl transition-all shadow-xl disabled:opacity-50 ${
                                        isSaving ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] shadow-indigo-200'
                                    }`}
                                >
                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-4" />}
                                    Sauvegarder pour {activeIndicator.code} ({auditType === 'initial' ? 'Initial' : auditType === 'surveillance' ? 'Surveillance' : 'Renouvellement'})
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Criteria Navigation List */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                {Object.values(indicators.reduce((acc, ind) => {
                    if (!acc[ind.criterion_id]) {
                        acc[ind.criterion_id] = {
                            id: ind.criterion_id,
                            label: ind.criteria?.label || `Critère ${ind.criterion_id}`,
                            indicators: [],
                            mainIndicator: ind // Use first as reference
                        };
                    }
                    acc[ind.criterion_id].indicators.push(ind);
                    return acc;
                }, {})).map(crit => {
                    // Check if ANY indicator in this criterion has custom for CURRENT audit type
                    const hasCustomInCriterion = crit.indicators.some(ind => resources[ind.id] && resources[ind.id].source_type !== 'default');
                    const isActive = activeIndicator?.criterion_id === crit.id;
                    
                    return (
                        <div 
                            key={crit.id} 
                            className={`flex justify-between items-center p-6 rounded-[28px] border transition-all duration-300 ${
                                isActive 
                                    ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100 ring-4 ring-indigo-50' 
                                    : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-lg'
                            }`}
                        >
                            <div className="flex items-center gap-6 overflow-hidden">
                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-sm transition-all flex-shrink-0 ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-100/50'
                                }`}>
                                    C{crit.id}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`text-md font-black truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                                            {crit.label}
                                        </span>
                                        {hasCustomInCriterion && !isActive && (
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                                                Personnalisé
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-[12px] font-medium transition-opacity ${isActive ? 'text-indigo-100 opacity-90' : 'text-gray-400'}`}>
                                            {crit.indicators.length} indicateurs associés
                                        </p>
                                        <span className={`h-1 w-1 rounded-full ${isActive ? 'bg-white/40' : 'bg-gray-200'}`} />
                                        <p className={`text-[12px] font-bold ${isActive ? 'text-white/80' : 'text-indigo-500'}`}>
                                            {auditType.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 flex-shrink-0">
                                <button 
                                    onClick={() => handleEditCriterion(crit)}
                                    className={`px-8 py-3 text-xs font-black rounded-2xl transition-all border uppercase tracking-wider ${
                                        isActive 
                                            ? 'bg-white text-indigo-600 border-transparent shadow-md' 
                                            : 'bg-indigo-50/50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm'
                                    }`}
                                >
                                    {isActive ? 'Configuration' : 'Gérer'}
                                </button>
                                {hasCustomInCriterion && !isActive && (
                                    <button 
                                        onClick={() => handleDelete(crit.mainIndicator.id)} 
                                        className="p-3.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                                        title="Réinitialiser"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Status Modal Container */}
            <StatusModal 
                {...statusModal} 
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))} 
            />
        </div>
    );
}

