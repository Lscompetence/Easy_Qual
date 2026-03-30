import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { supabase } from '../../supabaseClient';
import { Loader2, AlertCircle } from 'lucide-react';

// Helper to extract YouTube Video ID
const getYoutubeId = (url) => {
    if (!url) return null;
    // Matches: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, etc.
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
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

    useEffect(() => {
        if (!indicatorId) return;

        const fetchResource = async () => {
            setLoading(true);
            setError(null);
            try {
                const normAudit = normalizeAudit(auditType);
                let query = supabase
                    .from('consultant_resources')
                    .select('*')
                    .eq('indicator_id', indicatorId)
                    .eq('audit_type', normAudit);
                
                if (consultantId) {
                    query = query.eq('consultant_id', consultantId);
                }

                const { data, error: fetchError } = await query.maybeSingle();
                
                if (fetchError) throw fetchError;
                
                if (data) {
                    console.log("[UniversalPlayer] Ressource récupérée:", data);
                    setResource(data);

                    if (data.source_type === 'upload' && data.file_path) {
                        const { data: signData, error: signError } = await supabase.storage
                            .from('consultant-assets')
                            .createSignedUrl(data.file_path, 3600);
                            
                        if (signError) throw signError;
                        setSignedUrl(signData.signedUrl);
                    }
                } else {
                    setResource(null);
                }
            } catch (err) {
                console.error("[UniversalPlayer] Erreur:", err);
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

    // FALLBACK: default neutral video
    if (!resource || resource.source_type === 'default' || resource.source_type === 'vimeo') {
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

    // UPLOAD branch
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
                <div className="absolute top-6 left-6 bg-indigo-600 text-white text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-widest shadow-xl border border-white/20 animate-in slide-in-from-left duration-500">
                    Vidéo Consultant ({auditType.toUpperCase()})
                </div>
            </div>
        );
    }

    // YOUTUBE branch - Manually forcing iframe for better reliability
    if (resource.source_type === 'youtube') {
        const videoId = getYoutubeId(resource.url);
        if (videoId) {
            return (
                <div className="bg-black rounded-[2rem] overflow-hidden aspect-video relative shadow-2xl border border-white/10">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`}
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                    <div className="absolute top-6 left-6 bg-indigo-600 text-white text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-widest shadow-xl border border-white/20 pointer-events-none z-10 text-center">
                        EXTRAIT {auditType.toUpperCase()}
                    </div>
                </div>
            );
        }
    }

    // Fallback if URL parsing failed
    return (
        <div className="bg-slate-900 rounded-[2rem] overflow-hidden aspect-video flex flex-col items-center justify-center relative shadow-2xl border border-white/5 p-12 text-center text-slate-400">
            <AlertCircle className="h-10 w-10 mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Contenu non disponible</p>
            <p className="text-xs mt-2 opacity-60">Le lien fourni n'est pas un format YouTube valide pour l'audit {auditType}.</p>
        </div>
    );
}
