import { useState } from 'react'
import {
    BookOpen, FileText, ExternalLink, ChevronDown, ChevronUp,
    Download, Link2, HelpCircle, CheckCircle, Award,
    ArrowRight, Shield, Layers, Users, Clock,
    LayoutDashboard, Target, Globe, TrendingUp
} from 'lucide-react'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'

// ─── Data ─────────────────────────────────────────────────────────

const categoryDocs = [
    { title: "Actions de Formation", sub: "OF - L.6313-1-1°", file: "Formation Qualiopi - Actions de Formation.pdf", icon: <BookOpen className="h-6 w-6" />, cls: "from-blue-500 to-indigo-600" },
    { title: "Bilan de Compétences", sub: "BC - L.6313-1-2°", file: "Formation Qualiopi - Bilan de Compétences.pdf", icon: <TrendingUp className="h-6 w-6" />, cls: "from-emerald-500 to-teal-600" },
    { title: "CFA Apprentissage", sub: "CFA - L.6313-1-4°", file: "Formation Qualiopi - CFA Apprentissage.pdf", icon: <Users className="h-6 w-6" />, cls: "from-purple-500 to-fuchsia-600" },
    { title: "Actions de VAE", sub: "VAE - L.6313-1-3°", file: "Formation Qualiopi - VAE.pdf", icon: <Award className="h-6 w-6" />, cls: "from-amber-500 to-orange-600" },
]

const links = [
    { title: "France Compétences", sub: "francecompetences.fr", desc: "Référentiel officiel, actualités et textes réglementaires Qualiopi.", url: "https://www.francecompetences.fr", bar: "bg-purple-500", iconBg: "bg-purple-50 text-purple-600" },
    { title: "Mon Compte Formation", sub: "moncompteformation.gouv.fr", desc: "Portail CPF — statistiques formations et données nationales.", url: "https://www.moncompteformation.gouv.fr", bar: "bg-blue-500", iconBg: "bg-blue-50 text-blue-600" },
    { title: "DREETS", sub: "dreets.gouv.fr", desc: "Direction régionale — contrôle, emploi et formation professionnelle.", url: "https://dreets.gouv.fr/", bar: "bg-teal-500", iconBg: "bg-teal-50 text-teal-600" },
    { title: "Légifrance", sub: "legifrance.gouv.fr", desc: "Décrets et arrêtés relatifs à la certification qualité des organismes de formation.", url: "https://www.legifrance.gouv.fr", bar: "bg-gray-400", iconBg: "bg-gray-50 text-gray-500" },
]

const steps = [
    { n: "01", label: "Création du dossier", desc: "Saisir les informations du client et sélectionner le type d'audit." },
    { n: "02", label: "Autoévaluation client", desc: "Le client remplit sa grille d'état des lieux via son espace dédié." },
    { n: "03", label: "Instruction du dossier", desc: "Le consultant renseigne ses verdicts indicateur par indicateur." },
    { n: "04", label: "Clôture & rapport", desc: "Génération du rapport final et mise à jour du statut du dossier." },
]

const faqs = [
    { q: "Différence entre audit initial, surveillance et renouvellement ?", a: "L'audit initial certifie l'organisme pour la 1ˢᵗ fois. La surveillance (18 mois après) vérifie le maintien des exigences. Le renouvellement a lieu tous les 3 ans." },
    { q: "Quels indicateurs sont obligatoires pour tous les organismes ?", a: "Les indicateurs 1 à 6 (Critère 1 – Information du public) sont communs à tous. Les suivants varient selon les catégories d'actions : FPC, apprentissage, VAE, bilans de compétences, AFEST…" },
    { q: "Comment ajouter un verdict sur un indicateur dans EasyQual ?", a: "Dans la page du dossier client, ouvrez un indicateur puis sélectionnez Conforme, Non Conforme ou Non Applicable. La progression se met à jour automatiquement." },
    { q: "Comment marquer un dossier comme Terminé ?", a: "Faites défiler jusqu'en bas de la page du dossier et cliquez sur le bouton « Terminé ». Le statut est mis à jour en base et reflété dans le tableau de bord." },
]

