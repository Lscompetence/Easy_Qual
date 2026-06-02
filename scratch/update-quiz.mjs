import fs from 'fs';

const path = 'C:\\\\Users\\\\d-nia\\\\Documents\\\\Application Web\\\\EasyQual\\\\src\\\\components\\\\shared\\\\QuizModal.jsx';
let content = fs.readFileSync(path, 'utf8');

// Import getCriterionColor
if (!content.includes('getCriterionColor')) {
    content = content.replace(
        "import { QUIZ_DATA } from '../../data/qcmData';",
        "import { QUIZ_DATA } from '../../data/qcmData';\nimport { getCriterionColor } from '../../utils/theme';"
    );
}

// 1. Progress Bar
content = content.replace(
    /className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out shadow-\[0_0_15px_rgba\(79,70,229,0\.6\)\]"/g,
    'className="h-full transition-all duration-500 ease-out"'
);
content = content.replace(
    /style={{ width: `\${\(\(currentQuestion \+ 1\) \/ questions\.length\) \* 100}%` }}/g,
    'style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%`, background: getCriterionColor(criterionId).gradient }}'
);

// 2. Top Nav Icon
content = content.replace(
    /className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-500\/30"/g,
    'className="h-12 w-12 text-white rounded-2xl flex items-center justify-center font-black shadow-lg" style={{ background: getCriterionColor(criterionId).gradient }}'
);

// 3. Top Nav Subtitle
content = content.replace(
    /className="text-\[11px\] font-bold text-indigo-600 uppercase tracking-tighter mt-0\.5"/g,
    'className="text-[11px] font-bold uppercase tracking-tighter mt-0.5" style={{ color: getCriterionColor(criterionId).primary }}'
);

// 4. Background Gradient Wrapper
content = content.replace(
    /className="flex-1 flex flex-col relative overflow-y-auto bg-\[radial-gradient\(ellipse_at_top_right,_var\(--tw-gradient-stops\)\)\] from-indigo-50\/40 via-white to-white"/g,
    'className="flex-1 flex flex-col relative overflow-y-auto bg-white/80"'
);

// 5. Intro Pulse background
content = content.replace(
    /className="absolute -inset-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-3xl opacity-20 animate-pulse"/g,
    'className="absolute -inset-6 rounded-full blur-3xl opacity-20 animate-pulse" style={{ background: getCriterionColor(criterionId).gradient }}'
);

// 6. Play Icon Container
content = content.replace(
    /className="relative h-24 w-24 bg-white border-4 border-indigo-50 rounded-\[2rem\] flex items-center justify-center shadow-2xl shadow-indigo-500\/10"/g,
    'className="relative h-24 w-24 bg-white border-4 rounded-[2rem] flex items-center justify-center shadow-2xl" style={{ borderColor: getCriterionColor(criterionId).light }}'
);
content = content.replace(
    /className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center"/g,
    'className="h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: getCriterionColor(criterionId).light }}'
);
content = content.replace(
    /className="h-8 w-8 text-indigo-600 ml-1\.5"/g,
    'className="h-8 w-8 ml-1.5" style={{ color: getCriterionColor(criterionId).primary }}'
);

// 7. Rules Title
content = content.replace(
    /className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2"/g,
    'className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: getCriterionColor(criterionId).primary }}'
);

// 8. Rules List dots
content = content.replace(
    /className="h-1\.5 w-1\.5 rounded-full bg-indigo-400 mt-1\.5 flex-shrink-0"/g,
    'className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: getCriterionColor(criterionId).primary }}'
);

// 9. Rules text elements
content = content.replace(/text-purple-600/g, 'text-inherit" style={{ color: getCriterionColor(criterionId).primary }} className="font-bold');
content = content.replace(
    /<strong className="text-indigo-600 text-base">80%<\/strong>/g,
    '<strong className="text-base" style={{ color: getCriterionColor(criterionId).primary }}>80%</strong>'
);

