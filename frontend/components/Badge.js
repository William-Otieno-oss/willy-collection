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
    success: "bg-green-100/80 text-green-700 hover:bg-green-200",
    warning: "bg-yellow-100/80 text-yellow-700 hover:bg-yellow-200",
    danger: "bg-red-100/80 text-red-700 hover:bg-red-200",
    info: "bg-blue-100/80 text-blue-700 hover:bg-blue-200",
    primary: "bg-accent/20 text-accent hover:bg-accent/30",
    outline: "border-2 border-gray-300 text-gray-700 hover:border-gray-400",
    sale: "bg-red-500 text-white hover:bg-red-600 shadow-lg",
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
