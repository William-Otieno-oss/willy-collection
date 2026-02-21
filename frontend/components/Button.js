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
    "font-semibold transition-all duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transform active:scale-95 hover:scale-105";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3.5 text-lg",
    xl: "px-10 py-4 text-xl",
  };

  const variantStyles = {
    primary:
      "bg-accent text-gray-900 hover:bg-orange-600 focus:ring-accent/40 shadow-lg hover:shadow-xl",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300 hover:shadow-md",
    danger:
      "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 shadow-lg hover:shadow-xl",
    success:
      "bg-green-500 text-white hover:bg-green-600 focus:ring-green-400 shadow-lg hover:shadow-xl",
    outline:
      "border-2 border-accent text-accent hover:bg-accent/10 focus:ring-accent/40",
    ghost: "text-gray-900 hover:bg-gray-100 focus:ring-gray-200",
    dark: "bg-gray-900 text-white hover:bg-black focus:ring-gray-700 shadow-lg hover:shadow-xl",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle}`}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{loading ? "Loading..." : children}</span>
      {loading && (
        <svg
          className="w-4 h-4 animate-spin ml-2"
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
