import fs from 'fs';

const path = 'C:\\\\Users\\\\d-nia\\\\Documents\\\\Application Web\\\\EasyQual\\\\src\\\\components\\\\consultant\\\\ResourceManager.jsx';
let content = fs.readFileSync(path, 'utf8');

// 230: Loader
content = content.replace(
    /<Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-4" \/>/,
    '<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: getCriterionColor(currentCrit).primary }} />'
);

// 251: Header Icon
content = content.replace(
    /<div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-\[20px\] flex items-center justify-center shadow-sm border border-indigo-100\/50">/,
    '<div className="h-14 w-14 rounded-[20px] flex items-center justify-center shadow-sm border" style={{ backgroundColor: getCriterionColor(currentCrit).light, color: getCriterionColor(currentCrit).primary, borderColor: getCriterionColor(currentCrit).border }}>'
);

// 278: Tab styling
content = content.replace(
    /\? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' /g,
    "? 'bg-white shadow-sm border' "
);
content = content.replace(
    /<button([\s\S]*?)onClick=\{\(\) => setCurrentCrit\(c.id\)\}([\s\S]*?)>/g,
    (match, p1, p2) => {
        return `<button${p1}onClick={() => setCurrentCrit(c.id)}${p2} style={currentCrit === c.id ? { color: getCriterionColor(c.id).primary, borderColor: getCriterionColor(c.id).border } : {}}>`;
    }
);

// 289: Main content area wrapper
content = content.replace(
    /<div className="mb-10 bg-indigo-50\/40 border border-indigo-100\/50 rounded-\[28px\] p-8 relative animate-in slide-in-from-top-4 duration-300">/,
    '<div className="mb-10 rounded-[28px] p-8 relative animate-in slide-in-from-top-4 duration-300" style={{ backgroundColor: getCriterionColor(currentCrit).light + "66", borderColor: getCriterionColor(currentCrit).border + "80", borderWidth: "1px" }}>'
);

// 311: Indicator wrapper
content = content.replace(
    /<div className="flex flex-wrap gap-2 mb-8 bg-white\/40 p-2 rounded-\[20px\] border border-indigo-100\/50">/,
    '<div className="flex flex-wrap gap-2 mb-8 bg-white/40 p-2 rounded-[20px] border" style={{ borderColor: getCriterionColor(currentCrit).border + "80" }}>'
);

// Indicator Tab button
content = content.replace(
    /className={`px-4 py-2\.5 rounded-2xl text-sm font-black transition-all \${([\s\S]*?)}`}/g,
    'className={`px-4 py-2.5 rounded-2xl text-sm font-black transition-all ${$1}`} style={currentIndicator === ind.id ? { backgroundColor: getCriterionColor(currentCrit).primary, color: "#fff" } : { color: getCriterionColor(currentCrit).primary, opacity: 0.7 }}'
);

// 342: VOIR LA VIDÉO ACTUELLE
content = content.replace(
    /className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl text-\[11px\] font-black border border-indigo-100 shadow-sm hover:bg-indigo-50 transition-all"/g,
    'className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-[11px] font-black border shadow-sm transition-all hover:opacity-80" style={{ color: getCriterionColor(currentCrit).primary, borderColor: getCriterionColor(currentCrit).border }}'
);

// 374: Radio options
content = content.replace(
    /className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer \${sourceType === type\.id \? 'bg-white border-indigo-500 text-indigo-700 shadow-sm' : 'bg-indigo-50\/20 border-transparent text-gray-500 hover:bg-white\/50'}`}/g,
    'className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${sourceType === type.id ? "bg-white shadow-sm" : "border-transparent text-gray-500 hover:bg-white/50"}`} style={sourceType === type.id ? { borderColor: getCriterionColor(currentCrit).primary, color: getCriterionColor(currentCrit).primary } : { backgroundColor: getCriterionColor(currentCrit).light + "33" }}'
);

// 376: Radio circle
content = content.replace(
    /<div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center \${sourceType === type\.id \? 'border-indigo-500' : 'border-gray-300'}`}>/g,
    '<div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${sourceType === type.id ? "" : "border-gray-300"}`} style={sourceType === type.id ? { borderColor: getCriterionColor(currentCrit).primary } : {}}>'
);

// 377: Radio dot
content = content.replace(
    /\{sourceType === type\.id && <div className="h-2\.5 w-2\.5 bg-indigo-500 rounded-full" \/>\}/g,
    '{sourceType === type.id && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getCriterionColor(currentCrit).primary }} />}'
);

// 379: Radio text
content = content.replace(
    /<span className={`text-\[13px\] font-bold \${sourceType === type\.id \? 'text-indigo-900' : 'text-gray-500'}`}>{type\.label}<\/span>/g,
    '<span className={`text-[13px] font-bold ${sourceType === type.id ? "" : "text-gray-500"}`} style={sourceType === type.id ? { color: getCriterionColor(currentCrit).primary } : {}}>{type.label}</span>'
);

