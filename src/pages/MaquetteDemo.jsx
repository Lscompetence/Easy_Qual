
import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    FileText,
    Calendar as CalendarIcon,
    MessageSquare,
    Settings,
    Search,
    Bell,
    ChevronRight,
    ChevronDown,
    CheckCircle2,
    AlertCircle,
    Clock,
    MoreHorizontal,
    ArrowUpRight,
    Filter,
    Plus,
    X,
    Paperclip,
    Send,
    Eye,
    ShieldCheck,
    Video,
    Loader2,
    Folder,
    DownloadCloud,
    File,
    MoreVertical,
    CalendarDays,
    Briefcase,
    CircleOff
} from 'lucide-react';

// --- Mock Data ---

const CLIENTS = [
    {
        id: 1,
        name: "TechAcademy Formation",
        contact: "Alice Dupont",
        type: "Initial",
        categories: ["AFC", "CFA"],
        progress: 65,
        status: "En cours",
        lastUpdate: "Il y a 2h",
        avatar: "TA",
        color: "indigo"
    },
    {
        id: 2,
        name: "Build Skills BTP",
        contact: "Marc Herman",
        type: "Surveillance",
        categories: ["BC"],
        progress: 92,
        status: "À valider",
        lastUpdate: "Hier",
        avatar: "BS",
        color: "emerald"
    },
    {
        id: 3,
        name: "Langues & Co",
        contact: "Sarah Connor",
        type: "Renouvellement",
        categories: ["AFC"],
        progress: 15,
        status: "Audit Blanc",
        lastUpdate: "Il y a 3j",
        avatar: "LC",
        color: "amber"
    },
    {
        id: 4,
        name: "Beauty School",
        contact: "Julie Martin",
        type: "Initial",
        categories: ["CFA"],
        progress: 45,
        status: "En cours",
        lastUpdate: "Il y a 5j",
        avatar: "BS",
        color: "rose"
    }
];

const RNQ_CRITERIA = [
    {
        id: 1,
        title: "Conditions d'information du public",
        progress: 100,
        status: "completed",
        indicators: [
            { id: "1.1", label: "Information sur l'offre", status: "conforme", evidence: 3, lastMod: "Hier" },
            { id: "1.2", label: "Indicateurs de résultats", status: "conforme", evidence: 2, lastMod: "Hier" },
            { id: "1.3", label: "Taux d'obtention des certifications", status: "conforme", evidence: 1, lastMod: "Aujourd'hui" }
        ]
    },
    {
        id: 2,
        title: "Identification précise des objectifs",
        progress: 60,
        status: "in_progress",
        indicators: [
            { id: "2.4", label: "Analyse du besoin", status: "conforme", evidence: 2, lastMod: "Il y a 2j" },
            { id: "2.5", label: "Objectifs opérationnels", status: "review", evidence: 5, lastMod: "Il y a 4h" },
            { id: "2.6", label: "Contenus et méthodes", status: "todo", evidence: 0, lastMod: "-" }
        ]
    },
    {
        id: 3,
        title: "Adaptation aux publics bénéficiaires",
        progress: 0,
        status: "todo",
        indicators: [
            { id: "3.9", label: "Conditions d'accueil", status: "todo", evidence: 0, lastMod: "-" },
            { id: "3.10", label: "Suivi de l'exécution", status: "todo", evidence: 0, lastMod: "-" }
        ]
    }
];

const ALL_EVENTS = [
    { id: 1, clientId: 1, clientName: "TechAcademy", title: "Lancement accompagnement", date: "10 Oct 2026", time: "09:00 - 10:30", type: "visio", status: "done" },
    { id: 2, clientId: 1, clientName: "TechAcademy", title: "Point d'étape : C1 & C2", date: "24 Oct 2026", time: "14:00 - 15:00", type: "visio", status: "done" },
    { id: 3, clientId: 2, clientName: "Build Skills", title: "Audit Blanc (Jour 1)", date: "26 Oct 2026", time: "09:00 - 17:00", type: "audit", status: "upcoming" },
    { id: 4, clientId: 1, clientName: "TechAcademy", title: "Revue documentaire", date: "15 Nov 2026", time: "10:00 - 12:00", type: "work", status: "upcoming" },
    { id: 5, clientId: 3, clientName: "Langues & Co", title: "Visio de cadrage", date: "16 Nov 2026", time: "11:00 - 12:00", type: "visio", status: "upcoming" },
];

