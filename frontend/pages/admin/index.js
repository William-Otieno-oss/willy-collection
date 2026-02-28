import { useEffect } from "react";
import { useRouter } from "next/router";
import { LoadingSpinner } from "../../components/Loading";

export default function AdminIndex() {
  const router = useRouter();

  useEffect(() => {
    // Ping a protected endpoint to determine authentication state
    const check = async () => {
      try {
        const resp = await fetch("/api/orders?limit=1", {
          credentials: "include",
        });
        if (resp.ok) {
          router.push("/admin/dashboard");
        } else {
          router.push("/admin/login");
        }
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
