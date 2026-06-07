import { useState, useEffect } from 'react'
import { Search, Filter, Star, User, GraduationCap, Calendar, MessageSquare, CheckCircle, Clock, X } from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function AdminQuestionnairesTab() {
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState('all') // 'all', 'client', 'consultant'
    
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedItem, setSelectedItem] = useState(null)

    useEffect(() => {
        fetchResults()
    }, [])

    async function fetchResults() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('questionnaires_results')
                .select('*')
                .order('created_at', { ascending: false })
            
            if (error) {
                console.error("Error fetching questionnaires:", error)
            } else {
                setResults(data || [])
            }
        } catch (err) {
            console.error("Exception fetching questionnaires:", err)
        } finally {
            setLoading(false)
        }
    }

    // Filter logic
    const filteredData = results.filter(item => {
        const matchesSearch = 
            (item.respondent_name && item.respondent_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.consultant_name && item.consultant_name.toLowerCase().includes(searchQuery.toLowerCase()))
        
        const matchesType = typeFilter === 'all' || item.type === typeFilter
        
        return matchesSearch && matchesType
    })

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Panier des Questionnaires</h2>
                    <p className="text-sm text-gray-500 mt-1">Consultez et analysez les retours de satisfaction.</p>
                </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="mt-8 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher par nom..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all shadow-sm"
                    />
                </div>
                
                <div className="flex p-1 bg-gray-100 rounded-xl shadow-inner sm:w-auto w-full">
                    {['all', 'client', 'consultant'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                typeFilter === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {type === 'all' ? 'Tous' : type === 'client' ? 'Clients' : 'Consultants'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Chargement des résultats...</div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">Aucun résultat trouvé.</div>
                ) : (
                    filteredData.map((item) => (
                        <div key={item.id} className="relative bg-white border border-gray-100 rounded-xl p-5 hover:border-blue-100 hover:shadow-md transition-all group overflow-hidden">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                item.type === 'client' ? 'bg-[#cc6d3e]' : 'bg-purple-500'
                            }`}></div>

                            <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between ml-2">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                                            item.type === 'client' ? 'bg-[#faf1ec] text-[#cc6d3e]' : 'bg-purple-50 text-purple-700'
                                        }`}>
                                            {item.type === 'client' ? <GraduationCap className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                            {item.type === 'client' ? 'Client' : 'Consultant'}
                                        </span>
                                        <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            <Calendar className="h-3 w-3 mr-1.5" />
                                            {formatDate(item.created_at)}
                                        </div>
                                        {item.status === 'traité' || item.status === 'reviewed' ? (
                                            <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                                <CheckCircle className="h-3 w-3 mr-1" /> Traité
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                                <Clock className="h-3 w-3 mr-1" /> Nouveau
                                            </span>
                                        )}
                                    </div>

                                    {/* Names */}
                                    <div className="flex flex-col gap-1 mt-1">
                                        {item.type === 'client' ? (
                                            <>
                                                <div className="text-base font-bold text-gray-900 flex items-center gap-2">
                                                    <span className="text-sm font-normal text-gray-500 w-20">Client :</span>
                                                    {item.respondent_name || 'Anonyme'}
                                                </div>
                                                {item.consultant_name && (
                                                    <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                        <span className="text-sm font-normal text-gray-400 w-20">Consultant :</span>
                                                        {item.consultant_name}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-base font-bold text-gray-900 flex items-center gap-2">
                                                    <span className="text-sm font-normal text-gray-500 w-20">Consultant :</span>
                                                    {item.respondent_name || 'Anonyme'}
                                                </div>
                                                {item.consultant_name && (
                                                    <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                        <span className="text-sm font-normal text-gray-400 w-20">Client :</span>
                                                        {item.consultant_name}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {item.details && item.details.expression_libre && (
                                        <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm text-gray-600 italic border border-gray-100 flex items-start gap-2">
                                            <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                            "{item.details.expression_libre.length > 100 ? item.details.expression_libre.substring(0, 100) + '...' : item.details.expression_libre}"
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-row md:flex-col items-center justify-between md:items-end gap-3 min-w-[120px]">
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Note Globale</div>
                                        <div className="flex items-center justify-end gap-1 font-bold text-xl text-gray-900">
                                            <Star className="h-5 w-5 text-[#e0a800] fill-[#e0a800]" />
                                            {item.score || '-'}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setSelectedItem(item)}
                                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all mt-auto"
                                    >
                                        Voir les détails
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal for Details */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 pt-20 pb-10 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="relative p-6 border-b border-gray-100 flex flex-col items-center text-center bg-gray-50">
                            <button onClick={() => setSelectedItem(null)} className="absolute right-4 top-4 p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                            <h3 className="text-xl font-black text-gray-900 mb-1">Détails du questionnaire</h3>
                            <p className="text-sm font-medium text-gray-500">
                                {selectedItem.type === 'client' ? 'Client' : 'Consultant'} : <strong className="text-gray-900 ml-1">{selectedItem.respondent_name || 'Anonyme'}</strong>
                            </p>
                            {selectedItem.consultant_name && (
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                                    {selectedItem.type === 'client' ? 'Consultant' : 'Client'} concerné : <strong className="text-gray-600">{selectedItem.consultant_name}</strong>
                                </p>
                            )}
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-white flex flex-col items-center">
                            <div className="flex flex-col items-center gap-3 bg-blue-50/50 p-6 rounded-2xl border border-blue-100 w-full max-w-md text-center">
                                <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-50">
                                    <Star className="h-10 w-10 text-[#e0a800] fill-[#e0a800]" />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-blue-800 uppercase tracking-widest mb-1">Note Globale</div>
                                    <div className="text-4xl font-black text-blue-900">{selectedItem.score || '-'} <span className="text-xl text-blue-700/50 font-bold">/ 10</span></div>
                                </div>
                            </div>
                            
                            <div className="space-y-4 w-full">
                                <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-6 pb-4 border-b border-gray-100 text-center flex items-center justify-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-gray-400" />
                                    Réponses détaillées
                                </h4>
                                {selectedItem.details && Object.keys(selectedItem.details).length > 0 ? (
                                    Object.entries(selectedItem.details).map(([key, value]) => {
                                        if (key === 'respondent_name' || key === 'consultant_name') return null;
                                        return (
                                            <div key={key} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 text-center hover:bg-gray-50 transition-colors">
                                                <div className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">{key.replace(/_/g, ' ')}</div>
                                                {typeof value === 'object' && value !== null ? (
                                                    <ul className="inline-block text-left list-none space-y-2 text-sm font-semibold text-gray-800">
                                                        {Object.entries(value).map(([subK, subV]) => (
                                                            <li key={subK} className="flex items-center gap-2 justify-center">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                                                                <span className="text-gray-500">{subK}:</span> {subV}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="text-base font-bold text-gray-800 whitespace-pre-wrap">{String(value)}</div>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-xl">Aucun détail supplémentaire.</div>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
                            <button onClick={() => setSelectedItem(null)} className="px-10 py-3 bg-gray-900 text-white rounded-xl font-black uppercase tracking-wider text-xs hover:bg-gray-800 transition-colors shadow-xl shadow-gray-900/20 active:scale-95">
                                Fermer les détails
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