// 10. Seuil result card
content = content.replace(
    /<p className="text-xl font-black text-indigo-600">80%<\/p>/g,
    '<p className="text-xl font-black" style={{ color: getCriterionColor(criterionId).primary }}>80%</p>'
);

// 11. Start Quiz Button
content = content.replace(
    /className="group w-full max-w-md py-4 lg:py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-\[2rem\] font-black text-base uppercase tracking-widest shadow-2xl shadow-indigo-500\/30 hover:shadow-indigo-500\/50 hover:scale-\[1\.02\] active:scale-95 transition-all flex items-center justify-center gap-4 border border-white\/20"/g,
    'className="group w-full max-w-md py-4 lg:py-5 text-white rounded-[2rem] font-black text-base uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 border border-white/20" style={{ background: getCriterionColor(criterionId).gradient }}'
);

// 12. Questions View Badges
content = content.replace(
    /className="h-2 w-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"/g,
    'className="h-2 w-16 rounded-full" style={{ background: getCriterionColor(criterionId).gradient }}'
);
content = content.replace(
    /className="text-\[11px\] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full"/g,
    'className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full" style={{ backgroundColor: getCriterionColor(criterionId).light, color: getCriterionColor(criterionId).primary }}'
);
content = content.replace(
    /className="text-\[11px\] font-black text-inherit" style={{ color: getCriterionColor\(criterionId\)\.primary }} className="font-bold uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full flex items-center gap-1\.5"/g,
    'className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5" style={{ backgroundColor: getCriterionColor(criterionId).light, color: getCriterionColor(criterionId).primary }}'
);

// 13. Question options
content = content.replace(
    /className={`group relative w-full p-8 rounded-\[2rem\] border-2 text-left transition-all duration-300 flex items-center justify-between overflow-hidden\s*\${isSelected\s*\?\s*'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600\/30 scale-\[1\.01\]'\s*:\s*'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100\/50'\s*}`}/g,
    'className={`group relative w-full p-8 rounded-[2rem] border-2 text-left transition-all duration-300 flex items-center justify-between overflow-hidden ${isSelected ? "text-white shadow-xl scale-[1.01]" : "bg-white border-slate-200 text-slate-600 hover:shadow-xl hover:border-slate-300"}`} style={isSelected ? { backgroundColor: getCriterionColor(criterionId).primary, borderColor: getCriterionColor(criterionId).primary } : {}}'
);

content = content.replace(
    /className={`block text-\[11px\] font-black uppercase tracking-widest mb-1\.5 \${isSelected \? 'text-indigo-200' : 'text-slate-400'}`}/g,
    'className={`block text-[11px] font-black uppercase tracking-widest mb-1.5 ${isSelected ? "opacity-80" : "text-slate-400"}`}'
);

// 14. Validation button
content = content.replace(
    /className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all \${\s*currentSelection\.length === 0\s*\? 'bg-slate-100 text-slate-400 cursor-not-allowed'\s*: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600\/30 hover:bg-indigo-700 hover:scale-105 active:scale-95'\s*}`}/g,
    'className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${currentSelection.length === 0 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "text-white shadow-lg hover:scale-105 active:scale-95 hover:opacity-90"}`} style={currentSelection.length > 0 ? { backgroundColor: getCriterionColor(criterionId).primary } : {}}'
);

// 15. Submitting Loader
content = content.replace(
    /className="absolute inset-0 border-4 border-indigo-100 rounded-full"/g,
    'className="absolute inset-0 border-4 rounded-full" style={{ borderColor: getCriterionColor(criterionId).light }}'
);
content = content.replace(
    /className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"/g,
    'className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin" style={{ borderColor: getCriterionColor(criterionId).primary, borderTopColor: "transparent" }}'
);
content = content.replace(
    /className="h-8 w-8 text-indigo-600"/g,
    'className="h-8 w-8" style={{ color: getCriterionColor(criterionId).primary }}'
);

fs.writeFileSync(path, content, 'utf8');
console.log('QuizModal updated');
