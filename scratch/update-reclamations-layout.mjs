import fs from 'fs';

// 1. Update ConsultantReclamations.jsx
let consultantContent = fs.readFileSync('src/pages/consultant/ConsultantReclamations.jsx', 'utf-8');

// Ensure ShieldCheck is imported
if (!consultantContent.includes('ShieldCheck')) {
    consultantContent = consultantContent.replace("import { Plus, History, Trash2, Sparkles, XCircle, AlertCircle } from 'lucide-react'",
                                                  "import { Plus, History, Trash2, Sparkles, XCircle, AlertCircle, ShieldCheck, Mail, Phone, MessageSquare } from 'lucide-react'");
}

const consultantMainRegex = /<main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">([\s\S]*?)<\/main>/;
const newConsultantMain = `<main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Info Panel */}
                    <div className="w-full lg:w-1/3 space-y-6">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <ShieldCheck className="h-32 w-32" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-3">Service Qualité</p>
                                <h1 className="text-3xl font-black mb-4 leading-tight">Réclamation & Signalement</h1>
                                <p className="text-blue-100 text-sm leading-relaxed mb-8">
                                    Une insatisfaction ? Un dysfonctionnement ? Faites-nous en part. L'amélioration continue est au cœur de nos engagements.
                                </p>
                                
                                <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/20">
                                    <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-blue-300" />
                                        Notre engagement
                                    </h2>
                                    <p className="text-blue-50 text-xs leading-relaxed">
                                        Toute réclamation est prise en charge sous 72h. Nous nous engageons à vous apporter une réponse motivée sous 15 jours ouvrés.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">Contact direct</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500">Email</p>
                                        <p className="text-sm font-medium text-gray-900">qualite@easyqual.fr</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500">Téléphone</p>
                                        <p className="text-sm font-medium text-gray-900">01 23 45 67 89</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Content */}
                    <div className="w-full lg:w-2/3">
                        {/* Tabs Navigation */}
                        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100 mb-6">
                            <button
                                onClick={() => setActiveTab('new')}
                                className={\`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all \${
                                    activeTab === 'new' 
                                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                                    : 'text-gray-500 hover:bg-gray-50'
                                }\`}
                            >
                                <Plus className="h-4 w-4" />
                                Nouvelle réclamation
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={\`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all \${
                                    activeTab === 'history' 
                                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                                    : 'text-gray-500 hover:bg-gray-50'
                                }\`}
                            >
                                <History className="h-4 w-4" />
                                Mon Historique
                            </button>
                        </div>

                        {activeTab === 'new' ? (
                            <ReclamationForm user={user} onSuccess={() => setActiveTab('history')} />
                        ) : (
                            <div className="space-y-6">
$1
                            </div>
                        )}
                    </div>
                </main>`;

// Extract the history content from the old main
const historyContentMatch = consultantContent.match(/\{activeTab === 'history' && \(\s*<div className="space-y-6">([\s\S]*?)<\/div>\s*\)\}/);
let historyContent = '';
if (historyContentMatch) {
    historyContent = historyContentMatch[1];
} else {
    // If not found this way, maybe it's just the div inside the conditional
    const altMatch = consultantContent.match(/<div className="space-y-6">\s*\{!\loading && reclamations\.length === 0([\s\S]*?)<\/div>\s*\)\}/);
    if (altMatch) {
        historyContent = '{!loading && reclamations.length === 0' + altMatch[1];
    }
}
// Actually, let's just use a more generic replacement that preserves the history code.
const historyCodeMatch = consultantContent.match(/<div className="space-y-6">([\s\S]*?)<\/main>/);
if (historyCodeMatch) {
    // Need to carefully extract just the history div content.
    // Let's manually write the history part to be safe, it's pretty standard.
}

consultantContent = consultantContent.replace(consultantMainRegex, newConsultantMain.replace('$1', `
                                {/* History Content */}
                                {!loading && reclamations.length === 0 ? (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Sparkles className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Aucune réclamation</h3>
                                        <p className="text-gray-500">Vous n'avez soumis aucune réclamation pour le moment.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {reclamations.map((ticket) => (
                                            <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative group overflow-hidden">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className={\`px-3 py-1 rounded-full text-xs font-bold \${
                                                            ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                            ticket.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                            ticket.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                            'bg-gray-50 text-gray-700 border border-gray-200'
                                                        }\`}>
                                                            {ticket.status === 'resolved' ? 'Résolu' :
                                                             ticket.status === 'rejected' ? 'Rejeté' :
                                                             ticket.status === 'in_progress' ? 'En cours' : 'En attente'}
                                                        </span>
                                                        <span className="text-sm text-gray-500 font-medium">
                                                            {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteTicket(ticket.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors absolute top-4 right-4 md:static opacity-0 group-hover:opacity-100"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <h4 className="text-lg font-bold text-gray-900 mb-2">{ticket.subject}</h4>
                                                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{ticket.description}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs font-medium border border-slate-100">
                                                        <AlertCircle className="h-3.5 w-3.5" />
                                                        {ticket.type}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
`));

fs.writeFileSync('src/pages/consultant/ConsultantReclamations.jsx', consultantContent, 'utf-8');

// 2. Update ClientReclamations.jsx
let clientContent = fs.readFileSync('src/pages/client/ClientReclamations.jsx', 'utf-8');

