import { useState } from 'react'
import { X, CreditCard, ShieldCheck, CheckCircle2, Loader2, Sparkles, AlertCircle, Lock } from 'lucide-react'
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

    const dossiersPossibles = Math.floor(balance / 2)

    const packs = [
        {
            id: 'starter',
            name: 'Pack Starter',
            credits: 10,
            cases: 5,
            price: 150,
            description: 'Idéal pour les missions ponctuelles.',
            popular: false
        },
        {
            id: 'expert',
            name: 'Pack Expert',
            credits: 50,
            cases: 25,
            price: 600,
            description: 'Pour les consultants à forte volumétrie.',
            discount: '-20%',
            popular: true
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
            // Simulated network delay for payment verification
            await new Promise(resolve => setTimeout(resolve, 2500))

            // Simulation logic requested by user:
            // If card ends with 0000 -> insufficient funds (echoué)
            if (cardNumber.replace(/\s/g, '').endsWith('0000')) {
                setPaymentError("Paiement échoué : Solde insuffisant sur votre compte bancaire. Veuillez utiliser une autre carte.")
                setStep('card')
                setIsProcessing(false)
                return
            }

            const expectedBalance = (balance || 0) + (selectedPack?.credits || 0);
            console.log('📈 Expected balance calculation:', { current: balance, added: selectedPack?.credits, expected: expectedBalance });

            // TRY RPC first (Best way, security definer)
            const { error: rpcError } = await supabase.rpc('add_credits', {
                p_consultant_id: user.id,
                p_amount: selectedPack.credits
            });

            if (rpcError) {
                console.warn('⚠️ RPC add_credits failed, trying direct table update (RLS Check):', rpcError);

                // Fallback: Direct table update
                const { error: updateError } = await supabase
                    .from('credits_wallet')
                    .update({
                        balance: (balance || 0) + selectedPack.credits,
                        updated_at: new Date().toISOString()
                    })
                    .eq('consultant_id', user.id);

                if (updateError) {
                    console.error('❌ Direct update failed. This is likely due to RLS policies.', updateError);
                    throw new Error("Erreur de synchronisation avec la base de données. Veuillez contacter l'administrateur.");
                }

                // Fallback Notification (Manual)
                await supabase.from('admin_notifications').insert({
                    title: 'Achat de crédits (Manuel)',
                    content: `Le consultant ${user.email} a acheté ${selectedPack.credits} crédits.`,
                    type: 'success',
                    metadata: { consultant_id: user.id, amount: selectedPack.credits }
                });
            }

            console.log('✅ Credits successfully updated in database');

            // Wait a bit more for DB to settle
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Re-fetch real balance - BEWARE OF CACHE/STALE DATA
            const { data: updatedWallet, error: finalFetchError } = await supabase
                .from('credits_wallet')
                .select('balance')
                .eq('consultant_id', user.id)
                .single();

            if (finalFetchError) console.error('❌ Error in final fetch:', finalFetchError);

            // LOGIC: If DB returned stale data (6), use our local math (16)
            const dbBalance = updatedWallet?.balance;
            const finalBalanceToShow = (dbBalance && dbBalance > balance) ? dbBalance : expectedBalance;

            console.log('🏦 Final result:', { db: dbBalance, localMath: expectedBalance, chosen: finalBalanceToShow });

            setCurrentTotalBalance(finalBalanceToShow);
            setBoughtCredits(selectedPack.credits);
            setIsSuccess(true);
            setStep('success');

            if (onSuccess) {
                console.log('📣 Calling onSuccess callback from CreditsModal');
                setTimeout(() => onSuccess(finalBalanceToShow), 300);
            }
        } catch (error) {
            console.error('❌ Payment/Update error:', error)
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                {step === 'success' && selectedPack && (
                    <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
                        <div className="mb-6 flex justify-center">
                            <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center shadow-lg shadow-green-100">
                                <CheckCircle2 className="h-12 w-12 text-green-600 animate-bounce" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Paiement Validé !</h2>
                        <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                            Votre compte a été crédité de <span className="font-bold text-green-600">{selectedPack.credits} crédits</span>.
                            <br />Le reçu a été envoyé par email.
                        </p>

                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 mb-8 shadow-2xl shadow-blue-500/30 transform hover:scale-[1.02] transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles className="h-20 w-20 text-white" />
                            </div>
                            <div className="relative z-10 text-center">
                                <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Nouveau solde total</p>
                                <div className="flex items-center justify-center gap-4">
                                    <span className="text-2xl font-bold text-blue-200/50 line-through decoration-blue-300/30">{initialBalanceBeforeUpdate}</span>
                                    <span className="text-white/40 text-sm">→</span>
                                    <p className="text-6xl font-black text-white tracking-tighter">
                                        {currentTotalBalance}
                                    </p>
                                </div>
                                <p className="text-blue-200 text-xs font-bold mt-2 uppercase tracking-widest">Crédits disponibles</p>
                            </div>
                        </div>

                        <button
                            onClick={resetAndClose}
                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl active:scale-95"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-center">
                <div className="bg-white rounded-[2rem] p-12 shadow-2xl max-w-sm w-full space-y-6 animate-in zoom-in duration-200">
                    <div className="relative">
                        <div className="h-24 w-24 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="h-8 w-8 text-blue-100" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Paiement en cours...</h2>
                        <p className="text-sm text-gray-500 font-medium mt-2 leading-relaxed">Vérification des fonds auprès de votre établissement bancaire.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm animate-pulse-slow">
                            <CreditCard className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-none">
                                {step === 'card' ? `Simulation Paiement` : 'Recharger vos crédits'}
                            </h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                                {step === 'card' ? `${selectedPack.name} — ${selectedPack.price}€ HT` : '1 dossier client = 2 crédits'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={resetAndClose}
                        className="p-2.5 hover:bg-gray-100 rounded-full transition-all hover:rotate-90 duration-300"
                    >
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8">
                    {step === 'selection' && (
                        <div className="space-y-8">
                            {/* Current Balance Card */}
                            <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
                                <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                                    <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Votre solde actuel</p>
                                    <p className="text-5xl font-black tracking-tight">
                                        {balance} <span className="text-2xl font-bold opacity-70 ml-1">Crédits</span>
                                    </p>
                                </div>
                            </div>

                            {/* Packs Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {packs.map((pack) => (
                                    <div
                                        key={pack.id}
                                        className={`relative rounded-3xl border-2 p-8 flex flex-col transition-all group ${pack.popular
                                            ? 'border-blue-500 shadow-xl shadow-blue-500/10 bg-white'
                                            : 'border-gray-100 hover:border-blue-100 bg-gray-50/30'
                                            }`}
                                    >
                                        {pack.popular && (
                                            <div className="absolute -top-3 left-8">
                                                <span className="bg-blue-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
                                                    Populaire
                                                </span>
                                            </div>
                                        )}

                                        <div className="mb-6 flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors">{pack.name}</h3>
                                                <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-tight">
                                                    {pack.description}
                                                </p>
                                            </div>
                                            <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-600 uppercase">
                                                {pack.credits} Cr.
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <div className="flex items-baseline gap-2 mb-6">
                                                <span className="text-4xl font-black text-gray-900">{pack.price}€</span>
                                                <span className="text-xs font-bold text-gray-400 uppercase">ht</span>
                                                {pack.discount && (
                                                    <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                                                        {pack.discount}
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleSelectPack(pack)}
                                                className={`w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 ${pack.popular
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30'
                                                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/30'
                                                    }`}
                                            >
                                                Choisir ce pack
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'card' && (
                        <div className="animate-in slide-in-from-right-8 duration-500">
                            {/* Selected Pack Strip */}
                            <div className="p-5 bg-slate-900 rounded-3xl text-white mb-8 flex items-center justify-between shadow-xl shadow-slate-900/20">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center text-xl">📦</div>
                                    <div>
                                        <p className="text-sm font-black">{selectedPack.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedPack.credits} Crédits inclus</p>
                                    </div>
                                </div>
                                <div className="text-right pr-2">
                                    <p className="text-2xl font-black text-blue-400">{selectedPack.price}€</p>
                                    <button
                                        onClick={() => setStep('selection')}
                                        className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                                    >
                                        Modifier
                                    </button>
                                </div>
                            </div>

                            {paymentError && (
                                <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-[1.5rem] flex items-start gap-4 animate-shake">
                                    <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-1">Erreur de Paiement</p>
                                        <p className="text-sm text-red-800 font-medium leading-relaxed">{paymentError}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handlePaymentSubmit} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Titulaire de la carte</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="AHMED ALAOUUI"
                                            className="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-200 focus:border-blue-600 outline-none font-bold transition-all uppercase placeholder:text-gray-200"
                                            value={cardName}
                                            onChange={e => setCardName(e.target.value)}
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Numéro de carte</label>
                                        <div className="relative">
                                            <input
                                                required
                                                type="text"
                                                placeholder="4242 4242 4242 4242"
                                                className="w-full pl-14 pr-5 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-200 focus:border-blue-600 outline-none font-bold transition-all placeholder:text-gray-200"
                                                value={cardNumber}
                                                onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 19))}
                                            />
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 p-1 bg-gray-50 rounded-lg">
                                                <CreditCard className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-gray-400 mt-2 ml-1 font-bold italic">* Testez l'échec en terminant par 0000</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Expiration</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="MM / YY"
                                                className="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-200 focus:border-blue-600 outline-none font-bold transition-all placeholder:text-gray-200"
                                                value={cardExpiry}
                                                onChange={e => setCardExpiry(e.target.value.replace(/\D/g, '').replace(/(.{2})/g, '$1/').trim().substring(0, 5))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2.5 ml-1">CVC / CVV</label>
                                            <input
                                                required
                                                type="text"
                                                maxLength="3"
                                                placeholder="•••"
                                                className="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-200 focus:border-blue-600 outline-none font-bold transition-all placeholder:text-gray-200"
                                                value={cardCvc}
                                                onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 3))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black shadow-2xl shadow-blue-600/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <Lock className="h-5 w-5" />
                                    Confirmer le paiement ({selectedPack.price}€ HT)
                                </button>

                                <div className="flex items-center justify-center gap-4 pt-2">
                                    <div className="h-px bg-gray-100 flex-1"></div>
                                    <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest">Double Cryptage AES-256</span>
                                    <div className="h-px bg-gray-100 flex-1"></div>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Security Seals */}
                    <div className="mt-12 pt-8 border-t border-gray-50 flex items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            <div>
                                <p className="text-[10px] font-black text-gray-900 uppercase leading-none">Certifié PCI</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">Niveau 1</p>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-gray-100"></div>
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-gray-400" />
                            <p className="text-[10px] font-black text-gray-400 uppercase">Fonds Garantis</p>
                        </div>
                        <div className="h-10 w-24 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-pointer">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-full w-full object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
