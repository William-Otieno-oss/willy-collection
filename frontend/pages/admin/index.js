import { useEffect } from "react";
import { useRouter } from "next/router";
import { LoadingSpinner } from "../../components/Loading";

export default function AdminIndex() {
  const router = useRouter();

  useEffect(() => {
    // Check if authenticated
    const token = localStorage.getItem("admin_token");
    const expiresAt = localStorage.getItem("admin_token_expires");

    if (token && expiresAt && parseInt(expiresAt) > Date.now()) {
      // Token is valid, go to dashboard
      router.push("/admin/dashboard");
    } else {
      // Token missing or expired, go to login
      router.push("/admin/login");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );
}
