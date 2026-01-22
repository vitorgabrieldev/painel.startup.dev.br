export default function PrimaryButton({
    children,
    className = '',
    type = 'button',
    disabled = false,
    variant = 'red',
    loading = false,
    ...props
}) {
    const stylesMap = {
        green: 'bg-[var(--color-accent)] text-white hover:brightness-95 hover:text-white',
        red: 'bg-[var(--color-primary)] text-white hover:brightness-95 hover:text-white',
        purple: 'bg-[var(--color-secondary)] text-white hover:brightness-95 hover:text-white',
        outlineRed:
            'border border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary)] hover:text-white',
        outlineGreen:
            'border border-[var(--color-accent)] text-[var(--color-accent)] bg-transparent hover:bg-[var(--color-accent)] hover:text-white',
    };

    const styles = stylesMap[variant] || stylesMap.red;

    return (
        <button
            type={type}
            disabled={disabled}
            className={`font-display inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 active:outline-none active:ring-0 ${styles} disabled:opacity-60 ${className}`}
            {...props}
        >
            {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
            )}
            {children}
        </button>
    );
}
