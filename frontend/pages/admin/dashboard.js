import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import Link from "next/link";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import { LoadingSpinner } from "../../components/Loading";
import API_BASE, { fetcher, APIError, adminFetcher } from "../../lib/api";

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
    const check = async () => {
      try {
        setAuthenticated(true);
        await loadStats();
      } catch (err) {
        if (err.status === 401) {
          router.push("/admin/login");
        }
      }
    };
    check();
  }, [router]);

  async function loadStats() {
    try {
      setLoading(true);
      setError("");

      const headers = {
        "Content-Type": "application/json",
      };

      // Fetch products list so we can count them. previously we only requested
      // a single item (`limit=1`) which caused the dashboard to show “1” even
      // when there were many more products.  The manage-products page already
      // pulls the full list and derives its own count, so we can reuse that
      // approach here.
      const productsData = await adminFetcher("/api/sneakers");
      const productCount = Array.isArray(productsData)
        ? productsData.length
        : productsData && Array.isArray(productsData.data)
          ? productsData.data.length
          : 0;

      // Fetch orders
      const ordersData = await adminFetcher("/api/orders?limit=500&offset=0");

      const pending = ordersData.filter((o) => o.status === "Pending").length;
      const revenue = ordersData.reduce((sum, o) => {
        const orderTotal = Array.isArray(o.items)
          ? o.items.reduce((itemSum, item) => {
              const itemPrice = typeof item.price === "number" ? item.price : 0;
              const itemQuantity =
                typeof item.quantity === "number" ? item.quantity : 0;
              return itemSum + itemPrice * itemQuantity;
            }, 0)
          : 0;
        return sum + Math.max(0, orderTotal);
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
          // Token is stored as HTTP-only cookie; redirecting to login will clear it server-side
          router.push("/admin/login");
        }, 1500);
      } else {
        setError("Failed to load dashboard stats. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Always redirect to login after logout attempt
      router.push("/admin/login");
    }
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