function FAQItem({ q, a }) {
    const [open, setOpen] = useState(false)
    return (
        <div className={`border-b border-gray-100 last:border-0 transition-colors ${open ? 'bg-purple-50/40' : ''}`}>
            <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 group">
                <span className="text-sm font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">{q}</span>
                {open
                    ? <ChevronUp className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                }
            </button>
            {open && (
                <p className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">{a}</p>
            )}
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────
export default function Ressources() {
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    return (
        <div className="bg-gray-50 min-h-screen font-sans flex text-slate-800">
            <ConsultantSidebar isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <ConsultantTopBar
                    showNewFolder={false}
                    showCredits={false}
                    showSearch={false}
                    showMobileMenu={showMobileMenu}
                    setShowMobileMenu={setShowMobileMenu}
                />

                <main className="flex-1 overflow-y-auto">

                    {/* ── Hero Banner ── */}
                    <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #3730a3 0%, #6d28d9 55%, #7c3aed 100%)' }}>
                        {/* Dot grid overlay */}
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                        <div className="relative max-w-6xl mx-auto px-8 py-12 flex items-center justify-between gap-8">
                            <div>
                                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-3">EasyQual · Espace consultant</p>
                                <h1 className="text-4xl font-black text-white mb-3 leading-tight">Audit Qualiopi Manager</h1>
                                <p className="text-indigo-200 text-sm max-w-lg leading-relaxed">
                                    Documents officiels, modèles d'audit et liens utiles pour conduire vos missions Qualiopi avec efficacité.
                                </p>
                            </div>
                            <div className="hidden lg:flex items-center justify-center h-28 w-28 rounded-3xl bg-white/10 backdrop-blur-sm flex-shrink-0 border border-white/20">
                                <BookOpen className="h-14 w-14 text-white/80" />
                            </div>
                        </div>
                    </div>

                    <div className="max-w-6xl mx-auto px-8 py-10 space-y-12">

                        {/* ── Processus ── */}
                        <section>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Processus d'audit EasyQual</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {steps.map((s, i) => (
                                    <div key={i} className="relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                                        <span className="text-4xl font-black text-purple-100 group-hover:text-purple-200 transition-colors">{s.n}</span>
                                        <p className="mt-2 text-sm font-bold text-gray-900">{s.label}</p>
                                        <p className="mt-1 text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                                        {i < steps.length - 1 && (
                                            <ArrowRight className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-300 z-10 bg-white rounded-full" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>



                        {/* ── Guides par Catégories d'Actions ── */}
                        <section>
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <BookOpen className="h-4 w-4 text-indigo-600" />
                                </div>
                                <h2 className="text-base font-bold text-gray-900">Guides par Catégories d'Actions</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {categoryDocs.map((cat, i) => (
                                    <a
                                        key={i}
                                        href={`/docs/criteria/${cat.file}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
                                    >
                                        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${cat.cls}`} />
                                        <div className="p-4 rounded-2xl bg-gray-50 text-gray-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors mb-4">
                                            {cat.icon}
                                        </div>
                                        <p className="text-sm font-black text-gray-900 mb-1">{cat.title}</p>
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{cat.sub}</p>

                                        <div className="mt-6 flex items-center gap-2 text-xs font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">
                                            <span>Consulter le guide</span>
                                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>

                        {/* ── Liens officiels ── */}
                        <section>
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Link2 className="h-4 w-4 text-purple-600" />
                                </div>
                                <h2 className="text-base font-bold text-gray-900">Liens officiels</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {links.map((l, i) => (
                                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                                        className="group flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-purple-100 transition-all overflow-hidden relative">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${l.bar}`} />
                                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${l.iconBg}`}>
                                            <ExternalLink className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900">{l.title}</p>
                                            <p className="text-[10px] text-purple-500 font-semibold">{l.sub}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{l.desc}</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </section>

                        {/* ── FAQ ── */}
                        <section>
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <HelpCircle className="h-4 w-4 text-purple-600" />
                                </div>
                                <h2 className="text-base font-bold text-gray-900">Questions fréquentes</h2>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                {faqs.map((faq, i) => <FAQItem key={i} {...faq} />)}
                            </div>
                        </section>

                        {/* ── Note de bas de page ── */}
                        <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-100 rounded-2xl">
                            <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <span className="font-bold">À noter :</span> Le référentiel Qualiopi peut évoluer. Consultez régulièrement France Compétences pour vous assurer de travailler sur la version en vigueur.
                            </p>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    )
}
