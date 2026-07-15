import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import Link from "next/link";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { LoadingSpinner } from "../../components/Loading";
import { APIError, adminFetcher, resolveApiUrl } from "../../lib/api";

const sections = [
  {
    href: "/admin/products",
    title: "Manage Products",
    description: "View, edit, or delete sneaker products",
    label: "01",
  },
  {
    href: "/admin/products/new",
    title: "Add New Product",
    description: "Create a new sneaker listing",
    label: "02",
  },
  {
    href: "/admin/sizes",
    title: "Manage Sizes & Stock",
    description: "Update inventory and size options",
    label: "03",
  },
  {
    href: "/admin/orders",
    title: "View Orders",
    description: "Review and manage customer orders",
    label: "04",
  },
  {
    href: "/admin/settings",
    title: "Settings",
    description: "Configure store settings",
    label: "05",
  },
];

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
        await adminFetcher("/api/orders?limit=1");
        setAuthenticated(true);
        await loadStats();
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          router.push("/admin/login");
        } else {
          setError("Failed to verify admin session.");
          setLoading(false);
        }
      }
    };
    check();
  }, [router]);

  async function loadStats() {
    try {
      setLoading(true);
      setError("");

      const productsData = await adminFetcher("/api/sneakers");
      const ordersData = await adminFetcher("/api/orders?limit=500&offset=0");

      const productCount = Array.isArray(productsData)
        ? productsData.length
        : productsData && Array.isArray(productsData.data)
          ? productsData.data.length
          : 0;

      const orders = Array.isArray(ordersData) ? ordersData : [];
      const pending = orders.filter((order) => order.status === "Pending").length;
      const revenue = orders.reduce((sum, order) => {
        const orderTotal = Array.isArray(order.items)
          ? order.items.reduce((itemSum, item) => {
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
        totalOrders: orders.length,
        pendingOrders: pending,
        totalRevenue: revenue,
      });
    } catch (err) {
      if (err instanceof APIError && (err.status === 401 || err.status === 403)) {
        setError("Session expired. Redirecting to login...");
        setTimeout(() => {
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
      await fetch(resolveApiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch {
      // Redirect either way; logout should not strand the admin.
    } finally {
      router.push("/admin/login");
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner overlay={false} />
      </Layout>
    );
  }

  if (!authenticated) return null;

  return (
    <Layout>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage your willy COLLECTION store"
        background={true}
      />

      <div className="max-w-7xl mx-auto px-4 py-16">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            ["Products", stats.totalProducts],
            ["Orders", stats.totalOrders],
            ["Pending", stats.pendingOrders],
            ["Revenue", `KES ${Math.max(0, stats.totalRevenue).toFixed(0)}`],
          ].map(([label, value], index) => (
            <Card
              key={label}
              className="p-6 hover:shadow-lg transition-all animate-slideUp"
              style={{ animationDelay: `${index * 50}ms` }}
              hoverable
            >
              <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
              <p className="text-4xl font-bold text-gray-900">{value}</p>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, index) => (
              <Link key={section.href} href={section.href}>
                <Card
                  hoverable
                  className="p-6 group cursor-pointer h-full"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="text-sm font-semibold text-accent mb-4">
                    {section.label}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-accent transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                    {section.description}
                  </p>
                  <span className="inline-flex items-center text-accent font-semibold text-sm">
                    Access
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
