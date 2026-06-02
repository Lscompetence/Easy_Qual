import fs from 'fs';

let content = fs.readFileSync('src/pages/consultant/CaseDetails.jsx', 'utf-8');

// We need to add the import for generateEmargementPDF
if (!content.includes('generateEmargementPDF')) {
    content = content.replace("import { Trash2, Plus, AlertCircle, CheckCircle, Clock, Search, ExternalLink, Calendar, Video, Lock, Send, Image as ImageIcon, Copy, MoreHorizontal, MessageSquare, Phone, MapPin, Target, Settings, Building, Map, CreditCard, ChevronDown, Check, X, Eye, Users, SearchIcon, Filter, PlayCircle, BarChart3, Edit2, Play, CircleOff, FileText, Info, ArrowUpRight } from 'lucide-react';",
                              "import { Trash2, Plus, AlertCircle, CheckCircle, Clock, Search, ExternalLink, Calendar, Video, Lock, Send, Image as ImageIcon, Copy, MoreHorizontal, MessageSquare, Phone, MapPin, Target, Settings, Building, Map, CreditCard, ChevronDown, Check, X, Eye, Users, SearchIcon, Filter, PlayCircle, BarChart3, Edit2, Play, CircleOff, FileText, Info, ArrowUpRight, Download } from 'lucide-react';\nimport { generateEmargementPDF } from '../../utils/pdfExport.js';");
}


// Replacing the Emargement Block inside event rendering
const oldEmargementBlockRegex = /\{\/\*\s*Emargement Block\s*\*\/\}[\s\S]*?(?=\<\/\div\>\s*\)\;\s*\}\)\}\s*\<\/div\>)/m;

const newEmargementBlock = `{/* Emargement Block */}
                                                    {(event.event_type === 'meeting' || event.visio_link) && (
                                                        <div className="mt-6 flex flex-col lg:flex-row gap-6 border-t border-gray-100 pt-6">
                                                            {/* Event Left Content Spacer (if needed) or keep it full width if above. Actually, let's reorganize it to look like the mockup */}
                                                            <div className="flex-1">
                                                                {/* Event details moved here? The title and stuff is above. Let's keep it as is, just the right column for signatures */}
                                                                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                                                                    <p className="text-sm text-blue-900 font-medium">Les émargements des deux parties (Consultant et Bénéficiaire) sont requis pour valider officiellement cette séance.</p>
                                                                    {event.consultant_signature && event.client_signature && (
                                                                        <button
                                                                            onClick={() => generateEmargementPDF(event, caseData)}
                                                                            className="mt-3 px-4 py-2 bg-white text-blue-700 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2"
                                                                        >
                                                                            <Download className="h-4 w-4" />
                                                                            Exporter la feuille d'émargement PDF
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Signatures Column */}
                                                            <div className="w-full lg:w-80 flex flex-col gap-4 bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                                                                {/* Consultant Signature */}
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
                                                                            <div className="flex flex-col items-center justify-center text-center py-6">
                                                                                <button 
                                                                                    onClick={() => { setSignatureEventId(event.id); setShowSignatureModal(true); }}
                                                                                    className="px-4 py-2.5 bg-[#1e293b] text-white text-[11px] uppercase tracking-wider font-black rounded-xl shadow-md hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:translate-y-0 w-full"
                                                                                >
                                                                                    Émarger ma présence
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Client Signature */}
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
                                                                            <div className="flex flex-col items-center justify-center text-center py-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                                                                                <Clock className="h-6 w-6 text-gray-300 mb-2" />
                                                                                <p className="text-[11px] text-gray-400 font-bold px-4">En attente de l'émargement du bénéficiaire</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>`;

content = content.replace(oldEmargementBlockRegex, newEmargementBlock);

fs.writeFileSync('src/pages/consultant/CaseDetails.jsx', content, 'utf-8');
console.log('CaseDetails updated successfully');
