import fs from 'fs';

const path = 'C:\\\\Users\\\\d-nia\\\\Documents\\\\Application Web\\\\EasyQual\\\\src\\\\components\\\\shared\\\\StatusModal.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('getCriterionColor')) {
    content = content.replace(
        "import { X, CheckCircle, AlertTriangle, Trash2, Info, AlertCircle } from 'lucide-react'",
        "import { X, CheckCircle, AlertTriangle, Trash2, Info, AlertCircle } from 'lucide-react'\nimport { getCriterionColor } from '../../utils/theme'"
    );
}

// Add criterionId to props
if (!content.includes('criterionId')) {
    content = content.replace(
        "isLoading = false\n}) {",
        "isLoading = false,\n    criterionId\n}) {"
    );
}

// Add useDynamicTheme logic
if (!content.includes('useDynamicTheme')) {
    content = content.replace(
        "const { icon, bgColor, ringColor, buttonColor, titleColor, descriptionColor } = config[type] || config.info",
        `const { icon, bgColor, ringColor, buttonColor, titleColor, descriptionColor } = config[type] || config.info\n\n    const dynamicTheme = criterionId ? getCriterionColor(criterionId) : null;\n    const useDynamicTheme = dynamicTheme && (type === 'success' || type === 'confirm' || type === 'info');`
    );
}

// Update Pulse layer
content = content.replace(
    /<div className={`absolute inset-0 \$\{bgColor\} opacity-40 rounded-full scale-110 blur-sm`}><\/div>/,
    '<div className={`absolute inset-0 ${!useDynamicTheme ? bgColor : ""} opacity-40 rounded-full scale-110 blur-sm`} style={useDynamicTheme ? { backgroundColor: dynamicTheme.primary } : {}}></div>'
);

// Update Static rings
content = content.replace(
    /<div className={`absolute inset-0 \$\{bgColor\} rounded-full ring-8 \$\{ringColor\}`}><\/div>/,
    '<div className={`absolute inset-0 rounded-full ring-8 ${!useDynamicTheme ? ringColor : ""} ${!useDynamicTheme ? bgColor : ""}`} style={useDynamicTheme ? { backgroundColor: dynamicTheme.light, "--tw-ring-color": dynamicTheme.light + "80" } : {}}></div>'
);

// Update Icon
content = content.replace(
    /\{icon\}/,
    `{useDynamicTheme && type === 'success' ? <CheckCircle className="h-10 w-10" style={{ color: dynamicTheme.primary }} /> : null}
                            {useDynamicTheme && type === 'confirm' ? <Info className="h-10 w-10" style={{ color: dynamicTheme.primary }} /> : null}
                            {(!useDynamicTheme || (type !== 'success' && type !== 'confirm')) && icon}`
);

// Update Title
content = content.replace(
    /<h3 className={`text-2xl font-black \$\{titleColor \|\| 'text-slate-900'\} mb-3 tracking-tighter`}>/,
    '<h3 className={`text-2xl font-black mb-3 tracking-tighter ${!useDynamicTheme ? (titleColor || "text-slate-900") : ""}`} style={useDynamicTheme ? { color: dynamicTheme.primary } : {}}>'
);

// Update Button
content = content.replace(
    /className={`flex-1 py-4 px-6 \$\{buttonColor\} text-white font-black text-sm rounded-2xl shadow-xl transition-all transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2`}/,
    'className={`flex-1 py-4 px-6 text-white font-black text-sm rounded-2xl shadow-xl transition-all transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 ${!useDynamicTheme ? buttonColor : "hover:opacity-90"}`} style={useDynamicTheme ? { backgroundColor: dynamicTheme.primary, boxShadow: `0 20px 25px -5px ${dynamicTheme.primary}4d` } : {}}'
);

fs.writeFileSync(path, content, 'utf8');
console.log('StatusModal updated');
