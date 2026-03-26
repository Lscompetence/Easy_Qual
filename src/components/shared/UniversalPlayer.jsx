import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { supabase } from '../../supabaseClient';
import { Loader2 } from 'lucide-react';

export default function UniversalPlayer({ indicatorId, consultantId, fallbackVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4" }) {
    const [loading, setLoading] = useState(true);
    const [resource, setResource] = useState(null);
    const [signedUrl, setSignedUrl] = useState(null);

    useEffect(() => {
        if (!indicatorId) return;

        const fetchResource = async () => {
            setLoading(true);
            try {
                // 1. Fetch from consultant_resources
                let query = supabase.from('consultant_resources').select('*').eq('indicator_id', indicatorId);
                
                // If the user watches this, client sees their consultant's automatically via RLS.
                if (consultantId) {
                    query = query.eq('consultant_id', consultantId);
                }

                const { data, error } = await query.single();
                
                if (error && error.code !== 'PGRST116') {
                    console.error("Erreur chargement ressource:", error);
                }
                
                if (data) {
                    setResource(data);
                    // 2. If it's an uploaded file, we need a signed URL (expiration 1h)
                    if (data.source_type === 'upload' && data.file_path) {
                        const { data: signData, error: signError } = await supabase.storage
                            .from('consultant-assets')
                            .createSignedUrl(data.file_path, 3600); // 1 hour expiration
                            
                        if (signError) throw signError;
                        setSignedUrl(signData.signedUrl);
                    }
                } else {
                    setResource(null);
                }
            } catch (err) {
                console.error("Erreur UniversalPlayer:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResource();
    }, [indicatorId, consultantId]);

    if (loading) {
        return (
            <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative shadow-lg border border-gray-800/20">
                <Loader2 className="h-8 w-8 text-white animate-spin opacity-50" />
            </div>
        );
    }

    // Fallback: Default AI video if no custom resource setup by consultant
    if (!resource || resource.source_type === 'default') {
        return (
            <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative shadow-lg">
                <video
                    controls
                    controlsList="nodownload"
                    className="w-full h-full object-cover"
                    src={fallbackVideoUrl}
                    poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200"
                />
                <div className="absolute top-3 left-3 bg-black/60 text-white/90 text-[10px] px-2.5 py-1 rounded font-mono uppercase tracking-wider backdrop-blur-sm border border-white/10">
                    Vidéo par défaut (IA Neutre)
                </div>
            </div>
        );
    }

    // Option 1: Native HTML5 Video for uploads (controlsList="nodownload")
    if (resource.source_type === 'upload' && signedUrl) {
        return (
            <div className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-lg">
                <video 
                    controls 
                    controlsList="nodownload"
                    className="w-full h-full"
                    src={signedUrl}
                    preload="metadata"
                />
                <div className="absolute top-3 left-3 bg-[#7c3aed]/80 text-white text-[10px] px-2.5 py-1 rounded font-mono uppercase tracking-wider backdrop-blur-sm border border-white/20">
                    Vidéo Consultant (Marque Blanche)
                </div>
            </div>
        );
    }

    // Option 2: React Player for External embedded sources (Youtube/Vimeo)
    if (resource.source_type === 'youtube' || resource.source_type === 'vimeo') {
        return (
            <div className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-lg">
                <ReactPlayer 
                    url={resource.url} 
                    width="100%" 
                    height="100%" 
                    controls={true}
                    config={{
                        youtube: { playerVars: { showinfo: 1 } },
                        vimeo: { playerOptions: { byline: false, portrait: false } }
                    }}
                />
                <div className="absolute top-3 left-3 bg-[#7c3aed]/80 text-white text-[10px] px-2.5 py-1 rounded font-mono uppercase tracking-wider backdrop-blur-sm border border-white/20 z-10 pointer-events-none">
                    Extrait Consultant (Marque Blanche)
                </div>
            </div>
        );
    }

    return null;
}