// 387: Lien Label
content = content.replace(
    /<label className="text-\[10px\] font-black text-indigo-400 uppercase tracking-widest mb-2 block ml-1">Lien \{sourceType === 'youtube' \? 'Youtube' : 'Vimeo'\}<\/label>/g,
    '<label className="text-[10px] font-black uppercase tracking-widest mb-2 block ml-1" style={{ color: getCriterionColor(currentCrit).primary, opacity: 0.7 }}>Lien {sourceType === "youtube" ? "Youtube" : "Vimeo"}</label>'
);

// 389: Link Icon
content = content.replace(
    /<LinkIcon className="absolute left-4 top-1\/2 -translate-y-1\/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" \/>/g,
    '<LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors" />'
);

// 390: Input
content = content.replace(
    /<input type="url" placeholder="https:\/\/\.\.\." value=\{url\} onChange=\{e => setUrl\(e\.target\.value\)\} className="w-full pl-12 pr-4 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-gray-900" \/>/g,
    '<input type="url" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border rounded-2xl focus:ring-4 outline-none transition-all font-medium text-gray-900" style={{ borderColor: getCriterionColor(currentCrit).border }} />'
);

// 397: Fichier .mp4 Label
content = content.replace(
    /<label className="text-\[10px\] font-black text-indigo-400 uppercase tracking-widest mb-2 block ml-1">Fichier \.mp4<\/label>/g,
    '<label className="text-[10px] font-black uppercase tracking-widest mb-2 block ml-1" style={{ color: getCriterionColor(currentCrit).primary, opacity: 0.7 }}>Fichier .mp4</label>'
);

// 399: File upload container
content = content.replace(
    /<div onClick=\{\(\) => fileInputRef\.current\?\.click\(\)\} className="w-full flex items-center justify-between px-6 py-5 bg-white border border-indigo-100 text-indigo-700 font-bold rounded-2xl hover:shadow-md transition-all cursor-pointer group">/g,
    '<div onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between px-6 py-5 bg-white border font-bold rounded-2xl hover:shadow-md transition-all cursor-pointer group" style={{ borderColor: getCriterionColor(currentCrit).border, color: getCriterionColor(currentCrit).primary }}>'
);

// 401: Upload icon container
content = content.replace(
    /<div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">/g,
    '<div className="p-3 rounded-xl group-hover:scale-110 transition-transform" style={{ backgroundColor: getCriterionColor(currentCrit).light, color: getCriterionColor(currentCrit).primary }}>'
);

// 411: Parcourir
content = content.replace(
    /<span className="text-\[10px\] font-black text-indigo-400 uppercase">Parcourir<\/span>/g,
    '<span className="text-[10px] font-black uppercase" style={{ color: getCriterionColor(currentCrit).primary, opacity: 0.7 }}>Parcourir</span>'
);

// 414: Progress bar container
content = content.replace(
    /<div className="mt-4 bg-white\/50 rounded-full h-3 p-0\.5 border border-indigo-100 overflow-hidden">/g,
    '<div className="mt-4 bg-white/50 rounded-full h-3 p-0.5 border overflow-hidden" style={{ borderColor: getCriterionColor(currentCrit).border }}>'
);

// 415: Progress bar fill
content = content.replace(
    /<div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style=\{\{ width: `\$\{uploadProgress\}%` \}\}>\S*<\/div>/g,
    '<div className="h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, backgroundColor: getCriterionColor(currentCrit).primary }}></div>'
);

// 423: Save Button
content = content.replace(
    /className={`flex items-center gap-3 px-10 py-4 font-black text-sm rounded-2xl transition-all shadow-xl disabled:opacity-50 \${isSaving \? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}/g,
    'className={`flex items-center gap-3 px-10 py-4 font-black text-sm rounded-2xl transition-all shadow-xl disabled:opacity-50 ${isSaving ? "bg-gray-100 text-gray-400" : "text-white hover:opacity-90"}`} style={!isSaving ? { backgroundColor: getCriterionColor(currentCrit).primary } : {}}'
);

// 453 & 455: Consultant sidebar criterion items - wait, they are also indigo! Let's do it if needed, but the user showed the main modal.
// Wait, the user said "mettre tout ces élement en la meme couleur de critére 01 slvp et applique ça sur tout les autres"
content = content.replace(
    /className={`text-\[12px\] font-medium \${isActive \? 'text-indigo-100 opacity-90' : 'text-gray-400'}`}/g,
    'className={`text-[12px] font-medium ${isActive ? "opacity-90 text-white" : "text-gray-400"}`}'
);

content = content.replace(
    /className={`text-\[12px\] font-bold \${isActive \? 'text-white\/80' : 'text-indigo-500'}`}/g,
    'className={`text-[12px] font-bold ${isActive ? "text-white/80" : ""}`} style={!isActive ? { color: getCriterionColor(crit.id).primary } : {}}'
);


fs.writeFileSync(path, content, 'utf8');
console.log('ResourceManager updated');