const FILES = [
    { id: 1, name: "Manuel_Qualite_V1.pdf", size: "2.4 MB", type: "pdf", date: "12 Oct 2026" },
    { id: 2, name: "Grille_Audit_Interne.xlsx", size: "850 KB", type: "xls", date: "14 Oct 2026" },
    { id: 3, name: "Logos_Partenaires", size: "12 items", type: "folder", date: "10 Oct 2026" },
    { id: 4, name: "Attestation_Honner.pdf", size: "1.2 MB", type: "pdf", date: "02 Nov 2026" },
];

// --- Components ---

const Badge = ({ children, variant = "neutral", className = "" }) => {
    const styles = {
        neutral: "bg-slate-100 text-slate-600 border-slate-200",
        success: "bg-emerald-100 text-emerald-800 border-emerald-200",
        warning: "bg-amber-100 text-amber-800 border-amber-200",
        danger: "bg-rose-100 text-rose-800 border-rose-200",
        indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
        purple: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${styles[variant]} inline-flex items-center gap-1.5 ${className}`}>
            {children}
        </span>
    );
};

const ProgressBar = ({ progress, color = "indigo" }) => {
    const colors = {
        indigo: "bg-indigo-600",
        emerald: "bg-emerald-500",
        amber: "bg-amber-500",
        slate: "bg-slate-400",
        rose: "bg-rose-500"
    };

    return (
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className={`${colors[color]} h-2.5 rounded-full transition-all duration-700 ease-out`} style={{ width: `${progress}%` }} />
        </div>
    );
};

const StatCard = ({ title, value, trend, icon: Icon, color = "indigo", loading }) => {
    if (loading) return
    <div className="h-32 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />;

    const colorStyles = {
        indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
        emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
        amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
        rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white",
    };

    return (
        <div
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl transition-colors duration-300 ${colorStyles[color]}`}>
                    <Icon size={22} />
                </div>
                {trend && (
                    <span
                        className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                        <ArrowUpRight size={12} className="mr-1" /> {trend}
                    </span>
                )}
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">{value}</div>
            <div className="text-sm text-slate-500 font-medium">{title}</div>
        </div>
    );
};

// --- Views ---

