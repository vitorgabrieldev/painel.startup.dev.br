export default function ApplicationLogo({ className = '', ...props }) {
    return (
        <span
            {...props}
            className={`!h-6 font-semibold tracking-tight ${className}`.trim()}
        >
            Safio Studio
        </span>
    );
}
