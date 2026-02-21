export default function PageHeader({
  title,
  subtitle,
  action,
  breadcrumb,
  background = false,
}) {
  return (
    <div
      className={`
        ${background ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20" : "py-12 pb-8"}
        px-4 sm:px-6 lg:px-8
      `}
    >
      <div className="max-w-7xl mx-auto">
        {breadcrumb && (
          <nav
            className={`flex items-center gap-2 text-sm mb-6 ${background ? "text-gray-300" : "text-gray-600"}`}
          >
            {breadcrumb}
          </nav>
        )}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
          <div className="flex-1 animate-slideUp">
            <h1
              className={`text-4xl md:text-5xl font-display font-bold mb-4 ${
                background ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className={`text-lg leading-relaxed max-w-2xl ${
                  background ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="animate-slideInRight">{action}</div>}
        </div>
      </div>
    </div>
  );
}
