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
        bg-white rounded-lg p-8
        ${noBorder ? "" : "border border-neutral-200/60"}
        ${elevated ? "shadow-sm" : "shadow-xs"}
        ${hoverable ? "hover:shadow-sm hover:border-brand/30 transition-all duration-200 cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
