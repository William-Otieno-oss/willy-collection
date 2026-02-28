export default function Badge({ children, variant = "default", size = "md" }) {
  const baseStyles =
    "inline-flex items-center font-semibold rounded-full transition-all duration-300";

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3.5 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  const variantStyles = {
    default: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    success: "bg-brand-light/40 text-brand-dark hover:bg-brand-light",
    warning: "bg-brand/30 text-brand-dark hover:bg-brand-light",
    danger: "bg-brand-dark/20 text-brand-dark hover:bg-brand",
    info: "bg-brand-light/40 text-brand-dark hover:bg-brand-light",
    primary: "bg-brand/20 text-brand hover:bg-brand/30",
    outline: "border-2 border-gray-300 text-gray-700 hover:border-gray-400",
    sale: "bg-brand-dark text-white hover:bg-brand-light shadow-lg",
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