if (!clientContent.includes('ShieldCheck')) {
    clientContent = clientContent.replace("import { Plus, History, Trash2, Sparkles, XCircle, AlertCircle } from 'lucide-react'",
                                          "import { Plus, History, Trash2, Sparkles, XCircle, AlertCircle, ShieldCheck, Mail, Phone, MessageSquare } from 'lucide-react'");
}

const clientMainRegex = /<main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">([\s\S]*?)<\/main>/;
const newClientMain = `<main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Info Panel */}
                    <div className="w-full lg:w-1/3 space-y-6">
                        <div className="bg-gradient-to-br from-[#cc6d3e] to-[#a8552b] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <ShieldCheck className="h-32 w-32" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-orange-200 text-xs font-bold uppercase tracking-widest mb-3">Service Qualité</p>
                                <h1 className="text-3xl font-black mb-4 leading-tight">Réclamation & Signalement</h1>
                                <p className="text-orange-100 text-sm leading-relaxed mb-8">
                                    Une insatisfaction ? Un dysfonctionnement ? Faites-nous en part. L'amélioration continue est au cœur de nos engagements.
                                </p>
                                
                                <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/20">
                                    <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-orange-200" />
                                        Notre engagement
                                    </h2>
                                    <p className="text-orange-50 text-xs leading-relaxed">
                                        Toute réclamation est prise en charge sous 72h. Nous nous engageons à vous apporter une réponse motivée sous 15 jours ouvrés.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">Contact direct</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#cc6d3e] flex items-center justify-center">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500">Email</p>
                                        <p className="text-sm font-medium text-gray-900">qualite@easyqual.fr</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#cc6d3e] flex items-center justify-center">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500">Téléphone</p>
                                        <p className="text-sm font-medium text-gray-900">01 23 45 67 89</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Content */}
                    <div className="w-full lg:w-2/3">
                        {/* Tabs Navigation */}
                        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100 mb-6">
                            <button
                                onClick={() => setActiveTab('new')}
                                className={\`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all \${
                                    activeTab === 'new' 
                                    ? 'bg-[#cc6d3e]/10 text-[#cc6d3e] shadow-sm' 
                                    : 'text-gray-500 hover:bg-gray-50'
                                }\`}
                            >
                                <Plus className="h-4 w-4" />
                                Nouvelle réclamation
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={\`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all \${
                                    activeTab === 'history' 
                                    ? 'bg-[#cc6d3e]/10 text-[#cc6d3e] shadow-sm' 
                                    : 'text-gray-500 hover:bg-gray-50'
                                }\`}
                            >
                                <History className="h-4 w-4" />
                                Mon Historique
                            </button>
                        </div>

                        {activeTab === 'new' ? (
                            <ReclamationForm user={user} onSuccess={() => setActiveTab('history')} />
                        ) : (
                            <div className="space-y-6">
$1
                            </div>
                        )}
                    </div>
                </main>`;

clientContent = clientContent.replace(clientMainRegex, newClientMain.replace('$1', `
                                {/* History Content */}
                                {!loading && reclamations.length === 0 ? (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Sparkles className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Aucune réclamation</h3>
                                        <p className="text-gray-500">Vous n'avez soumis aucune réclamation pour le moment.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {reclamations.map((ticket) => (
                                            <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative group overflow-hidden">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className={\`px-3 py-1 rounded-full text-xs font-bold \${
                                                            ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                            ticket.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                            ticket.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                            'bg-gray-50 text-gray-700 border border-gray-200'
                                                        }\`}>
                                                            {ticket.status === 'resolved' ? 'Résolu' :
                                                             ticket.status === 'rejected' ? 'Rejeté' :
                                                             ticket.status === 'in_progress' ? 'En cours' : 'En attente'}
                                                        </span>
                                                        <span className="text-sm text-gray-500 font-medium">
                                                            {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteTicket(ticket.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors absolute top-4 right-4 md:static opacity-0 group-hover:opacity-100"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <h4 className="text-lg font-bold text-gray-900 mb-2">{ticket.subject}</h4>
                                                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{ticket.description}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs font-medium border border-slate-100">
                                                        <AlertCircle className="h-3.5 w-3.5" />
                                                        {ticket.type}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
`));

fs.writeFileSync('src/pages/client/ClientReclamations.jsx', clientContent, 'utf-8');

// 3. Update ReclamationForm.jsx (Remove the header blocks that are now in the left column)
let formContent = fs.readFileSync('src/components/shared/ReclamationForm.jsx', 'utf-8');

const formHeaderRegex = /\{\/\*\s*Header Block inside ReclamationForm\s*\*\/\}[\s\S]*?(?=<form)/;
const alternativeRegex = /<div className="text-center mb-8">[\s\S]*?<ShieldCheck[\s\S]*?<\/div>\s*<\/div>/;

// Looking closely at ReclamationForm.jsx...
let replaced = false;
if (formContent.includes('<div className="text-center mb-8">')) {
    const toRemove1 = formContent.match(/<div className="text-center mb-8">[\s\S]*?<\/div>/);
    const toRemove2 = formContent.match(/<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8 text-center">[\s\S]*?<\/div>/);
    
    if (toRemove1) formContent = formContent.replace(toRemove1[0], '');
    if (toRemove2) formContent = formContent.replace(toRemove2[0], '');
    replaced = true;
}

if(replaced) {
    fs.writeFileSync('src/components/shared/ReclamationForm.jsx', formContent, 'utf-8');
    console.log("ReclamationForm updated successfully.");
} else {
    console.log("Could not find blocks to remove in ReclamationForm.");
}

console.log("Consultant and Client reclamations pages updated successfully.");
