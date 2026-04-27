import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, ChevronRight, HelpCircle, Trophy, AlertCircle, Loader2, Play, ArrowRight, ArrowLeft } from 'lucide-react';

const QUIZ_DATA = {
    '1': [
        { q: "Quelle est la durée de validité de la certification Qualiopi ?", options: ["2 ans", "3 ans", "4 ans", "5 ans"], correct: 1 },
        { q: "Quelles sont les catégories d'actions concernées par Qualiopi ?", options: ["Uniquement les formations", "Formations, Bilans de compétences, VAE, Apprentissage", "Uniquement l'apprentissage", "Formations et VAE uniquement"], correct: 1 },
        { q: "L'indicateur 1 exige que les indicateurs de résultats soient...", options: ["Optionnels", "Accessibles au public et détaillés", "Confidentiels", "Anonymes"], correct: 1 }
    ],
    '2': [
        { q: "Le critère 2 porte sur...", options: ["La qualification des formateurs", "L'identification précise des objectifs", "Les moyens techniques", "L'amélioration continue"], correct: 1 },
        { q: "Qu'est-ce qu'une action de formation selon le code du travail ?", options: ["Un simple cours magistral", "Un parcours permettant d'atteindre un objectif pro", "Un entretien annuel", "Un séminaire de vacances"], correct: 1 }
    ],
    'default': [
        { q: "Qualiopi est une marque déposée par...", options: ["L'État (Ministère du Travail)", "Une entreprise privée", "L'Union Européenne", "Pôle Emploi"], correct: 0 },
        { q: "L'audit de surveillance a lieu entre...", options: ["6 et 12 mois", "14 et 22 mois", "24 et 30 mois", "36 et 42 mois"], correct: 1 }
    ]
};

