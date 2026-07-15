import { useEffect } from "react";
import { useRouter } from "next/router";
import { LoadingSpinner } from "../../components/Loading";
import { adminFetcher } from "../../lib/api";

export default function AdminIndex() {
  const router = useRouter();

  useEffect(() => {
    // Ping a protected endpoint to determine authentication state
    const check = async () => {
      try {
        await adminFetcher("/api/orders?limit=1");
        router.push("/admin/dashboard");
      } catch {
        router.push("/admin/login");
      }
    };
    check();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );
}
