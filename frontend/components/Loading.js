export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 animate-slideUp">
      <div className="text-7xl mb-6 opacity-80">{icon}</div>
      <h3 className="text-2xl font-display font-bold text-neutral-900 mb-3 text-center">
        {title}
      </h3>
      <p className="text-neutral-600 text-center mb-8 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ size = "md", overlay = false }) {
  const sizeClasses = {
    sm: "h-6 w-6 border-2",
    md: "h-10 w-10 border-3",
    lg: "h-16 w-16 border-4",
  };

  const spinner = (
    <div className={`inline-block`}>
      <div
        className={`${sizeClasses[size]} border-neutral-200 rounded-full border-t-accent animate-spin shadow-lg`}
      ></div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-12 rounded-2xl shadow-2xl">
          {spinner}
          <p className="text-neutral-600 text-center mt-6 font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{spinner}</div>;
}

export function Skeleton({ width = "w-full", height = "h-4", className = "" }) {
  return (
    <div
      className={`bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 rounded-lg animate-pulse ${width} ${height} ${className}`}
    ></div>
  );
}

export function PageLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-white">
      <div className="text-center">
        <div className="inline-block mb-8">
          <div className="h-16 w-16 border-4 border-neutral-200 rounded-full border-t-accent border-r-accent animate-spin shadow-xl"></div>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Loading your sneakers...
        </h2>
        <p className="text-neutral-600">
          Just a moment while we find the perfect fit
        </p>
      </div>
    </div>
  );
}
