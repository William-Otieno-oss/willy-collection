import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import Link from "next/link";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import { LoadingSpinner } from "../../components/Loading";
import API_BASE, { fetcher, APIError } from "../../lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check authentication on mount
    const token = localStorage.getItem("admin_token");
    const expiresAt = localStorage.getItem("admin_token_expires");

    if (!token || !expiresAt || parseInt(expiresAt) <= Date.now()) {
      // Token missing or expired
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_token_expires");
      router.push("/admin/login");
      return;
    }

    setAuthenticated(true);
    loadStats(token);
  }, [router]);

  async function loadStats(token) {
    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      };

      // Fetch products count
      const productsRes = await fetch(
        `${API_BASE}/api/sneakers?limit=1&offset=0`,
        {
          headers,
        },
      ).catch((err) => {
        throw new APIError("Failed to fetch products", 0, null);
      });

      let productCount = 0;
      if (productsRes && productsRes.ok) {
        try {
          const data = await productsRes.json();
          productCount = Array.isArray(data) ? data.length : 0;
        } catch (e) {
          // JSON parse error handled silently
        }
      } else if (productsRes && productsRes.status === 401) {
        throw new APIError("Authentication failed", 401, null);
      }

      // Fetch orders
      const ordersRes = await fetch(
        `${API_BASE}/api/orders?limit=500&offset=0`,
        {
          headers,
        },
      ).catch((err) => {
        throw new APIError("Failed to fetch orders", 0, null);
      });

      let ordersData = [];
      if (ordersRes && ordersRes.ok) {
        try {
          const data = await ordersRes.json();
          ordersData = Array.isArray(data) ? data : [];
        } catch (e) {
          // JSON parse error handled silently
        }
      } else if (ordersRes && ordersRes.status === 401) {
        throw new APIError("Authentication failed", 401, null);
      }

      const pending = ordersData.filter((o) => o.status === "Pending").length;
      const revenue = ordersData.reduce((sum, o) => {
        const total = Math.max(0, o.total || 0);
        return sum + (typeof total === "number" ? total : 0);
      }, 0);

      setStats({
        totalProducts: Math.max(0, productCount),
        totalOrders: ordersData.length,
        pendingOrders: pending,
        totalRevenue: revenue,
      });
    } catch (err) {
      // Error handled via error state
      if (err instanceof APIError && err.status === 401) {
        setError("Session expired. Redirecting to login...");
        setTimeout(() => {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_token_expires");
          router.push("/admin/login");
        }, 1500);
      } else {
        setError("Failed to load dashboard stats. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_token_expires");
    router.push("/admin/login");
  };

  const sections = [
    {
      href: "/admin/products",
      title: "Manage Products",
      description: "View, edit, or delete sneaker products",
      icon: "👟",
    },
    {
      href: "/admin/products/new",
      title: "Add New Product",
      description: "Create a new sneaker listing",
      icon: "➕",
    },
    {
      href: "/admin/sizes",
      title: "Manage Sizes & Stock",
      description: "Update inventory and size options",
      icon: "📦",
    },
    {
      href: "/admin/orders",
      title: "View Orders",
      description: "Review and manage customer orders",
      icon: "📋",
    },
    {
      href: "/admin/settings",
      title: "Settings",
      description: "Configure store settings",
      icon: "⚙️",
    },
  ];

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner overlay={false} />
      </Layout>
    );
  }

  if (!authenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <Layout>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage your willy COLLECTION store"
        background={true}
      />

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Logout button in top right */}
        <div className="flex justify-end mb-8">
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card
            className="p-6 hover:shadow-lg transition-all animate-slideUp"
            hoverable
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Total Products
                </p>
                <p className="text-4xl font-bold text-gray-900">
                  {stats.totalProducts}
                </p>
              </div>
              <span className="text-3xl">👟</span>
            </div>
          </Card>

          <Card
            className="p-6 hover:shadow-lg transition-all animate-slideUp"
            style={{ animationDelay: "50ms" }}
            hoverable
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Total Orders
                </p>
                <p className="text-4xl font-bold text-gray-900">
                  {stats.totalOrders}
                </p>
              </div>
              <span className="text-3xl">📦</span>
            </div>
          </Card>

          <Card
            className="p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-all animate-slideUp"
            style={{ animationDelay: "100ms" }}
            hoverable
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Pending Orders
                </p>
                <p className="text-4xl font-bold text-yellow-600">
                  {stats.pendingOrders}
                </p>
              </div>
              <span className="text-3xl">⏳</span>
            </div>
          </Card>

          <Card
            className="p-6 border-l-4 border-green-500 hover:shadow-lg transition-all animate-slideUp"
            style={{ animationDelay: "150ms" }}
            hoverable
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Total Revenue
                </p>
                <p className="text-4xl font-bold text-green-600">
                  KES {Math.max(0, stats.totalRevenue).toFixed(0)}
                </p>
              </div>
              <span className="text-3xl">💰</span>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, idx) => (
              <Link key={section.href} href={section.href}>
                <Card
                  hoverable
                  className="p-6 group cursor-pointer h-full"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform">
                      {section.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-accent transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                    {section.description}
                  </p>
                  <span className="inline-flex items-center text-accent font-semibold text-sm group-hover:gap-2 gap-1 transition-all">
                    Access →
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
