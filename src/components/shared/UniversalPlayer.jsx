import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Loader2, AlertCircle } from 'lucide-react';

const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
};

const getVimeoId = (url) => {
    if (!url) return null;
    const regExp = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
};


export default function UniversalPlayer({ indicatorId, consultantId, auditType = 'initial', fallbackVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4" }) {
    const [loading, setLoading] = useState(true);
    const [resource, setResource] = useState(null);
    const [signedUrl, setSignedUrl] = useState(null);
    const [error, setError] = useState(null);

    const normalizeAudit = (type) => {
        const t = String(type || '').toLowerCase().trim()
        if (t.includes('initial')) return 'initial'
        if (t.includes('surveillance')) return 'surveillance'
        if (t.includes('renouvellement')) return 'renouvellement'
        return t
    }

    const getBadgeColors = (type) => {
        const t = String(type || '').toLowerCase();
        if (t.includes('initial')) return 'bg-[#fdf6f0] text-[#cc6d3e] border-[#cc6d3e]/20';
        if (t.includes('surveillance')) return 'bg-[#f0f7ff] text-[#2563eb] border-[#2563eb]/20';
        if (t.includes('renouvellement')) return 'bg-[#f0fdf4] text-[#16a34a] border-[#16a34a]/20';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    useEffect(() => {
        if (!indicatorId) return;

        const fetchResource = async () => {
            setLoading(true);
            setError(null);
            setSignedUrl(null);
            try {
                const normAudit = normalizeAudit(auditType);

                
                const { data, error: fetchError } = await supabase
                    .from('consultant_resources')
                    .select('id, consultant_id, indicator_id, audit_type, resource_type, source_type, file_path, url')
                    .eq('indicator_id', indicatorId)
                    .eq('audit_type', normAudit)
                    .eq('resource_type', 'video')
                    .eq('consultant_id', consultantId)
                    .maybeSingle();
                if (fetchError) throw fetchError;
                
                if (data) {
                    setResource(data);
                    if (data.source_type === 'upload' && data.file_path) {

                        const { data: signData, error: signError } = await supabase.storage
                            .from('consultant-assets')
                            .createSignedUrl(data.file_path, 3600);
                            
                        if (signError) {
                            console.error("[UniversalPlayer] Sign Error Details:", signError);
                            // If sign error is "Object not found", it means path in DB is wrong
                            throw new Error(signError.message === "Object not found" ? `Fichier introuvable dans le stockage (${data.file_path})` : signError.message);
                        }
                        setSignedUrl(signData.signedUrl);
                    }
                } else {
                    setResource(null);
                }
            } catch (err) {
                console.error("[UniversalPlayer] Logic Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchResource();
    }, [indicatorId, consultantId, auditType]);

    if (loading) {
        return (
            <div className="bg-slate-900 rounded-[2rem] overflow-hidden aspect-video flex items-center justify-center relative shadow-2xl border border-white/5">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!resource || resource.source_type === 'default') {
        return (
            <div className="bg-slate-900 rounded-[2rem] overflow-hidden aspect-video relative shadow-2xl group">
                <video
                    controls
                    controlsList="nodownload"
                    className="w-full h-full object-cover opacity-80"
                    src={fallbackVideoUrl}
                    poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200"
                />
                <div className="absolute top-6 left-6 bg-slate-900/80 text-white text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-widest backdrop-blur-xl border border-white/10 ring-1 ring-black/20">
                    Vidéo par défaut (IA Neutre)
                </div>
            </div>
        );
    }

    if (resource.source_type === 'upload' && signedUrl) {
        return (
            <div className="bg-black rounded-[2rem] overflow-hidden aspect-video relative shadow-2xl border border-white/10">
                <video 
                    controls 
                    controlsList="nodownload"
                    className="w-full h-full"
                    src={signedUrl}
                    preload="metadata"
                />
                <div className={`absolute top-6 left-6 font-poppins text-[10px] px-4 py-2 rounded-full font-bold uppercase tracking-widest shadow-xl border ${getBadgeColors(auditType)}`}>
                    Vidéo Consultant ({auditType.toUpperCase()})
                </div>
            </div>
        );
    }

    if (resource.source_type === 'youtube') {
        const videoId = getYoutubeId(resource.url);
        if (videoId) {
            return (
                <div className="bg-black rounded-[2rem] overflow-hidden aspect-video relative shadow-2xl border border-white/10">
                    <iframe 
                        width="100%" height="100%" 
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`}
                        title="YouTube player" frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen className="w-full h-full"
                    ></iframe>
                    <div className={`absolute top-6 left-6 font-poppins text-[10px] px-4 py-2 rounded-full font-bold uppercase tracking-widest shadow-xl border ${getBadgeColors(auditType)}`}>
                        EXTRAIT {auditType.toUpperCase()}
                    </div>
                </div>
            );
        }
    }

    if (resource.source_type === 'vimeo') {
        const videoId = getVimeoId(resource.url);
        if (videoId) {
            return (
                <div className="bg-black rounded-[2rem] overflow-hidden aspect-video relative shadow-2xl border border-white/10">
                    <iframe 
                        src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479`} 
                        width="100%" height="100%" 
                        frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" 
                        allowFullScreen title="Vimeo player"
                        className="w-full h-full"
                    ></iframe>
                    <div className={`absolute top-6 left-6 font-poppins text-[10px] px-4 py-2 rounded-full font-bold uppercase tracking-widest shadow-xl border ${getBadgeColors(auditType)}`}>
                        VIMEO {auditType.toUpperCase()}
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="bg-slate-900 rounded-[2rem] overflow-hidden aspect-video flex flex-col items-center justify-center relative shadow-2xl border border-white/5 p-12 text-center text-slate-400">
            <AlertCircle className="h-10 w-10 mb-4 opacity-20 text-red-500" />
            <p className="text-sm font-bold uppercase tracking-widest text-white">Contenu non disponible</p>
            <p className="text-xs mt-2 opacity-60">
                {error ? `Erreur: ${error}` : "La ressource n'a pas pu être chargée."}
            </p>
            <p className="text-[8px] mt-4 opacity-20 font-mono">
                ID: {indicatorId} | Audit: {auditType} | Path: {resource?.file_path || 'N/A'}
            </p>
        </div>
    );
}
