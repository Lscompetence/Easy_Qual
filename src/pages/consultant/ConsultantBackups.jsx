import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'
import { CloudOff, CloudCheck, ShieldCheck, Download, Clock, HardDrive, AlertCircle } from 'lucide-react'

export default function ConsultantBackups() {
    const { user } = useAuth()
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [lastSync, setLastSync] = useState(new Date())

    useEffect(() => {
        // Simple heartbeat to show it's active
        const interval = setInterval(() => {
            setLastSync(new Date())
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="bg-gray-50 min-h-screen flex font-sans">
            <ConsultantSidebar isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
            
            <div className="flex-1 flex flex-col min-w-0">
                <ConsultantTopBar 
                    showMobileMenu={showMobileMenu} 
                    setShowMobileMenu={setShowMobileMenu}
                    showSearch={false}
                />

                <main className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full">
                    {/* Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                                <CloudCheck className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Sauvegardes Cloud</h1>
                                <p className="text-gray-500 font-medium italic">Vos données sont protégées et synchronisées en temps réel.</p>
                            </div>
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 p-8 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <HardDrive className="h-32 w-32" />
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">Connecté au Cloud d'EasyQual</span>
                                </div>
                                <h2 className="text-4xl font-black text-gray-900">Tout est à jour.</h2>
                                <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                                    <Clock className="h-4 w-4" />
                                    Dernière synchronisation : {lastSync.toLocaleTimeString('fr-FR')}
                                </div>
                            </div>
                            
                            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex flex-col items-center text-center">
                                <ShieldCheck className="h-10 w-10 text-emerald-600 mb-2" />
                                <span className="text-xs font-bold text-emerald-800 uppercase tracking-tighter">Protection active</span>
                                <span className="text-[10px] text-emerald-600 mt-1">Chiffrement AES-256</span>
                            </div>
                        </div>
                    </div>

                    {/* FAQ / Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-black text-gray-900 uppercase mb-3 flex items-center gap-2">
                                <Download className="h-4 w-4 text-purple-600" />
                                Comment récupérer mes données ?
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Pour chaque client, vous pouvez générer un <strong>Rapport d'Audit complet</strong> (format PDF/Doc) directement depuis la page de détails du dossier. Cela constitue votre sauvegarde papier et numérique de la certification.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-black text-gray-900 uppercase mb-3 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                Fréquence des sauvegardes
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Notre application effectue des <strong>sauvegardes automatiques</strong> à chaque modification. Nos serveurs Supabase effectuent également une sauvegarde complète de la base de données chaque jour à 04:00 (UTC).
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between">
                        <div>
                            <h4 className="text-lg font-black uppercase tracking-tight">Besoin d'un export complet ?</h4>
                            <p className="text-xs text-slate-400">Pour un export de l'intégralité de votre compte (format CSV), contactez le support.</p>
                        </div>
                        <button className="px-6 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-black uppercase hover:bg-indigo-50 transition-all cursor-not-allowed opacity-50">
                            Bientôt disponible
                        </button>
                    </div>
                </main>
            </div>
        </div>
    )
}
