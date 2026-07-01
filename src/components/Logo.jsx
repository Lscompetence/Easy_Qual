export default function Logo({ className = "", size = "normal", color = "blue", iconOnly = false }) {
    const sizeClasses = {
        small: "h-8",
        normal: "h-12",
        large: "h-16"
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <img 
                src="/logo.png" 
                alt="Easy'Qual" 
                className={`${sizeClasses[size] || sizeClasses.normal} w-auto object-contain`} 
            />
        </div>
    )
}
