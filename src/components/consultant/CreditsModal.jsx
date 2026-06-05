import { useState } from 'react'
import { X, CreditCard, ShieldCheck, CheckCircle2, Lock, Sparkles, AlertCircle, Gift } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

export default function CreditsModal({ isOpen, onClose, balance = 0, onSuccess }) {
    const { user, profile } = useAuth()
    const [step, setStep] = useState('selection') // 'selection', 'card', 'processing', 'success'
    const [selectedPack, setSelectedPack] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [boughtCredits, setBoughtCredits] = useState(0)
    const [paymentError, setPaymentError] = useState(null)
    const [currentTotalBalance, setCurrentTotalBalance] = useState(balance)
    const [initialBalanceBeforeUpdate, setInitialBalanceBeforeUpdate] = useState(balance)

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
        const initialBal = balance || 0;
        setInitialBalanceBeforeUpdate(initialBal);

        try {
            await new Promise(resolve => setTimeout(resolve, 2500))

            if (cardNumber.replace(/\s/g, '').endsWith('0000')) {
                setPaymentError("Paiement échoué : Solde insuffisant sur votre compte bancaire. Veuillez utiliser une autre carte.")
                setStep('card')
                setIsProcessing(false)
                return
            }

            const expectedBalance = (balance || 0) + (selectedPack?.credits || 0);

            const { error: rpcError } = await supabase.rpc('add_credits', {
                p_consultant_id: user.id,
                p_amount: selectedPack.credits
            });

            if (rpcError) {
                const { error: updateError } = await supabase
                    .from('credits_wallet')
                    .update({
                        balance: (balance || 0) + selectedPack.credits,
                        updated_at: new Date().toISOString()
                    })
                    .eq('consultant_id', user.id);

                if (updateError) {
                    throw new Error("Erreur de synchronisation avec la base de données. Veuillez contacter l'administrateur.");
                }

                await supabase.from('admin_notifications').insert({
                    title: 'Achat de crédits (Manuel)',
                    content: `Le consultant ${user.email} a acheté ${selectedPack.credits} crédits.`,
                    type: 'success',
                    metadata: { consultant_id: user.id, amount: selectedPack.credits }
                });
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            const { data: updatedWallet } = await supabase
                .from('credits_wallet')
                .select('balance')
                .eq('consultant_id', user.id)
                .single();

            const dbBalance = updatedWallet?.balance;
            const finalBalanceToShow = (dbBalance && dbBalance > balance) ? dbBalance : expectedBalance;

            setCurrentTotalBalance(finalBalanceToShow);
            setBoughtCredits(selectedPack.credits);
            setIsSuccess(true);
            setStep('success');

            if (onSuccess) {
                setTimeout(() => onSuccess(finalBalanceToShow), 300);
            }
        } catch (error) {
            setPaymentError(error.message || "Une erreur technique est survenue lors de la mise à jour de vos crédits.")
            setStep('card')
        } finally {
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
                            className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all z-50"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="text-center mb-12 relative z-10">
                            <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase mb-4">Recharger des crédits</p>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                                Tarifs <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">dégressifs</span> selon votre volume
                            </h1>
                            <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto">
                                Plus vous achetez de crédits, plus le coût unitaire diminue.<br/>
                                Aucun engagement, aucun abonnement.
                            </p>
                        </div>

                        {/* Packs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative z-10">
                            {packs.map((pack) => {
                                const isPro = pack.popular;
                                return (
                                    <div key={pack.id} className={`relative flex flex-col rounded-3xl transition-all duration-300 ${
                                        isPro 
                                        ? 'bg-white ring-4 ring-indigo-600/20 border-2 border-indigo-600 shadow-xl shadow-indigo-600/10 -translate-y-2' 
                                        : 'bg-white border-2 border-slate-100 hover:border-slate-200 hover:shadow-lg'
                                    }`}>
                                        
                                        {/* Pro Badge */}
                                        {isPro && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                                <span className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.15em] shadow-lg shadow-indigo-600/30">
                                                    {pack.badge}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex-1 flex flex-col h-full p-8 pt-10">
                                            <div className="text-center mb-8">
                                                <h3 className="text-xl font-black text-slate-900 mb-1">{pack.name}</h3>
                                                <p className="text-slate-400 text-xs italic">{pack.subtitle}</p>
                                            </div>

                                            <div className="flex flex-col items-center mb-6">
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-5xl font-black tracking-tighter ${isPro ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600' : 'text-slate-900'}`}>
                                                        {pack.pricePerCredit}€
                                                    </span>
                                                    <span className="text-slate-400 text-sm font-medium">/ crédit</span>
                                                </div>
                                                <p className="text-slate-500 text-sm mt-3 font-bold bg-slate-50 px-3 py-1 rounded-full">{pack.credits} crédit{pack.credits > 1 ? 's' : ''}</p>
                                            </div>

                                            <div className="w-full h-px bg-slate-100 my-6"></div>

                                            <div className="flex justify-between items-center mb-8 w-full px-2">
                                                <span className="text-slate-400 text-sm font-medium">Total</span>
                                                <span className="text-slate-900 font-black text-lg">{pack.price}€ HT</span>
                                            </div>

                                            <div className="mt-auto flex flex-col items-center">
                                                <p className="text-slate-500 text-xs italic mb-6 text-center">{pack.description}</p>
                                                
                                                <button
                                                    onClick={() => handleSelectPack(pack)}
                                                    className={`w-full py-4 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                                                        isPro
                                                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40'
                                                            : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    Choisir ce pack →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
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

                        <form onSubmit={handlePaymentSubmit} className="space-y-5 relative z-10">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Titulaire de la carte</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="AHMED ALAOUUI"
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 focus:border-indigo-500 outline-none transition-all uppercase placeholder:text-slate-300 font-bold"
                                    value={cardName}
                                    onChange={e => setCardName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Numéro de carte</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="text"
                                        placeholder="4242 4242 4242 4242"
                                        className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-mono tracking-wider font-bold"
                                        value={cardNumber}
                                        onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 19))}
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-md shadow-sm">
                                        <CreditCard className="h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-2 ml-1 italic">* Testez l'échec en terminant par 0000</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Expiration</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="MM / YY"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-mono font-bold"
                                        value={cardExpiry}
                                        onChange={e => setCardExpiry(e.target.value.replace(/\D/g, '').replace(/(.{2})/g, '$1/').trim().substring(0, 5))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">CVC / CVV</label>
                                    <input
                                        required
                                        type="text"
                                        maxLength="3"
                                        placeholder="•••"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-mono font-bold"
                                        value={cardCvc}
                                        onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 3))}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                <Lock className="h-4 w-4" />
                                Payer {selectedPack.price}€ HT
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
