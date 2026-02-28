export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  icon = null,
  ...props
}) {
  const baseStyles =
    "font-medium transition-all duration-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none inline-flex items-center justify-center gap-2 whitespace-nowrap";

  const sizeStyles = {
    sm: "px-4 py-2.5 text-sm leading-snug",
    md: "px-6 py-3.5 text-base leading-snug",
    lg: "px-8 py-4 text-lg leading-snug",
    xl: "px-10 py-4.5 text-lg leading-snug",
  };

  const variantStyles = {
    primary:
      "bg-brand text-brand-dark shadow-xs hover:shadow-sm hover:bg-brand-light",
    secondary:
      "bg-neutral-50 text-neutral-900 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300",
    danger:
      "bg-error text-white shadow-xs hover:shadow-sm hover:bg-error-dark",
    success:
      "bg-success text-white shadow-xs hover:shadow-sm hover:bg-success-dark",
    outline:
      "border border-neutral-300 text-neutral-900 hover:bg-neutral-50 hover:border-brand/50",
    ghost:
      "text-neutral-700 hover:bg-neutral-50",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle}`}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span className="transition-all duration-250">
        {loading ? "Processing..." : children}
      </span>
      {loading && (
        <svg
          className="w-4 h-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
    </button>
  );
}