export default function QuizModal({ isOpen, onClose, criterionId, criterionLabel, onComplete, onFail }) {
    const [step, setStep] = useState('intro'); // intro, questions, result
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [score, setScore] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [direction, setDirection] = useState('next'); // for slide animation

    const questions = QUIZ_DATA[criterionId] || QUIZ_DATA['default'];

    useEffect(() => {
        if (isOpen) {
            setStep('intro');
            setCurrentQuestion(0);
            setAnswers([]);
            setScore(0);
            setDirection('next');
        }
    }, [isOpen]);

    const handleStart = () => {
        setStep('questions');
    };

    const handleAnswer = (optionIdx) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = optionIdx;
        setAnswers(newAnswers);

        // Immediate transition for better feel
        if (currentQuestion < questions.length - 1) {
            setDirection('next');
            setCurrentQuestion(prev => prev + 1);
        } else {
            calculateResult(newAnswers);
        }
    };

    const handlePrev = () => {
        if (currentQuestion > 0) {
            setDirection('prev');
            setCurrentQuestion(prev => prev - 1);
        }
    };

    const calculateResult = (finalAnswers) => {
        setIsSubmitting(true);
        let correctCount = 0;
        finalAnswers.forEach((ans, idx) => {
            if (ans === questions[idx].correct) correctCount++;
        });
        
        const finalScore = Math.round((correctCount / questions.length) * 100);
        setScore(finalScore);
        
        // Short delay for the "processing" feel but much faster than before
        setTimeout(() => {
            setStep('result');
            setIsSubmitting(false);
            if (finalScore >= 70) {
                onComplete?.(finalScore, { questions, answers: finalAnswers });
            } else {
                onFail?.(finalScore, { questions, answers: finalAnswers });
            }
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 lg:p-6 sm:p-4">
            {/* Backdrop with higher blur for focus */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
            
            {/* Modal Content - Expanded for better layout */}
            <div className="relative bg-white w-full max-w-4xl h-full lg:h-auto lg:min-h-[650px] lg:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200">
                
                {/* Global Progress Bar at the very top */}
                {step === 'questions' && (
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 z-50">
                        <div 
                            className="h-full bg-indigo-600 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
                            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                )}

                {/* Top Nav */}
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                            {step === 'questions' ? currentQuestion + 1 : <HelpCircle className="h-5 w-5" />}
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Plateforme d'Évaluation</h2>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Critère {criterionId} • {criterionLabel}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-900">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col relative overflow-hidden">
                    
                    {step === 'intro' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className="relative mb-10">
                                <div className="absolute -inset-4 bg-indigo-100 rounded-full blur-2xl opacity-50 animate-pulse" />
                                <div className="relative h-28 w-28 bg-white border-4 border-indigo-50 rounded-[2.5rem] flex items-center justify-center shadow-xl">
                                    <Play className="h-12 w-12 text-indigo-600 ml-1.5" />
                                </div>
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Test de Validation</h3>
                            <p className="text-lg text-slate-500 max-w-md mb-12 font-medium leading-relaxed">
                                Évaluez vos connaissances sur le <span className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-4">Critère {criterionId}</span> pour finaliser votre dossier.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-12">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Questions</p>
                                    <p className="text-xl font-black text-slate-900">{questions.length}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Réussite</p>
                                    <p className="text-xl font-black text-slate-900">70%</p>
                                </div>
                            </div>

                            <button 
                                onClick={handleStart}
                                className="group w-full max-w-md py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-base uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                            >
                                Commencer maintenant
                                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}

                    {step === 'questions' && (
                        <div className="flex-1 flex flex-col p-8 lg:p-12">
                            {/* Question Content with instant slide feel */}
                            <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full">
                                <div className={`transition-all duration-300 transform ${direction === 'next' ? 'animate-in slide-in-from-right-8' : 'animate-in slide-in-from-left-8'} fade-in`}>
                                    <div className="mb-12">
                                        <div className="flex items-center gap-3 mb-6">
                                            <span className="h-1.5 w-12 bg-indigo-600 rounded-full" />
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Question {currentQuestion + 1}</span>
                                        </div>
                                        <h4 className="text-3xl lg:text-4xl font-black text-slate-900 leading-[1.1] tracking-tight">
                                            {questions[currentQuestion].q}
                                        </h4>
                                    </div>

                                    {/* Options Grid - 2x2 for speed of scanning */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {questions[currentQuestion].options.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswer(idx)}
                                                disabled={isSubmitting}
                                                className={`group relative w-full p-8 rounded-[2rem] border-2 text-left transition-all duration-200 flex items-center justify-between overflow-hidden ${
                                                    answers[currentQuestion] === idx 
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' 
                                                        : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-500 hover:shadow-lg'
                                                }`}
                                            >
                                                <div className="relative z-10 pr-6">
                                                    <span className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-40">Option {String.fromCharCode(65 + idx)}</span>
                                                    <span className="text-lg font-black leading-tight">{opt}</span>
                                                </div>
                                                <div className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                                    answers[currentQuestion] === idx ? 'border-white bg-white/20 rotate-0 scale-110' : 'border-slate-100 bg-slate-50 rotate-90 opacity-0 group-hover:opacity-100 group-hover:rotate-0'
                                                }`}>
                                                    <CheckCircle2 className="h-5 w-5" />
                                                </div>
                                                
                                                {/* Hover Glow */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Controls */}
                            <div className="mt-auto pt-8 border-t border-slate-50 flex justify-between items-center">
                                <button 
                                    onClick={handlePrev}
                                    disabled={currentQuestion === 0}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
                                        currentQuestion === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Précédent
                                </button>
                                
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    Navigation au clic rapide
                                </div>
                                
                                <div className="h-10 w-10 rounded-full border-2 border-slate-100 flex items-center justify-center text-xs font-black text-slate-400">
                                    {currentQuestion + 1}/{questions.length}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'result' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 text-center animate-in zoom-in-95 fade-in duration-500">
                            <div className="relative mb-12">
                                <div className={`absolute -inset-8 rounded-full blur-3xl opacity-30 animate-pulse ${score >= 70 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                <div className={`relative h-32 w-32 rounded-[3rem] flex items-center justify-center shadow-2xl ${score >= 70 ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'}`}>
                                    {score >= 70 ? <Trophy className="h-16 w-16" /> : <AlertCircle className="h-16 w-16" />}
                                </div>
                            </div>
                            
                            <div className="mb-8">
                                <h3 className="text-6xl font-black text-slate-900 tracking-tighter">{score}%</h3>
                                <p className={`text-xl font-black uppercase tracking-widest mt-2 ${score >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {score >= 70 ? 'Test Réussi !' : 'Score insuffisant'}
                                </p>
                            </div>

                            <p className="text-lg text-slate-500 max-w-sm mb-12 font-medium leading-relaxed">
                                {score >= 70 
                                    ? "Excellent travail ! Votre rapport détaillé a été transmis à votre consultant pour validation."
                                    : "Vous n'avez pas atteint les 70% requis. Relisez le référentiel et retentez votre chance immédiatement."
                                }
                            </p>

                            <div className="flex gap-4 w-full max-w-md">
                                {score < 70 ? (
                                    <button 
                                        onClick={() => setStep('intro')}
                                        className="flex-1 py-6 bg-rose-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-3"
                                    >
                                        Retenter le test
                                        <Play className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={onClose}
                                        className="flex-1 py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                                    >
                                        Terminer & Enregistrer
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Processing Overlay */}
                {isSubmitting && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <div className="h-16 w-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6" />
                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Génération du rapport...</p>
                        <p className="text-xs text-slate-400 mt-2">Veuillez patienter quelques instants</p>
                    </div>
                )}
            </div>
        </div>
    );
}
