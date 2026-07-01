import fs from 'fs';

let content = fs.readFileSync('src/pages/client/ClientDashboard.jsx', 'utf-8');

if (!content.includes('generateEmargementPDF')) {
    content = content.replace("import { ChevronRight, LayoutDashboard, Folder, MessageSquare, Video, LogOut, CheckCircle, FileText, Bell, Clock, Search, ExternalLink, Calendar, Menu, X, PlayCircle, Lock, Target, Plus, Upload, Trash2, Settings, User, Eye, ArrowUpRight, Copy, Info, Check, CircleOff } from 'lucide-react';",
                              "import { ChevronRight, LayoutDashboard, Folder, MessageSquare, Video, LogOut, CheckCircle, FileText, Bell, Clock, Search, ExternalLink, Calendar, Menu, X, PlayCircle, Lock, Target, Plus, Upload, Trash2, Settings, User, Eye, ArrowUpRight, Copy, Info, Check, CircleOff, Download } from 'lucide-react';\nimport { generateEmargementPDF } from '../../utils/pdfExport.js';");
}

const oldEmargementBlockRegex = /\{\/\*\s*Emargement Block\s*\*\/\}[\s\S]*?(?=\<\/\div\>\s*\)\)\}\s*\<\/div\>)/m;

const newEmargementBlock = `{/* Emargement Block */}
                                                <div className="w-full xl:w-80 flex flex-col gap-4 bg-gray-50/80 p-5 rounded-2xl border border-gray-100 xl:border-l xl:border-gray-100">
                                                    {event.consultant_signature && event.client_signature && (
                                                        <button
                                                            onClick={() => generateEmargementPDF(event, myCase)}
                                                            className="w-full px-4 py-2.5 bg-white text-[#cc6d3e] text-xs font-bold rounded-xl border border-[#cc6d3e]/20 hover:bg-[#faf1ec] transition-colors shadow-sm flex items-center justify-center gap-2 mb-2"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            Exporter en PDF
                                                        </button>
                                                    )}
                                                    
                                                    {/* Consultant Signature (Read-only for Client) */}
                                                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                                        <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100">
                                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Émargement Consultant</p>
                                                        </div>
                                                        <div className="p-4">
                                                            {event.consultant_signature ? (
                                                                <div className="border-2 border-emerald-100 rounded-xl p-3 bg-emerald-50/30">
                                                                    <div className="flex items-center gap-2 text-emerald-600 font-black mb-2 text-xs">
                                                                        <CheckCircle className="h-4 w-4" /> ÉMARGÉ
                                                                    </div>
                                                                    <div className="text-[11px] text-emerald-900 space-y-1 mb-3 font-medium">
                                                                        <p><span className="text-emerald-700/70 font-bold">Nom :</span> {event.consultant_signature_name || 'Consultant'}</p>
                                                                        <p><span className="text-emerald-700/70 font-bold">Date :</span> {new Date(event.consultant_signature_date || event.event_date).toLocaleDateString('fr-FR')}</p>
                                                                        <p><span className="text-emerald-700/70 font-bold">Horaires :</span> {event.actual_start_time || 'N/A'} - {event.actual_end_time || 'N/A'}</p>
                                                                    </div>
                                                                    <div className="bg-white rounded-lg p-2 border border-emerald-100 shadow-sm">
                                                                        <img src={event.consultant_signature} alt="Signature" className="h-12 w-full object-contain" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center text-center py-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                                                                    <Clock className="h-6 w-6 text-gray-300 mb-2" />
                                                                    <p className="text-[11px] text-gray-400 font-bold px-4">En attente de l'émargement du consultant</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Client Signature (Actionable) */}
                                                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                                        <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100">
                                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Émargement Bénéficiaire</p>
                                                        </div>
                                                        <div className="p-4">
                                                            {event.client_signature ? (
                                                                <div className="border-2 border-emerald-100 rounded-xl p-3 bg-emerald-50/30">
                                                                    <div className="flex items-center gap-2 text-emerald-600 font-black mb-2 text-xs">
                                                                        <CheckCircle className="h-4 w-4" /> ÉMARGÉ
                                                                    </div>
                                                                    <div className="text-[11px] text-emerald-900 space-y-1 mb-3 font-medium">
                                                                        <p><span className="text-emerald-700/70 font-bold">Nom :</span> {event.client_signature_name || 'Bénéficiaire'}</p>
                                                                        <p><span className="text-emerald-700/70 font-bold">Date :</span> {new Date(event.client_signature_date || event.event_date).toLocaleDateString('fr-FR')}</p>
                                                                        <p><span className="text-emerald-700/70 font-bold">Horaires :</span> {event.actual_start_time || 'N/A'} - {event.actual_end_time || 'N/A'}</p>
                                                                    </div>
                                                                    <div className="bg-white rounded-lg p-2 border border-emerald-100 shadow-sm">
                                                                        <img src={event.client_signature} alt="Signature" className="h-12 w-full object-contain" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center text-center py-6">
                                                                    <button 
                                                                        onClick={() => { setSignatureEventId(event.id); setShowSignatureModal(true); }}
                                                                        className="px-4 py-2.5 bg-slate-900 text-white text-[11px] uppercase tracking-wider font-black rounded-xl shadow-md hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:translate-y-0 w-full"
                                                                    >
                                                                        Émarger ma présence
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>`;

content = content.replace(oldEmargementBlockRegex, newEmargementBlock);

fs.writeFileSync('src/pages/client/ClientDashboard.jsx', content, 'utf-8');
console.log('ClientDashboard updated successfully');
