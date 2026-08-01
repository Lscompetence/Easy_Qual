/* eslint-disable */
import { useState, useEffect } from 'react'
import { X, CreditCard, ShieldCheck, CheckCircle2, Lock, Sparkles, AlertCircle, Gift } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

export default function CreditsModal({ isOpen, onClose, balance = 0, onSuccess, initialStep = 'selection', initialSelectedPack = null }) {
    const { user, profile } = useAuth()
    const [step, setStep] = useState(initialStep) // 'selection', 'card', 'processing', 'success'
    const [selectedPack, setSelectedPack] = useState(initialSelectedPack)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [boughtCredits, setBoughtCredits] = useState(0)
    const [paymentError, setPaymentError] = useState(null)
    const [currentTotalBalance, setCurrentTotalBalance] = useState(balance)
    const [initialBalanceBeforeUpdate, setInitialBalanceBeforeUpdate] = useState(balance)
    const [quantities, setQuantities] = useState({
        decouverte: 1,
        pro: 5,
        expert: 10
    })

    useEffect(() => {
        if (isOpen) {
            setStep(initialStep)
            setSelectedPack(initialSelectedPack)
            if (initialSelectedPack) {
                const credits = initialSelectedPack.credits || 1
                if (credits >= 10) {
                    setQuantities(prev => ({ ...prev, expert: credits }))
                } else if (credits >= 5) {
                    setQuantities(prev => ({ ...prev, pro: credits }))
                } else {
                    setQuantities(prev => ({ ...prev, decouverte: credits }))
                }
            }
            if (initialStep === 'success' && initialSelectedPack) {
                setIsSuccess(true)
                const packCredits = initialSelectedPack.credits || 0
                setInitialBalanceBeforeUpdate(Math.max(0, balance - packCredits))
                setCurrentTotalBalance(balance)
                setBoughtCredits(packCredits)
            } else {
                setIsSuccess(false)
            }
        }
    }, [isOpen, initialStep, initialSelectedPack, balance])

    // Form states for credit card
    const [cardName, setCardName] = useState('')
    const [cardNumber, setCardNumber] = useState('')
    const [cardExpiry, setCardExpiry] = useState('')
    const [cardCvc, setCardCvc] = useState('')

    if (!isOpen) return null

    const packs = [
        {
            id: 'decouverte',
            name: 'Pack Découverte',
            subtitle: 'Pour démarrer',
            pricePerCredit: 200,
            credits: 1,
            price: 200,
            description: 'Idéal pour un premier dossier',
            popular: false
        },
        {
            id: 'pro',
            name: 'Pack Pro',
            subtitle: 'Le bon équilibre',
            pricePerCredit: 180,
            credits: 5,
            price: 900,
            description: 'Pour les consultants actifs',
            popular: true,
            badge: 'LE PLUS CHOISI'
        },
        {
            id: 'expert',
            name: 'Pack Expert',
            subtitle: "Maximum d'économies",
            pricePerCredit: 160,
            credits: 10,
            price: 1600,
            description: 'Pour les cabinets et gros volumes',
            popular: false
        }
    ]

    const handleSelectPack = (pack) => {
        setSelectedPack(pack)
        setStep('card')
    }

    const handlePaymentSubmit = async (e) => {
        e.preventDefault()

        if (profile?.is_active === false) {
            setPaymentError("Votre compte est suspendu. Vous ne pouvez pas recharger de crédits actuellement.")
            return
        }

        setPaymentError(null)
        setIsProcessing(true)
        setStep('processing')

        try {
            const bodyPayload = selectedPack.id === 'custom'
                ? { customQuantity: selectedPack.credits }
                : { packId: selectedPack.id };

            const { data, error } = await supabase.functions.invoke('stripe', {
                body: bodyPayload
            })

            if (error || !data?.url) {
                throw new Error(error?.message || "Impossible d'initier la session de paiement Stripe.")
            }

            // Redirect to Stripe checkout
            window.location.href = data.url
        } catch (error) {
            setPaymentError(error.message || "Une erreur technique est survenue lors de l'initialisation du paiement.")
            setStep('card')
            setIsProcessing(false)
        }
    }

    const resetAndClose = () => {
        setStep('selection')
        setSelectedPack(null)
        setIsSuccess(false)
        setPaymentError(null)
        setCardName('')
        setCardNumber('')
        setCardExpiry('')
        setCardCvc('')
        onClose()
    }

    // --- VIEW: SUCCESS ---
    if (step === 'success') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                {step === 'success' && selectedPack && (
                    <div className="bg-white border border-slate-100 rounded-[2rem] p-10 max-w-sm w-full text-center relative overflow-hidden animate-in fade-in zoom-in duration-500 shadow-2xl">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                        <div className="mb-6 flex justify-center relative z-10">
                            <div className="h-24 w-24 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-bounce" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2 relative z-10">Paiement Validé !</h2>
                        <p className="text-slate-500 mb-8 max-w-xs mx-auto relative z-10 text-sm">
                            Votre compte a été crédité de <span className="font-bold text-emerald-600">{selectedPack.credits} crédits</span>.
                            <br />Le reçu a été envoyé par email.
                        </p>

                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 mb-8 shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                                <Sparkles className="h-20 w-20 text-white" />
                            </div>
                            <div className="relative z-10 text-center">
                                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Nouveau solde</p>
                                <div className="flex items-center justify-center gap-4">
                                    <span className="text-2xl font-bold text-indigo-300/50 line-through">{initialBalanceBeforeUpdate}</span>
                                    <span className="text-indigo-300 text-sm">→</span>
                                    <p className="text-6xl font-black text-white tracking-tighter">
                                        {currentTotalBalance}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={resetAndClose}
                            className="relative z-10 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                        >
                            Terminer
                        </button>
                    </div>
                )}
            </div>
        )
    }

    // --- VIEW: PROCESSING ---
    if (step === 'processing') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-center">
                <div className="bg-white border border-slate-100 rounded-[2rem] p-12 shadow-2xl max-w-sm w-full space-y-6 animate-in zoom-in duration-200">
                    <div className="relative">
                        <div className="h-24 w-24 border-4 border-slate-50 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="h-8 w-8 text-indigo-200" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Paiement en cours...</h2>
                        <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">Vérification sécurisée auprès de votre établissement bancaire.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto py-10" onClick={resetAndClose}>
            <div className={`relative w-full ${step === 'selection' ? 'max-w-6xl' : 'max-w-md'} animate-in fade-in zoom-in-95 duration-300 my-auto`} onClick={(e) => e.stopPropagation()}>
                
                {step === 'selection' ? (
                    // --- FULL MODAL LAYOUT FOR SELECTION ---
                    <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 md:p-14 relative overflow-hidden">
                        
                        <button
                            type="button"
                            onClick={resetAndClose}
                            className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all z-50 cursor-pointer"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="text-center mb-12 relative z-10">
                            <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-4">Recharger des crédits</p>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                                Tarifs <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">dégressifs</span> selon votre volume
                            </h1>
                            <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto">
                                Choisissez le pack adapté et ajustez le nombre exact de crédits dont vous avez besoin.
                            </p>
                        </div>

                        {/* Packs Grid with Internal Range Selectors */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full relative z-10">
                            
                            {/* Card 1: Pack Découverte (Range 1 - 4) */}
                            <div className="relative flex flex-col rounded-3xl transition-all duration-300 bg-white border-2 border-slate-100 hover:border-slate-200 hover:shadow-lg">
                                <div className="flex-1 flex flex-col h-full p-8 pt-10">
                                    <div className="text-center mb-6">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                                            Palier 1 · 200€ / crédit
                                        </span>
                                        <h3 className="text-2xl font-black text-slate-900 mt-4 mb-1">Pack Découverte</h3>
                                        <p className="text-slate-400 text-xs italic">De 1 à 4 crédits</p>
                                    </div>

                                    <div className="flex flex-col items-center mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Quantité (Max 4)</p>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setQuantities(prev => ({ ...prev, decouverte: Math.max(1, prev.decouverte - 1) }))}
                                                className="h-10 w-10 rounded-lg bg-white border border-slate-200 hover:border-slate-350 text-slate-650 font-bold text-lg flex items-center justify-center transition-all hover:bg-slate-50 shadow-sm active:scale-95 cursor-pointer"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                id="qty-decouverte"
                                                min="1"
                                                max="4"
                                                value={quantities.decouverte}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (!isNaN(val)) setQuantities(prev => ({ ...prev, decouverte: Math.max(1, Math.min(4, val)) }));
                                                }}
                                                className="h-10 w-16 text-center font-black text-slate-900 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none text-base bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setQuantities(prev => ({ ...prev, decouverte: Math.min(4, prev.decouverte + 1) }))}
                                                className="h-10 w-10 rounded-lg bg-white border border-slate-200 hover:border-slate-350 text-slate-650 font-bold text-lg flex items-center justify-center transition-all hover:bg-slate-50 shadow-sm active:scale-95 cursor-pointer"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-slate-100 my-4"></div>

                                    {/* Private calculation details */}
                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                                            <span>Calcul</span>
                                            <span>Montant</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>{quantities.decouverte} crédit{quantities.decouverte > 1 ? 's' : ''} × 200€</span>
                                            <span className="font-bold">{quantities.decouverte * 200}€ HT</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4">
                                        <button
                                            type="button"
                                            id="btn-order-decouverte"
                                            onClick={() => {
                                                setSelectedPack({
                                                    id: 'decouverte',
                                                    name: 'Pack Découverte',
                                                    credits: quantities.decouverte,
                                                    pricePerCredit: 200,
                                                    price: quantities.decouverte * 200
                                                });
                                                setStep('card');
                                            }}
                                            className="w-full py-3.5 bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                                        >
                                            Commander ({quantities.decouverte * 200}€ HT) →
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Pack Pro (Range 5 - 9) with Exceptional Visual Effect when quantity is 9 */}
                            <div 
                                id="card-pro"
                                className={`relative flex flex-col rounded-3xl transition-all duration-500 border-2 ${
                                    quantities.pro === 9 
                                        ? 'glow-card-9 shadow-2xl shadow-indigo-500/20' 
                                        : 'bg-white border-indigo-500/30 ring-4 ring-indigo-650/5 shadow-xl -translate-y-1'
                                }`}
                            >
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                    <span className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.15em] shadow-lg shadow-indigo-600/30">
                                        Palier 2 · 180€ / crédit
                                    </span>
                                </div>

                                <div className="flex-1 flex flex-col h-full p-8 pt-10">
                                    <div className="text-center mb-6">
                                        <h3 className={`text-2xl font-black mt-4 mb-1 ${quantities.pro === 9 ? 'text-white' : 'text-slate-900'}`}>Pack Pro</h3>
                                        <p className={`${quantities.pro === 9 ? 'text-indigo-200' : 'text-slate-400'} text-xs italic`}>De 5 à 9 crédits</p>
                                    </div>

                                    {/* Exceptional Effect Alert inside the Card for Qty = 9 */}
                                    {quantities.pro === 9 && (
                                        <div className="mb-6 p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 rounded-2xl border border-amber-300 shadow-xl relative overflow-hidden animate-pulse">
                                            <div className="relative z-10 text-center">
                                                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                                    <Sparkles className="h-4 w-4 text-slate-950 animate-bounce" />
                                                    <span className="text-[10px] font-black uppercase tracking-wider">Opportunité Commerciale !</span>
                                                </div>
                                                <p className="text-xs leading-snug font-bold">
                                                    10 crédits vous coûtent <span className="font-extrabold underline text-red-700">1 600 € HT</span> au lieu de 1 620 € HT (soit 20 € de moins !)
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setQuantities(prev => ({ ...prev, expert: 10 }));
                                                        const expCard = document.getElementById('card-expert');
                                                        if (expCard) {
                                                            expCard.scrollIntoView({ behavior: 'smooth' });
                                                            expCard.classList.add('ring-8', 'ring-amber-500/50');
                                                            setTimeout(() => expCard.classList.remove('ring-8', 'ring-amber-500/50'), 1500);
                                                        }
                                                    }}
                                                    className="mt-3.5 w-full py-2 bg-slate-950 text-white text-xs font-black rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer"
                                                >
                                                    Passer à 10 crédits
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`flex flex-col items-center mb-6 rounded-2xl p-4 border ${
                                        quantities.pro === 9 
                                            ? 'bg-slate-900/50 border-slate-700/50' 
                                            : 'bg-slate-50 border-slate-100'
                                    }`}>
                                        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${quantities.pro === 9 ? 'text-indigo-200' : 'text-slate-400'}`}>Quantité (5 à 9)</p>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setQuantities(prev => ({ ...prev, pro: Math.max(5, prev.pro - 1) }))}
                                                className={`h-10 w-10 rounded-lg border font-bold text-lg flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer ${
                                                    quantities.pro === 9 
                                                        ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' 
                                                        : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                                                }`}
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                id="qty-pro"
                                                min="5"
                                                max="9"
                                                value={quantities.pro}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (!isNaN(val)) setQuantities(prev => ({ ...prev, pro: Math.max(5, Math.min(9, val)) }));
                                                }}
                                                className={`h-10 w-16 text-center font-black border-2 rounded-lg focus:border-indigo-500 focus:outline-none text-base ${
                                                    quantities.pro === 9 
                                                        ? 'bg-slate-800 border-slate-700 text-white' 
                                                        : 'bg-white border-slate-200 text-slate-900'
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setQuantities(prev => ({ ...prev, pro: Math.min(9, prev.pro + 1) }))}
                                                className={`h-10 w-10 rounded-lg border font-bold text-lg flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer ${
                                                    quantities.pro === 9 
                                                        ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' 
                                                        : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                                                }`}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`w-full h-px my-4 ${quantities.pro === 9 ? 'bg-slate-800' : 'bg-slate-100'}`}></div>

                                    {/* Private calculation details */}
                                    <div className="space-y-2 mb-6">
                                        <div className={`flex justify-between text-xs font-bold uppercase tracking-wider ${quantities.pro === 9 ? 'text-indigo-300' : 'text-slate-400'}`}>
                                            <span>Calcul</span>
                                            <span>Montant</span>
                                        </div>
                                        <div className={`flex justify-between text-sm ${quantities.pro === 9 ? 'text-slate-200' : 'text-slate-650'}`}>
                                            <span>{quantities.pro} crédit{quantities.pro > 1 ? 's' : ''} × 180€</span>
                                            <span className="font-bold">{quantities.pro * 180}€ HT</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4">
                                        <button
                                            type="button"
                                            id="btn-order-pro"
                                            onClick={() => {
                                                setSelectedPack({
                                                    id: 'pro',
                                                    name: 'Pack Pro',
                                                    credits: quantities.pro,
                                                    pricePerCredit: 180,
                                                    price: quantities.pro * 180
                                                });
                                                setStep('card');
                                            }}
                                            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-md ${
                                                quantities.pro === 9 
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-amber-500/20 hover:scale-[1.01]' 
                                                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-indigo-600/25'
                                            }`}
                                        >
                                            Commander ({quantities.pro * 180}€ HT) →
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Pack Expert (Range 10+) */}
                            <div 
                                id="card-expert"
                                className="relative flex flex-col rounded-3xl transition-all duration-300 bg-white border-2 border-slate-100 hover:border-slate-200 hover:shadow-lg"
                            >
                                <div className="flex-1 flex flex-col h-full p-8 pt-10">
                                    <div className="text-center mb-6">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                                            Palier 3 · 160€ / crédit
                                        </span>
                                        <h3 className="text-2xl font-black text-slate-900 mt-4 mb-1">Pack Expert</h3>
                                        <p className="text-slate-400 text-xs italic">10 crédits et plus</p>
                                    </div>

                                    <div className="flex flex-col items-center mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Quantité (Min 10)</p>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setQuantities(prev => ({ ...prev, expert: Math.max(10, prev.expert - 1) }))}
                                                className="h-10 w-10 rounded-lg bg-white border border-slate-200 hover:border-slate-350 text-slate-650 font-bold text-lg flex items-center justify-center transition-all hover:bg-slate-50 shadow-sm active:scale-95 cursor-pointer"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                id="qty-expert"
                                                min="10"
                                                max="999"
                                                value={quantities.expert}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (!isNaN(val)) setQuantities(prev => ({ ...prev, expert: Math.max(10, Math.min(999, val)) }));
                                                }}
                                                className="h-10 w-16 text-center font-black text-slate-900 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none text-base bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setQuantities(prev => ({ ...prev, expert: Math.min(999, prev.expert + 1) }))}
                                                className="h-10 w-10 rounded-lg bg-white border border-slate-200 hover:border-slate-350 text-slate-650 font-bold text-lg flex items-center justify-center transition-all hover:bg-slate-50 shadow-sm active:scale-95 cursor-pointer"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-slate-100 my-4"></div>

                                    {/* Private calculation details */}
                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                                            <span>Calcul</span>
                                            <span>Montant</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>{quantities.expert} crédit{quantities.expert > 1 ? 's' : ''} × 160€</span>
                                            <span className="font-bold">{quantities.expert * 160}€ HT</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4">
                                        <button
                                            type="button"
                                            id="btn-order-expert"
                                            onClick={() => {
                                                setSelectedPack({
                                                    id: 'expert',
                                                    name: 'Pack Expert',
                                                    credits: quantities.expert,
                                                    pricePerCredit: 160,
                                                    price: quantities.expert * 160
                                                });
                                                setStep('card');
                                            }}
                                            className="w-full py-3.5 bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                                        >
                                            Commander ({quantities.expert * 160}€ HT) →
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Bottom Banner */}
                        <div className="mt-12 max-w-2xl mx-auto border-2 border-dashed border-emerald-200 bg-emerald-50 rounded-2xl p-4 flex items-center justify-center gap-3 relative z-10">
                            <div className="p-2 bg-emerald-100 rounded-full">
                                <Gift className="h-5 w-5 text-emerald-600" />
                            </div>
                            <p className="text-emerald-800 text-sm">
                                <span className="font-black text-emerald-600">1er crédit offert</span> sous condition d'achat d'un crédit minimum.
                            </p>
                        </div>
                    </div>

                ) : (
                    // --- CARD LAYOUT ---
                    <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
                        <button
                            type="button"
                            onClick={resetAndClose}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 transition-colors z-50 cursor-pointer"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        
                        <div className="relative z-10 mb-8">
                            <h2 className="text-2xl font-black text-slate-900">Finaliser l'achat</h2>
                            <p className="text-slate-500 text-sm mt-2">Pack sélectionné : <span className="text-slate-900 font-bold">{selectedPack.name}</span> ({selectedPack.price}€ HT)</p>
                        </div>

                        {paymentError && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 relative z-10 animate-shake">
                                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-1">Erreur</p>
                                    <p className="text-xs text-red-800 leading-relaxed">{paymentError}</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-50 rounded-2xl p-6 mb-6 relative z-10 border border-slate-100">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Récapitulatif de la commande</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Pack sélectionné :</span>
                                    <span className="font-bold text-slate-900">{selectedPack.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Crédits inclus :</span>
                                    <span className="font-bold text-indigo-600">+{selectedPack.credits} crédit{selectedPack.credits > 1 ? 's' : ''}</span>
                                </div>
                                <div className="h-px bg-slate-200 my-2"></div>
                                <div className="flex justify-between text-base">
                                    <span className="font-bold text-slate-900">Total à payer :</span>
                                    <span className="font-black text-indigo-600">{selectedPack.price}€ HT</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl flex items-start gap-3 relative z-10 text-xs text-blue-800 leading-relaxed">
                            <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <p>
                                Le paiement est géré de manière entièrement sécurisée par **Stripe**. Vous allez être redirigé vers leur plateforme pour finaliser la transaction (prend en charge Apple Pay, Google Pay et Cartes Bancaires).
                            </p>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="space-y-5 relative z-10">
                            <button
                                type="submit"
                                className="w-full mt-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                            >
                                <Lock className="h-4 w-4" />
                                Procéder au paiement sécurisé →
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => setStep('selection')}
                                className="w-full py-3 bg-transparent text-slate-400 hover:text-slate-700 text-xs font-bold uppercase tracking-widest transition-colors mt-2"
                            >
                                ← Retour aux packs
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3 relative z-10">
                            <div className="flex items-center gap-4 text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    <span className="text-[9px] uppercase tracking-widest">Paiement Sécurisé</span>
                                </div>
                                <div className="h-3 w-px bg-slate-200"></div>
                                <span className="text-[9px] uppercase tracking-widest">Cryptage SSL 256-bit</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