const ClientsListView = ({ onSelectClient }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tous les Dossiers</h1>
                    <p className="text-slate-500">Gérez vos 4 accompagnements en cours.</p>
                </div>
                <button
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2">
                    <Plus size={18} /> Nouveau Client
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Filtrer par nom, contact..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
                    </div>
                    <button
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                        <Filter size={16} /> Statut
                    </button>
                </div>

                <table className="w-full text-left">
                    <thead
                        className="bg-slate-50 text-slate-500 font-medium text-xs uppercase tracking-wider border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Progression</th>
                            <th className="px-6 py-4">Statut</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {CLIENTS.map(client => (
                            <tr key={client.id} onClick={() => onSelectClient(client)} className="hover:bg-indigo-50/30 cursor-pointer group transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${client.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                                            client.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : client.color === 'amber'
                                                ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {client.avatar}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{client.name}</div>
                                            <div className="text-xs text-slate-500">{client.contact}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-700 font-medium">{client.type}</div>
                                    <div className="text-xs text-slate-400">{client.categories.join(', ')}</div>
                                </td>
                                <td className="px-6 py-4 w-48">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-600">{client.progress}%</span>
                                    </div>
                                    <ProgressBar progress={client.progress} color={client.color} />
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant={client.status === "À valider" ? "warning" : client.status === "En cours" ? "indigo" : "danger"}>
                                        {client.status}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 inline-block" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const GlobalPlanningView = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Mon Planning</h1>
                    <p className="text-slate-500">Vue consolidée de tous vos rendez-vous clients.</p>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                    <button
                        className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold shadow-sm">Liste</button>
                    <button
                        className="px-4 py-1.5 text-slate-500 hover:text-slate-700 rounded-lg text-sm font-medium">Calendrier</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Events List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                            <CalendarDays className="text-indigo-600" /> Prochains événements
                        </h3>
                        <div className="space-y-3">
                            {ALL_EVENTS.map(evt => (
                                <div key={evt.id}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all group bg-white shadow-sm">
                                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl font-bold border
                            ${evt.status === 'done' ? 'bg-slate-50 text-slate-400 border-slate-200'
                                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                        <span className="text-lg">{evt.date.split(' ')[0]}</span>
                                        <span className="text-[10px] uppercase">{evt.date.split(' ')[1]}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font-bold text-slate-900 ${evt.status === 'done'
                                                && 'line-through text-slate-400'}`}>{evt.title}</h4>
                                            <Badge variant="neutral" className="text-[10px]">{evt.clientName}</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={14} /> {evt.time}
                                            </span>
                                            {evt.type === 'visio' && <span
                                                className="flex items-center gap-1 text-purple-600 font-medium"><Video size={14} />
                                                Visio</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Stats / Summary */}
                <div className="space-y-4">
                    <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg shadow-indigo-200">
                        <h3 className="font-bold text-lg mb-1">Charge Hebdo</h3>
                        <div className="text-3xl font-bold mb-4">12h <span className="text-sm font-normal text-indigo-300">de
                            visio</span></div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm text-indigo-200"><span>Lundi</span> <span>4h</span>
                            </div>
                            <div className="w-full bg-indigo-800 rounded-full h-1.5">
                                <div className="bg-indigo-400 h-1.5 rounded-full w-1/3"></div>
                            </div>
                            <div className="flex justify-between text-sm text-indigo-200"><span>Mardi</span> <span>6h</span>
                            </div>
                            <div className="w-full bg-indigo-800 rounded-full h-1.5">
                                <div className="bg-rose-400 h-1.5 rounded-full w-2/3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardView = ({ onSelectClient, loading }) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Tableau de bord</h1>
                    <p className="text-slate-500">Vue d'ensemble de vos dossiers Qualiopi actifs.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                        <Filter size={16} /> Filtrer
                    </button>
                    <button
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2 hover:scale-105 active:scale-95 transform duration-200">
                        <Plus size={18} /> Nouveau Dossier
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Dossiers Actifs" value="4" trend="+1" icon={FileText} color="indigo" loading={loading} />
                <StatCard title="À Valider" value="12" icon={CheckCircle2} color="amber" loading={loading} />
                <StatCard title="Audits Blancs" value="2" icon={ShieldCheck} color="rose" loading={loading} />
                <StatCard title="Taux Conformité" value="84%" trend="+4%" icon={ArrowUpRight} color="emerald"
                    loading={loading} />
            </div>

            {/* Recent Activity / Clients */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">Dossiers Récents</h3>
                    <button onClick={() => onSelectClient(null, 'clients')} className="text-sm text-indigo-600 font-bold
                hover:text-indigo-700 hover:underline">Voir tout</button>
                </div>

                {loading ? (
                    <div className="p-5 space-y-4">
                        {[1, 2, 3].map(i =>
                            <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />)}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {CLIENTS.slice(0, 3).map((client) => (
                            <div key={client.id} onClick={() => onSelectClient(client)}
                                className="p-5 hover:bg-indigo-50/30 transition-colors cursor-pointer flex items-center gap-5 group"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm
                    ${client.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' : client.color === 'emerald'
                                        ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {client.avatar}
                                </div>

                                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                    <div className="col-span-1">
                                        <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{client.name}</h4>
                                        <div className="flex items-center text-xs text-slate-500">
                                            <Users size={12} className="mr-1" /> {client.contact}
                                        </div>
                                    </div>

                                    <div className="col-span-1">
                                        <div className="flex flex-wrap gap-1">
                                            {client.categories.map(cat => (
                                                <span key={cat}
                                                    className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="col-span-1">
                                        <Badge variant={client.status === "À valider" ? "warning" : client.status === "En cours" ? "indigo"
                                            : "danger"}>
                                            {client.status}
                                        </Badge>
                                    </div>

                                    <div className="col-span-1 flex flex-col gap-1.5">
                                        <div className="flex justify-between text-xs font-bold text-slate-600">
                                            <span>Progression</span>
                                            <span>{client.progress}%</span>
                                        </div>
                                        <ProgressBar progress={client.progress} color={client.color} />
                                    </div>
                                </div>

                                <div
                                    className="hidden md:block p-2 rounded-full text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-100 transition-all">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ClientDetailView = ({ client, onBack }) => {
    const [activeTab, setActiveTab] = useState('audit');
    const [openCriteria, setOpenCriteria] = useState([1, 2]);
    const [activeIndicator, setActiveIndicator] = useState(null);

    const toggleCriterion = (id) => {
        setOpenCriteria(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const StatusIcon = ({ status }) => {
        switch (status) {
            case 'conforme': return <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full">
                <CheckCircle2 size={16} />
            </div>;
            case 'review': return <div className="bg-amber-100 text-amber-600 p-1 rounded-full">
                <Eye size={16} />
            </div>;
            case 'todo': return <div className="bg-slate-100 text-slate-400 p-1 rounded-full">
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full" />
            </div>;
            default: return null;
        }
    };

    const clientEvents = ALL_EVENTS.filter(e => e.clientId === client.id);

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col animate-in slide-in-from-bottom-4 duration-500">

            {/* Client Header */}
            <div
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button onClick={onBack}
                        className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors border border-transparent hover:border-slate-200">
                        <ChevronDown className="rotate-90" size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{client.name}</h2>
                            <Badge variant="indigo" className="text-xs uppercase tracking-wider">{client.type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5">
                                <Users size={14} className="text-slate-400" /> {client.contact}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1.5">
                                <Clock size={14} className="text-slate-400" /> Maj : {client.lastUpdate}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="flex-1 md:w-64">
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                            <span>Conformité Globale</span>
                            <span>{client.progress}%</span>
                        </div>
                        <ProgressBar progress={client.progress} color={client.progress > 80 ? 'emerald' : 'indigo'} />
                    </div>
                    <button
                        className="hidden md:flex px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 items-center gap-2">
                        <FileText size={16} /> Rapport
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-slate-200 mb-6 px-2">
                {['Audit Qualiopi', 'Planning & Visio', 'Documents', 'Messages'].map((tab) => {
                    const id = tab.toLowerCase().split(' ')[0];
                    const isActive = activeTab === id || (id === 'audit' && activeTab === 'audit');
                    return (
                        <button key={tab} onClick={() => setActiveTab(id)}
                            className={`pb-3 text-sm font-bold transition-all relative px-1 ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            {tab}
                            {isActive &&
                                <div
                                    className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full shadow-[0_-2px_6px_rgba(79,70,229,0.3)]" />
                            }
                        </button>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 gap-6 overflow-hidden">

                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto pr-2 pb-20 scrollbar-hide">

                    {(activeTab === 'audit') && (
                        <div className="space-y-6">
                            {RNQ_CRITERIA.map((criterion) => {
                                const isOpen = openCriteria.includes(criterion.id);
                                // Dynamic header styling based on status
                                const headerStyle = criterion.status === 'completed'
                                    ? "bg-emerald-50/50 border-emerald-100"
                                    : criterion.status === 'in_progress'
                                        ? "bg-indigo-50/50 border-indigo-100"
                                        : "bg-white border-slate-200";

                                return (
                                    <div key={criterion.id} className={`border rounded-2xl shadow-sm overflow-hidden transition-all
                    duration-300 ${headerStyle}`}>
                                        <div onClick={() => toggleCriterion(criterion.id)}
                                            className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/50
                        transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold
                                shadow-sm ${criterion.status === 'completed' ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-white border border-slate-200 text-slate-700'}`}>
                                                    C{criterion.id}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-lg">{criterion.title}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${criterion.status === 'completed'
                                                                ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{
                                                                    width:
                                                                        `${criterion.progress}%`
                                                                }}></div>
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-500">{criterion.progress}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                                                <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen
                                                    ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div className="border-t border-slate-100 bg-white/50 p-3 space-y-2">
                                                {criterion.indicators.map((ind) => {
                                                    const isActive = activeIndicator?.id === ind.id;
                                                    const cardStatusStyle = ind.status === 'conforme'
                                                        ? "border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50"
                                                        : ind.status === 'review'
                                                            ? "border-amber-200 bg-amber-50/30 hover:bg-amber-50"
                                                            : "border-slate-200 hover:bg-slate-50";
                                                    const activeStyle = isActive ? "ring-2 ring-indigo-500 shadow-md transform scale-[1.01]" : "";

                                                    return (
                                                        <div key={ind.id} onClick={() => setActiveIndicator(ind)}
                                                            className={`p-4 rounded-xl border transition-all cursor-pointer group flex items-center
                            justify-between ${cardStatusStyle} ${activeStyle}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <StatusIcon status={ind.status} />
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-sm font-bold ${isActive ? 'text-indigo-700'
                                                                            : 'text-slate-800'}`}>Indicateur {ind.id}</span>
                                                                        {ind.status === 'conforme' && <span
                                                                            className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">Conforme</span>}
                                                                        {ind.status === 'review' && <span
                                                                            className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">À
                                                                            vérifier</span>}
                                                                    </div>
                                                                    <span className="text-sm text-slate-600 block mt-0.5">{ind.label}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                {ind.evidence > 0 && (
                                                                    <div
                                                                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                                                                        <Paperclip size={12} /> {ind.evidence}
                                                                    </div>
                                                                )}
                                                                <ChevronRight size={16} className={`text-slate-300 transition-transform ${isActive
                                                                    ? 'translate-x-1 text-indigo-500' : ''}`} />
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {activeTab === 'planning' && (
                        <div className="space-y-8">
                            {/* Timeline Client - Enhanced */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Briefcase className="text-indigo-600" /> Progression de l'accompagnement
                                </h3>
                                <div className="relative pt-6 pb-2">
                                    {/* Main Line */}
                                    <div
                                        className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-1/2"></div>
                                    </div>

                                    {/* Steps */}
                                    <div className="flex justify-between relative z-10">
                                        {[
                                            { name: 'Lancement', date: '10 Oct', status: 'done' },
                                            { name: 'Mi-parcours', date: '24 Oct', status: 'done' },
                                            { name: 'Audit Blanc', date: '02 Déc', status: 'current' },
                                            { name: 'Audit Final', date: '15 Jan', status: 'upcoming' }
                                        ].map((step, idx) => (
                                            <div key={idx} className="flex flex-col items-center gap-3 w-32 text-center group">
                                                <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center
                                    shadow-sm transition-all ${step.status === 'done'
                                                        ? 'bg-indigo-600 border-indigo-200 text-white' : step.status === 'current'
                                                            ? 'bg-white border-indigo-500 text-indigo-700 ring-4 ring-indigo-100'
                                                            : 'bg-white border-slate-200 text-slate-300'}`}>
                                                    {step.status === 'done' ?
                                                        <CheckCircle2 size={16} /> : idx + 1}
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-bold ${step.status === 'upcoming' ? 'text-slate-400'
                                                        : 'text-slate-900'}`}>{step.name}</div>
                                                    <div className="text-xs font-medium text-slate-500 mt-0.5">{step.date}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Events List for this client */}
                            <div>
                                <h4 className="font-bold text-slate-800 mb-4 px-1">Rendez-vous & Échéances</h4>
                                <div className="space-y-3">
                                    {clientEvents.length > 0 ? (
                                        clientEvents.map((evt) => (
                                            <div key={evt.id}
                                                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-5 group cursor-pointer">
                                                <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl font-bold
                                ${evt.status === 'done' ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-indigo-50 text-indigo-700'}`}>
                                                    <span className="text-xl">{evt.date.split(' ')[0]}</span>
                                                    <span className="text-[10px] uppercase">{evt.date.split(' ')[1]}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className={`font-bold text-slate-800 ${evt.status === 'done'
                                                            ? 'line-through decoration-slate-300 text-slate-400' : ''}`}>
                                                            {evt.title}
                                                        </h4>
                                                        {evt.type === 'visio' && <Badge variant="purple" className="flex gap-1"><Video
                                                            size={10} /> Visio</Badge>}
                                                        {evt.type === 'audit' && <Badge variant="warning" className="flex gap-1">
                                                            <ShieldCheck size={10} /> Audit
                                                        </Badge>}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock size={14} /> {evt.time}
                                                        </span>
                                                        {evt.status === 'upcoming' && <span
                                                            className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">À
                                                            venir</span>}
                                                    </div>
                                                </div>
                                                <button
                                                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50">
                                                    Gérer
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div
                                            className="text-center p-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            Aucun événement planifié pour ce client.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 min-h-[500px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 text-lg">Espace Documentaire</h3>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                                        <Search size={20} />
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700">
                                        <Plus size={16} /> Ajouter
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {FILES.map((file) => (
                                    <div key={file.id}
                                        className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md hover:bg-indigo-50/10 transition-all cursor-pointer group relative">
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1 hover:bg-slate-200 rounded text-slate-500">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${file.type === 'pdf'
                                            ? 'bg-red-50 text-red-500' : file.type === 'xls' ? 'bg-emerald-50 text-emerald-500'
                                                : 'bg-blue-50 text-blue-500'}`}>
                                            {file.type === 'folder' ?
                                                <Folder size={24} /> :
                                                <File size={24} />}
                                        </div>
                                        <div className="text-sm font-bold text-slate-700 truncate mb-1">{file.name}</div>
                                        <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                                            <span>{file.size}</span>
                                            <span>{file.date}</span>
                                        </div>
                                    </div>
                                ))}
                                {/* Upload Zone */}
                                <div
                                    className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer min-h-[140px]">
                                    <DownloadCloud size={24} className="mb-2" />
                                    <span className="text-xs font-bold">Déposer un fichier</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Inspector / Context Panel (Fixed) */}
                {activeTab === 'audit' && activeIndicator && (
                    <div
                        className="w-[420px] bg-white border border-slate-200 rounded-2xl shadow-xl shadow-indigo-100/50 flex flex-col animate-in slide-in-from-right-8 duration-300">
                        <div
                            className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-2xl">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={activeIndicator.status === 'conforme' ? 'success' : 'neutral'}>
                                        {activeIndicator.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <h4 className="font-bold text-lg text-slate-900 leading-tight">Indicateur {activeIndicator.id}</h4>
                            </div>
                            <button onClick={() => setActiveIndicator(null)} className="p-1 text-slate-400 hover:text-slate-600
            hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Context Box */}
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <h5
                                    className="text-xs font-bold text-indigo-800 uppercase mb-2 tracking-wide flex items-center gap-2">
                                    <ShieldCheck size={14} /> Attendu du référentiel
                                </h5>
                                <p className="text-sm text-indigo-900 leading-relaxed opacity-90">
                                    {activeIndicator.label}. Le prestataire doit démontrer comment il analyse le besoin du
                                    bénéficiaire de manière formalisée.
                                </p>
                            </div>

                            {/* Evidence Section */}
                            <div>
                                <h5 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                                    Preuves client
                                    <Badge variant="neutral">2 fichiers</Badge>
                                </h5>
                                <div className="space-y-3">
                                    <div
                                        className="flex items-center p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer group transition-all hover:border-indigo-200 hover:shadow-sm">
                                        <div
                                            className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mr-3 border border-red-100">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-700">
                                                Processus_Analyse_v2.pdf</div>
                                            <div className="text-xs text-slate-400 font-medium">Ajouté hier à 14:00</div>
                                        </div>
                                        <button
                                            className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Comments */}
                            <div>
                                <h5 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <MessageSquare size={14} className="text-slate-400" /> Commentaires auditeur
                                </h5>
                                <textarea
                                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none resize-none transition-all placeholder:text-slate-400"
                                    placeholder="Notez vos observations, écarts potentiels ou points de vigilance..."></textarea>
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all group shadow-sm hover:shadow-md">
                                    <CheckCircle2 size={24}
                                        className="mb-1.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                                    <span className="text-xs font-bold">Conforme</span>
                                </button>
                                <button
                                    className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-white border border-slate-200 hover:border-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all group shadow-sm hover:shadow-md">
                                    <CircleOff size={24}
                                        className="mb-1.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                                    <span className="text-xs font-bold">Non Applicable</span>
                                </button>
                                <button
                                    className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-white border border-slate-200 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-all group shadow-sm hover:shadow-md">
                                    <X size={24} className="mb-1.5 text-slate-300 group-hover:text-rose-600 transition-colors" />
                                    <span className="text-xs font-bold">Non Conforme</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- App Shell ---

const MaquetteDemo = () => {
    const [currentView, setCurrentView] = useState('dashboard'); // dashboard, clients, planning, client_detail
    const [selectedClient, setSelectedClient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleClientSelect = (client, fromView = 'dashboard') => {
        if (client) {
            setSelectedClient(client);
            setCurrentView('client_detail');
        } else {
            setSelectedClient(null);
            setCurrentView(fromView);
        }
    };

    const handleNavClick = (view) => {
        setSelectedClient(null);
        setCurrentView(view);
    };

    return (
        <div
            className="flex h-screen bg-[#F8FAFC] font-sans text-slate-600 antialiased overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">

            {/* Sidebar */}
            <div
                className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div>
                    <div className="p-6 flex items-center gap-3 mb-2">
                        <div
                            className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 ring-2 ring-white">
                            <ShieldCheck className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-extrabold text-slate-900 tracking-tight">Easy'Qual</span>
                    </div>

                    <nav className="px-4 space-y-1.5 mt-2">
                        <button onClick={() => handleNavClick('dashboard')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all
                    ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <LayoutDashboard size={18} /> Tableau de bord
                        </button>
                        <button onClick={() => handleNavClick('clients')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all
                    ${currentView === 'clients' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <Users size={18} /> Dossiers Clients
                        </button>
                        <button onClick={() => handleNavClick('planning')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all
                    ${currentView === 'planning' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <CalendarIcon size={18} /> Mon Planning
                        </button>
                        <button
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all justify-between group">
                            <div className="flex items-center gap-3">
                                <MessageSquare size={18} /> Messages
                            </div>
                            <span
                                className="bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors text-[10px] px-2 py-0.5 rounded-full">2</span>
                        </button>
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-100">
                    <div
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                        <div className="w-9 h-9 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">Sofiane.Expert</p>
                            <p className="text-xs text-slate-500 truncate font-medium">Offre Pro • Maroc</p>
                        </div>
                        <Settings size={16} className="text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-[#F8FAFC]">

                {/* Top Navigation */}
                <header
                    className="h-18 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-96 hidden md:block group">
                            <Search size={18}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input type="text" placeholder="Rechercher (Client, indicateur, preuve)..."
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all placeholder:text-slate-400" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            className="relative p-2.5 text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-slate-100 rounded-xl transition-all">
                            <Bell size={20} />
                            <span
                                className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white ring-1 ring-rose-500"></span>
                        </button>
                    </div>
                </header>

                {/* Dynamic Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
                    {currentView === 'client_detail' && selectedClient ? (
                        <ClientDetailView client={selectedClient} onBack={() => handleNavClick('dashboard')} />
                    ) : currentView === 'clients' ? (
                        <ClientsListView onSelectClient={handleClientSelect} />
                    ) : currentView === 'planning' ? (
                        <GlobalPlanningView />
                    ) : (
                        <DashboardView onSelectClient={handleClientSelect} loading={loading} />
                    )}
                </main>

            </div>
        </div>
    );
};

export default MaquetteDemo;
