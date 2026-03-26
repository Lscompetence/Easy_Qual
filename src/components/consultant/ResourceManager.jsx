import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Video, Upload, Link as LinkIcon, Save, CheckCircle, Trash2, X, AlertCircle } from 'lucide-react';

export default function ResourceManager() {
    const [indicators, setIndicators] = useState([]);
    const [resources, setResources] = useState({});
    const [loading, setLoading] = useState(true);
    
    // Form state for current editing indicator
    const [activeIndicator, setActiveIndicator] = useState(null);
    const [sourceType, setSourceType] = useState('youtube');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all 32 indicators
            const { data: indData } = await supabase.from('indicators').select('id, label, code').order('id');
            setIndicators(indData || []);

            // Fetch current consultant's resources
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
                const { data: resData } = await supabase
                    .from('consultant_resources')
                    .select('*')
                    .eq('consultant_id', userData.user.id)
                    .eq('resource_type', 'video');
                
                const resMap = {};
                resData?.forEach(r => { resMap[r.indicator_id] = r; });
                setResources(resMap);
            }
        } catch (error) {
            console.error("Erreur fetchData:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (ind) => {
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
            const { data: userData } = await supabase.auth.getUser();
            const consultantId = userData.user.id;
            let filePath = null;

            // Handle File Upload if selected
            if (sourceType === 'upload' && file) {
                if (file.size > 200 * 1024 * 1024) throw new Error("Fichier trop volumineux (Max 200Mo)");
                setUploadProgress(10);
                
                const ext = file.name.split('.').pop();
                filePath = `${consultantId}/video/${activeIndicator.id}_${Date.now()}.${ext}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('consultant-assets')
                    .upload(filePath, file, { cacheControl: '3600', upsert: true });
                
                if (uploadError) throw uploadError;
                setUploadProgress(100);
            }

            // Save to DB
            const payload = {
                consultant_id: consultantId,
                indicator_id: activeIndicator.id,
                resource_type: 'video',
                source_type: sourceType,
                url: sourceType !== 'upload' ? url : null,
                file_path: sourceType === 'upload' ? (filePath || resources[activeIndicator.id]?.file_path) : null,
                updated_at: new Date().toISOString()
            };

            const { error: dbError } = await supabase
                .from('consultant_resources')
                .upsert(payload, { onConflict: 'consultant_id,indicator_id,resource_type' });

            if (dbError) throw dbError;

            await fetchData(); // Refresh data
            setActiveIndicator(null);
        } catch (error) {
            console.error("Erreur de sauvegarde:", error);
            alert(error.message);
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async (indicatorId) => {
        if (!window.confirm("Supprimer cette vidéo personnalisée ?")) return;
        try {
            const { data: userData } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('consultant_resources')
                .delete()
                .eq('consultant_id', userData.user.id)
                .eq('indicator_id', indicatorId)
                .eq('resource_type', 'video');
                
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement des ressources...</div>;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Video className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-gray-900">Gestionnaire Marque Blanche</h2>
                    <p className="text-sm text-gray-500">Personnalisez les vidéos de cours pour vos clients (Max 200Mo / .mp4)</p>
                </div>
            </div>

            {/* Editor Panel */}
            {activeIndicator && (
                <div className="mb-8 p-6 bg-indigo-50/50 border border-indigo-100 rounded-xl relative">
                    <button onClick={() => setActiveIndicator(null)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-white transition-all">
                        <X className="h-5 w-5" />
                    </button>
                    
                    <h3 className="font-bold text-indigo-900 mb-4">
                        Configuration Vidéo - {activeIndicator.code}
                    </h3>
                    
                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                            <input type="radio" checked={sourceType === 'youtube'} onChange={() => setSourceType('youtube')} className="accent-indigo-600" /> Youtube
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                            <input type="radio" checked={sourceType === 'vimeo'} onChange={() => setSourceType('vimeo')} className="accent-indigo-600" /> Vimeo
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                            <input type="radio" checked={sourceType === 'upload'} onChange={() => setSourceType('upload')} className="accent-indigo-600" /> Fichier natif (.mp4)
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                            <input type="radio" checked={sourceType === 'default'} onChange={() => setSourceType('default')} className="accent-indigo-600" /> Revenir par défaut
                        </label>
                    </div>

                    {(sourceType === 'youtube' || sourceType === 'vimeo') && (
                        <div className="mb-4">
                            <input 
                                type="url" 
                                placeholder="https://..." 
                                value={url} 
                                onChange={e => setUrl(e.target.value)}
                                className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    )}

                    {sourceType === 'upload' && (
                        <div className="mb-4">
                            <input 
                                type="file" 
                                accept="video/mp4"
                                ref={fileInputRef}
                                onChange={e => setFile(e.target.files[0])}
                                className="hidden"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-700 font-bold rounded-lg hover:bg-indigo-50 transition-all text-sm"
                            >
                                <Upload className="h-4 w-4" /> {file ? file.name : "Choisir une vidéo .mp4"}
                            </button>
                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                                  <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            )}
                        </div>
                    )}

                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Sauvegarder
                    </button>
                </div>
            )}

            {/* Indicators List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {indicators.map(ind => {
                    const res = resources[ind.id];
                    const hasCustom = res && res.source_type !== 'default';
                    
                    return (
                        <div key={ind.id} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasCustom ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                <span className="text-xs font-bold text-gray-500 w-12">{ind.code}</span>
                                <span className="text-sm font-medium text-gray-800 truncate">{ind.label}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {hasCustom && (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Personnalisé
                                    </span>
                                )}
                                <button 
                                    onClick={() => handleEdit(ind)}
                                    className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                >
                                    Modifier
                                </button>
                                {hasCustom && (
                                    <button onClick={() => handleDelete(ind.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Quick fallback for Loader2 since it wasn't imported from lucide
function Loader2({ className }) {
    return <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
}
