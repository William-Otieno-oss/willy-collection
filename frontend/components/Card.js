export default function Card({
  children,
  className = "",
  hoverable = true,
  elevated = false,
  noBorder = false,
}) {
  return (
    <div
      className={`
        bg-white rounded-2xl 
        ${noBorder ? "" : "border border-gray-100"}
        ${elevated ? "shadow-xl" : "shadow-md"}
        ${hoverable ? "hover:shadow-2xl hover:border-accent/30 hover:-translate-y-1 transition-all duration-300" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
