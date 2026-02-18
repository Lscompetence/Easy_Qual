import { CheckCircle } from 'lucide-react'

export default function Logo({ className = "", size = "normal", color = "blue", iconOnly = false }) {
    const sizeClasses = {
        small: iconOnly ? "" : "text-xl",
        normal: iconOnly ? "" : "text-3xl",
        large: iconOnly ? "" : "text-4xl"
    }

    const iconSizes = {
        small: "h-5 w-5",
        normal: "h-8 w-8",
        large: "h-10 w-10"
    }

    const colorClasses = {
        blue: {
            bg: 'bg-blue-600',
            text: 'text-blue-600',
            shadow: 'shadow-blue-200'
        },
        purple: {
            bg: 'bg-purple-600',
            text: 'text-purple-600',
            shadow: 'shadow-purple-200'
        },
        gray: {
            bg: 'bg-gray-800',
            text: 'text-gray-800',
            shadow: 'shadow-gray-200'
        },
        client: {
            bg: 'bg-[rgb(216,158,158)]',
            text: 'text-[rgb(216,158,158)]',
            shadow: 'shadow-[rgb(216,158,158)]/50'
        }
    }

    const theme = colorClasses[color] || colorClasses.blue

    return (
        <div className={`flex items-center gap-2 font-extrabold tracking-tight text-slate-900 ${sizeClasses[size]} ${className}`}>
            <div className={`${theme.bg} rounded-xl flex items-center justify-center text-white shadow-lg ${theme.shadow} p-1`}>
                <CheckCircle className={`${iconSizes[size]} fill-white ${theme.text}`} strokeWidth={3} />
            </div>
            {!iconOnly && (
                <span>
                    Easy<span className={theme.text}>'</span>Qual
                </span>
            )}
        </div>
    )
}
