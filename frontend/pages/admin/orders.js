import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import { LoadingSpinner, EmptyState } from "../../components/Loading";
import API_BASE, {
  adminFetcher,
  adminPutRequest,
  adminDeleteRequest,
  APIError,
} from "../../lib/api";

const statusConfig = {
  Pending: "warning",
  Processing: "info",
  Shipped: "info",
  Delivered: "success",
  Cancelled: "danger",
};

const statusIcons = {
  Pending: "⏳",
  Processing: "🔄",
  Shipped: "🚚",
  Delivered: "✅",
  Cancelled: "❌",
};

const VALID_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function AdminOrders() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    // Attempt to load orders; if it fails with 401 redirect to login
    const check = async () => {
      try {
        await load();
        setAuthenticated(true);
      } catch (err) {
        if (err.status === 401) {
          router.push("/admin/login");
        }
      }
    };
    check();
  }, [router]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      // authenticated fetch via cookie
      const data = await adminFetcher("/api/orders?limit=500&offset=0");
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      // Error handled via error state
      if (err instanceof APIError && err.status === 401) {
        router.push("/admin/login");
      } else {
        setError("Failed to load orders. Please try again.");
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, newStatus) {
    // Validate new status
    if (!VALID_STATUSES.includes(newStatus)) {
      setError("Invalid status selected");
      return;
    }

    // Validate ID
    if (typeof id !== "number" || id < 1) {
      setError("Invalid order ID");
      return;
    }

    setUpdatingId(id);
    try {
      await adminPutRequest(`/api/orders/${id}/status`, { status: newStatus });
      // Reload orders after successful update
      await load();
    } catch (err) {
      // Error handled via error state
      if (err instanceof APIError && err.status === 401) {
        router.push("/admin/login");
      } else {
        setError("Failed to update order. Please try again.");
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteOrder(id) {
    if (typeof id !== "number" || id < 1) {
      setError("Invalid order ID");
      return;
    }
    try {
      await adminDeleteRequest(`/api/orders/${id}`);
      await load();
    } catch (err) {
      if (err instanceof APIError && err.status === 401) {
        router.push("/admin/login");
      } else if (err instanceof APIError && err.status === 404) {
        setError("Order not found");
      } else {
        setError("Failed to delete order. Please try again.");
      }
    }
  }

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "Pending").length,
    processing: orders.filter((o) => o.status === "Processing").length,
    delivered: orders.filter((o) => o.status === "Delivered").length,
    totalRevenue: orders.reduce((sum, o) => {
      const orderTotal = Array.isArray(o.items)
        ? o.items.reduce((itemSum, item) => {
            const itemPrice = typeof item.price === "number" ? item.price : 0;
            const itemQuantity =
              typeof item.quantity === "number" ? item.quantity : 0;
            return itemSum + itemPrice * itemQuantity;
          }, 0)
        : 0;
      return sum + Math.max(0, orderTotal);
    }, 0),
  };

  // derive filtered list based on current tab; keep array reference stable
  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

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
        title="Orders Management"
        subtitle="Review and manage customer orders"
        background={true}
      />

      <div className="max-w-7xl mx-auto px-4 py-16">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-4 font-semibold hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          <Card className="p-4 animate-slideUp" hoverable>
            <p className="text-gray-600 text-xs font-semibold mb-1 uppercase">
              Total Orders
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </Card>
          <Card
            className="p-4 animate-slideUp border-l-4 border-yellow-500"
            style={{ animationDelay: "50ms" }}
            hoverable
          >
            <p className="text-gray-600 text-xs font-semibold mb-1 uppercase">
              Pending
            </p>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.pending}
            </p>
          </Card>
          <Card
            className="p-4 animate-slideUp border-l-4 border-blue-500"
            style={{ animationDelay: "100ms" }}
            hoverable
          >
            <p className="text-gray-600 text-xs font-semibold mb-1 uppercase">
              Processing
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {stats.processing}
            </p>
          </Card>
          <Card
            className="p-4 animate-slideUp border-l-4 border-green-500"
            style={{ animationDelay: "150ms" }}
            hoverable
          >
            <p className="text-gray-600 text-xs font-semibold mb-1 uppercase">
              Delivered
            </p>
            <p className="text-3xl font-bold text-green-600">
              {stats.delivered}
            </p>
          </Card>
          <Card
            className="p-4 animate-slideUp border-l-4 border-green-700"
            style={{ animationDelay: "200ms" }}
            hoverable
          >
            <p className="text-gray-600 text-xs font-semibold mb-1 uppercase">
              Revenue
            </p>
            <p className="text-2xl font-bold text-green-700">
              KES {Math.max(0, stats.totalRevenue).toFixed(0)}
            </p>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { value: "all", label: "All Orders" },
            { value: "Pending", label: "Pending" },
            { value: "Processing", label: "Processing" },
            { value: "Delivered", label: "Delivered" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                filterStatus === tab.value
                  ? "bg-accent text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <EmptyState
              icon="📦"
              title={
                filterStatus === "all"
                  ? "No Orders Yet"
                  : `No ${filterStatus} Orders`
              }
              description={
                filterStatus === "all"
                  ? "Orders will appear here as customers place them."
                  : `There are no ${filterStatus} orders at this moment.`
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, idx) => (
              <Card
                key={order.id}
                hoverable
                className="p-6 animate-slideUp"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6 pb-6 border-b border-gray-100">
                  {/* Customer Info */}
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1 uppercase">
                      Customer
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {order.customerName || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.phone || "N/A"}
                    </p>
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1 uppercase">
                      Order Date
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                    {order.createdAt && (
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1 uppercase">
                      Status
                    </p>
                    <Badge
                      variant={statusConfig[order.status] || "default"}
                      size="md"
                    >
                      <span className="mr-2">
                        {statusIcons[order.status] || "❓"}
                      </span>
                      {order.status || "Unknown"}
                    </Badge>
                  </div>

                  {/* Order Total */}
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1 uppercase">
                      Total Amount
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      KES{" "}
                      {Array.isArray(order.items)
                        ? order.items
                            .reduce(
                              (sum, item) =>
                                sum +
                                (Math.max(0, item.price || 0) *
                                  (item.quantity || 1)),
                              0
                            )
                            .toFixed(0)
                        : "0"}
                    </p>
                  </div>

                  {/* Order ID */}
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1 uppercase">
                      Order ID
                    </p>
                    <p className="text-sm font-mono text-gray-600">
                      #{order.id}
                    </p>
                  </div>
                </div>

                {/* Payment Info (if available) */}
                {order.payment && (
                  <div className="mb-4 p-4 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 font-semibold mb-1 uppercase">
                      Payment Details
                    </p>
                    <p className="text-sm">
                      Method:{" "}
                      {order.payment.checkoutRequestId ? "MPESA" : "N/A"}
                    </p>
                    <p className="text-sm">Status: {order.payment.status}</p>
                    {order.payment.mpesaNumber && (
                      <p className="text-sm">
                        Phone: {order.payment.mpesaNumber}
                      </p>
                    )}
                    {order.payment.checkoutRequestId && (
                      <p className="text-sm">
                        ID: {order.payment.checkoutRequestId}
                      </p>
                    )}
                  </div>
                )}

                {/* Items List */}
                {order.items && order.items.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-bold text-gray-900 mb-3">
                      Items
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {order.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="bg-gray-50 p-3 rounded-lg"
                        >
                          <p className="text-sm font-semibold text-gray-900">
                            {item.modelName || item.name || "Product"}
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            Size {item.size || "N/A"} • Qty:{" "}
                            {item.quantity || 1}
                          </p>
                          <p className="text-sm font-bold text-accent">
                            KES{" "}
                            {(
                              Math.max(0, item.price || 0) *
                              (item.quantity || 1)
                            ).toFixed(0)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery Address */}
                {order.location && (
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <p className="text-xs text-gray-600 font-semibold mb-2 uppercase">
                      📍 Delivery Address
                    </p>
                    <p className="text-sm text-gray-700">{order.location}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {order.status !== "Processing" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateStatus(order.id, "Processing")}
                      disabled={updatingId === order.id}
                    >
                      {updatingId === order.id ? "..." : "Mark Processing"}
                    </Button>
                  )}
                  {order.status !== "Shipped" && (
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => updateStatus(order.id, "Shipped")}
                      disabled={updatingId === order.id}
                    >
                      {updatingId === order.id ? "..." : "Mark Shipped"}
                    </Button>
                  )}
                  {order.status !== "Delivered" && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => updateStatus(order.id, "Delivered")}
                      disabled={updatingId === order.id}
                    >
                      {updatingId === order.id ? "..." : "Mark Delivered"}
                    </Button>
                  )}
                  {order.status !== "Cancelled" &&
                    order.status !== "Delivered" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to cancel this order?",
                            )
                          ) {
                            updateStatus(order.id, "Cancelled");
                          }
                        }}
                        disabled={updatingId === order.id}
                      >
                        {updatingId === order.id ? "..." : "Cancel"}
                      </Button>
                    )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (confirm("Delete this order permanently?")) {
                        deleteOrder(order.id);
                      }
                    }}
                    disabled={updatingId === order.id}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
