export default function ReadyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col font-sans bg-gray-900 text-gray-100 p-8 text-center">
      <h1 className="text-2xl mb-3">Willy Collection – Ready Check</h1>
      <p className="max-w-md text-base opacity-90">
        This page indicates that the frontend is up and responding on
        <code className="mx-1">/ready</code>. Backend health is available via
        the
        <code className="mx-1">/api/health</code>
        and
        <code className="mx-1">/ready</code> API endpoints.
      </p>
    </div>
  );
}
