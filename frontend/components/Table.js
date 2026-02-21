export function Table({ children, className = "" }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className={`w-full text-sm ${className}`}>{children}</table>
    </div>
  );
}

export function TableHead({ children }) {
  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-gray-200">{children}</tbody>;
}

export function TableRow({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-gray-50 transition-colors ${onClick ? "cursor-pointer" : ""}`}
    >
      {children}
    </tr>
  );
}

export function TableHeader({ children, align = "left" }) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <th className={`px-6 py-3 font-semibold text-gray-700 ${alignClass}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, align = "left" }) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <td className={`px-6 py-4 text-gray-900 ${alignClass}`}>{children}</td>
  );
}
