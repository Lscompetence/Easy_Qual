 
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, HelpCircle, Trophy, AlertCircle, Play, ArrowRight, ArrowLeft, CheckSquare } from 'lucide-react';
import { QUIZ_DATA } from '../../data/qcmData';
import { getCriterionColor } from '../../utils/theme';

export default function QuizModal({ isOpen, onClose, criterionId, criterionLabel, onComplete, onFail }) {
    const [step, setStep] = useState('intro'); // intro, questions, result
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [currentSelection, setCurrentSelection] = useState([]);
    const [score, setScore] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [direction, setDirection] = useState('next');

    const questions = QUIZ_DATA[criterionId] || QUIZ_DATA['1']; // fallback to crit 1 if not found

     
     
    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- réinitialisation volontaire du quiz à chaque ouverture du modal
            setStep('intro');
            setCurrentQuestion(0);
            setAnswers([]);
            setCurrentSelection([]);
            setScore(0);
            setDirection('next');
        }
    }, [isOpen]);

    const handleStart = () => {
        setStep('questions');
    };

    const toggleOption = (optionIdx) => {
        const isMultiple = questions[currentQuestion].multiple;
        
        if (isMultiple) {
            setCurrentSelection(prev => {
                if (prev.includes(optionIdx)) {
                    return prev.filter(i => i !== optionIdx);
                } else {
                    return [...prev, optionIdx];
                }
            });
        } else {
            setCurrentSelection([optionIdx]);
        }
    };

    const handleNext = () => {
        if (currentSelection.length === 0) return; // Force selection
        
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = currentSelection;
        setAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {
            setDirection('next');
            setCurrentQuestion(prev => prev + 1);
            setCurrentSelection(newAnswers[currentQuestion + 1] || []);
        } else {
            calculateResult(newAnswers);
        }
    };

    const handlePrev = () => {
        if (currentQuestion > 0) {
            // Save current selection before going back
            const newAnswers = [...answers];
            newAnswers[currentQuestion] = currentSelection;
            setAnswers(newAnswers);

            setDirection('prev');
            setCurrentQuestion(prev => prev - 1);
            setCurrentSelection(newAnswers[currentQuestion - 1] || []);
        }
    };

    const calculateResult = (finalAnswers) => {
        setIsSubmitting(true);
        let totalPoints = 0;

        finalAnswers.forEach((ansArray, idx) => {
            const q = questions[idx];
            const correctAns = q.correct; // array of correct indices

            // Check if any wrong answer is selected
            const hasWrongAnswer = ansArray.some(a => !correctAns.includes(a));
            
            if (hasWrongAnswer) {
                // 0 points if any wrong answer is checked
                totalPoints += 0;
            } else {
                // count how many correct answers were checked
                const correctChecked = ansArray.filter(a => correctAns.includes(a)).length;
                totalPoints += (correctChecked / correctAns.length);
            }
        });
        
        const finalScore = Math.round((totalPoints / questions.length) * 100);
        setScore(finalScore);
        
        setTimeout(() => {
            setStep('result');
            setIsSubmitting(false);
            if (finalScore >= 80) {
                onComplete?.(finalScore, { questions, answers: finalAnswers });
            } else {
                onFail?.(finalScore, { questions, answers: finalAnswers });
            }
        }, 800);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 lg:p-6 sm:p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-2xl transition-opacity" onClick={onClose} />
            
            {/* Modal Content */}
            <div className="relative bg-white/95 backdrop-blur-3xl w-full max-w-4xl h-full lg:h-auto lg:min-h-[600px] lg:max-h-[90vh] lg:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300 border border-white/20">
                
                {/* Global Progress Bar */}
                {step === 'questions' && (
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100/50 z-50">
                        <div 
                            className="h-full transition-all duration-500 ease-out" 
                            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%`, background: getCriterionColor(criterionId).primary }}
                        />
                    </div>
                )}

                {/* Top Nav */}
                <div className="px-8 py-6 border-b border-slate-200/50 flex justify-between items-center bg-white/50 backdrop-blur-xl">
                    <div className="flex items-center gap-5">
                        <div className="h-12 w-12 text-white rounded-2xl flex items-center justify-center font-black shadow-lg" style={{ background: getCriterionColor(criterionId).primary }}>
                            {step === 'questions' ? currentQuestion + 1 : <HelpCircle className="h-6 w-6" />}
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Évaluation des acquis</h2>
                            <p className="text-[11px] font-bold uppercase tracking-tighter mt-0.5" style={{ color: getCriterionColor(criterionId).primary }}>Critère {criterionId} • {criterionLabel}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white hover:bg-rose-50 rounded-2xl transition-all text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col relative overflow-y-auto bg-white/80">
                    
                    {step === 'intro' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="relative mb-6 lg:mb-8">
                                <div className="absolute -inset-6 rounded-full blur-3xl opacity-20 animate-pulse" style={{ background: getCriterionColor(criterionId).primary }} />
                                <div className="relative h-24 w-24 bg-white border-4 rounded-[2rem] flex items-center justify-center shadow-2xl" style={{ borderColor: getCriterionColor(criterionId).light }}>
                                    <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: getCriterionColor(criterionId).light }}>
                                        <Play className="h-8 w-8 ml-1.5" style={{ color: getCriterionColor(criterionId).primary }} />
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">Test de Validation</h3>
                            
                            <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 mb-8 w-full max-w-2xl text-left shadow-inner">
                                <h4 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: getCriterionColor(criterionId).primary }}>
                                    <HelpCircle className="h-4 w-4" /> Règles de l'évaluation
                                </h4>
                                <ul className="space-y-2.5 text-sm text-slate-600 font-medium">
                                    <li className="flex items-start gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: getCriterionColor(criterionId).primary }} />
                                        <span><strong className="text-slate-800">10 questions</strong> valant chacune 1 point (Total = 10 points).</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: getCriterionColor(criterionId).primary }} />
                                        <span>Il peut y avoir <strong className="font-bold" style={{ color: getCriterionColor(criterionId).primary }}>une ou plusieurs bonnes réponses</strong> par question.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: getCriterionColor(criterionId).primary }} />
                                        <span><strong className="text-slate-800">Notation :</strong> Le point est divisé par le nombre de bonnes réponses. <br/><span className="text-rose-500 text-xs italic">*Attention : cocher une mauvaise réponse annule tous les points de la question (Score = 0).</span></span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: getCriterionColor(criterionId).primary }} />
                                        <span>Seuil de réussite exigé : <strong className="text-base" style={{ color: getCriterionColor(criterionId).primary }}>80%</strong> minimum.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: getCriterionColor(criterionId).primary }} />
                                        <span className="text-slate-500 text-xs">La validation du test n'est pas obligatoire pour passer au module suivant. Vous pouvez continuer et revenir refaire le test plus tard.</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mb-8">
                                <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Questions</p>
                                    <p className="text-xl font-black text-slate-900">{questions.length}</p>
                                </div>
                                <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Seuil de réussite</p>
                                    <p className="text-xl font-black" style={{ color: getCriterionColor(criterionId).primary }}>80%</p>
                                </div>
                            </div>

                            <button 
                                onClick={handleStart}
                                className="group w-full max-w-md py-4 lg:py-5 text-white rounded-[2rem] font-black text-base uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 border border-white/20" style={{ background: getCriterionColor(criterionId).primary }}
                            >
                                Commencer le Quiz
                                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}

                    {step === 'questions' && (
                        <div className="flex-1 flex flex-col p-8 lg:p-12">
                            <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
                                <div className={`transition-all duration-300 transform ${direction === 'next' ? 'animate-in slide-in-from-right-12' : 'animate-in slide-in-from-left-12'} fade-in`}>
                                    <div className="mb-10">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="h-2 w-16 rounded-full" style={{ background: getCriterionColor(criterionId).primary }} />
                                            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full" style={{ backgroundColor: getCriterionColor(criterionId).light, color: getCriterionColor(criterionId).primary }}>
                                                Question {currentQuestion + 1} sur {questions.length}
                                            </span>
                                            {questions[currentQuestion].multiple && (
                                                <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5" style={{ backgroundColor: getCriterionColor(criterionId).light, color: getCriterionColor(criterionId).primary }}>
                                                    <CheckSquare className="h-3.5 w-3.5" /> Choix Multiples
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-3xl lg:text-4xl font-black text-slate-900 leading-[1.2] tracking-tight">
                                            {questions[currentQuestion].q}
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {questions[currentQuestion].options.map((opt, idx) => {
                                            const isSelected = currentSelection.includes(idx);
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => toggleOption(idx)}
                                                    disabled={isSubmitting}
                                                    className={`group relative w-full p-8 rounded-[2rem] border-2 text-left transition-all duration-300 flex items-center justify-between overflow-hidden ${isSelected ? "text-white shadow-xl scale-[1.01]" : "bg-white border-slate-200 text-slate-600 hover:shadow-xl hover:border-slate-300"}`} style={isSelected ? { backgroundColor: getCriterionColor(criterionId).primary, borderColor: getCriterionColor(criterionId).primary } : {}}
                                                >
                                                    <div className="relative z-10 pr-6">
                                                        <span className={`block text-[11px] font-black uppercase tracking-widest mb-1.5 ${isSelected ? "opacity-80" : "text-slate-400"}`}>
                                                            Option {String.fromCharCode(65 + idx)}
                                                        </span>
                                                        <span className="text-lg font-bold leading-snug">{opt}</span>
                                                    </div>
                                                    <div className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                                        isSelected 
                                                            ? 'border-white bg-white/20 rotate-0 scale-110' 
                                                            : 'border-slate-200 bg-slate-50 rotate-90 opacity-0 group-hover:opacity-100 group-hover:rotate-0'
                                                    }`}>
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-10 border-t border-slate-200/50 flex justify-between items-center relative z-10">
                                <button 
                                    onClick={handlePrev}
                                    disabled={currentQuestion === 0}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-black transition-all ${
                                        currentQuestion === 0 ? 'text-slate-300 cursor-not-allowed' : 'bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100 shadow-sm border border-slate-200'
                                    }`}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                    Précédent
                                </button>
                                
                                <button
                                    onClick={handleNext}
                                    disabled={currentSelection.length === 0}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${currentSelection.length === 0 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "text-white shadow-lg hover:scale-105 active:scale-95 hover:opacity-90"}`} style={currentSelection.length > 0 ? { backgroundColor: getCriterionColor(criterionId).primary } : {}}
                                >
                                    {currentQuestion === questions.length - 1 ? 'Terminer' : 'Valider'}
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'result' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 text-center animate-in zoom-in-95 fade-in duration-700">
                            <div className="relative mb-14">
                                <div className={`absolute -inset-10 rounded-full blur-3xl opacity-40 animate-pulse ${score >= 80 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                <div className={`relative h-40 w-40 rounded-[3rem] flex items-center justify-center shadow-2xl ${
                                    score >= 80 
                                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/40' 
                                        : 'bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-rose-500/40'
                                }`}>
                                    {score >= 80 ? <Trophy className="h-20 w-20" /> : <AlertCircle className="h-20 w-20" />}
                                </div>
                            </div>
                            
                            <div className="mb-10">
                                <h3 className="text-7xl font-black text-slate-900 tracking-tighter">{score}%</h3>
                                <p className={`text-2xl font-black uppercase tracking-widest mt-4 flex items-center justify-center gap-3 ${
                                    score >= 80 ? 'text-emerald-600' : (score >= 60 ? 'text-amber-500' : 'text-rose-600')
                                }`}>
                                    {score >= 80 ? 'Test Réussi !' : (score >= 60 ? 'Presque !' : 'Score insuffisant')}
                                </p>
                            </div>

                            <p className="text-xl text-slate-600 max-w-xl mb-14 font-medium leading-relaxed">
                                {score >= 80 
                                    ? (criterionId === '7' 
                                        ? "Félicitations ! Vous avez bien compris les enjeux du critère 7. Vous avez terminé l'ensemble des modules de la formation, bravo !" 
                                        : `Félicitations ! Vous avez bien compris les enjeux du critère ${criterionId}, je vous invite à passer au module suivant le critère ${parseInt(criterionId) + 1 || ''}.`)
                                    : (score >= 60
                                        ? "C'est pas mal du tout, mais c'est malheureusement insuffisant, je vous invite à reprendre les cours et refaire le test."
                                        : "Oh dommage, vous avez encore quelques lacunes ! Je vous invite à revoir le cours et revenir plus fort pour passer le test, courage ! "
                                    )
                                }
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                                {score < 80 ? (
                                    <>
                                        <button 
                                            onClick={() => setStep('intro')}
                                            className="flex-1 py-5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-500/30 hover:shadow-rose-500/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                                        >
                                            Retenter le test
                                            <Play className="h-5 w-5" />
                                        </button>
                                        <button 
                                            onClick={onClose}
                                            className="flex-1 py-5 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-slate-200/50 hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                                        >
                                            Fermer
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={onClose}
                                        className="flex-1 py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-[2rem] font-black text-base uppercase tracking-widest shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 border border-emerald-400/50"
                                    >
                                        Terminer & Télécharger
                                        <ArrowRight className="h-6 w-6" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Processing Overlay */}
                {isSubmitting && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <div className="relative h-24 w-24 flex items-center justify-center mb-8">
                            <div className="absolute inset-0 border-4 rounded-full" style={{ borderColor: getCriterionColor(criterionId).light }} />
                            <div className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin" style={{ borderColor: getCriterionColor(criterionId).primary, borderTopColor: "transparent" }} />
                            <Trophy className="h-8 w-8" style={{ color: getCriterionColor(criterionId).primary }} />
                        </div>
                        <p className="text-base font-black text-slate-900 uppercase tracking-widest">Calcul du score...</p>
                        <p className="text-sm text-slate-500 mt-2 font-medium">Veuillez patienter quelques instants</p>
                    </div>
                )}
            </div>
        </div>
    );
}

