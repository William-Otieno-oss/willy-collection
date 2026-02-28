import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import API_BASE, {
  adminFetcher,
  adminPostRequest,
  adminDeleteRequest,
  APIError,
} from "../../lib/api";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { FormInput, FormTextarea } from "../../components/Form";
import Badge from "../../components/Badge";
import { LoadingSpinner } from "../../components/Loading";

export default function Settings() {
  const router = useRouter();
  const [settings, setSettings] = useState({});
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await adminFetcher("/api/admin/site-settings");
      setSettings(data || {});
    } catch (err) {
      if (err instanceof APIError && err.status === 401) {
        router.push("/admin/login");
      } else {
        setError("Failed to load settings");
      }
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setError("");
    setSuccess("");

    if (!key.trim()) {
      setError("Key is required");
      return;
    }

    if (!value.trim()) {
      setError("Value is required");
      return;
    }

    try {
      // Try to parse as JSON, if it fails treat as plain string
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // If JSON parsing fails, treat as plain string
        parsedValue = value.trim();
      }

      await adminPostRequest("/api/admin/site-settings", {
        key,
        value: parsedValue,
      });
      setSuccess("Setting saved successfully!");
      await load();
      setKey("");
      setValue("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      if (err instanceof APIError && err.status === 401) {
        router.push("/admin/login");
      } else if (err instanceof APIError) {
        setError(err.message || "Failed to save setting");
      } else {
        setError("Failed to save setting. Invalid JSON value?");
      }
    }
  }

  function edit(settingKey, settingValue) {
    setKey(settingKey);
    setValue(typeof settingValue === "string" ? settingValue : JSON.stringify(settingValue, null, 2));
    setError("");
    setSuccess("");
  }

  async function deleteSetting(settingKey) {
    if (!confirm(`Are you sure you want to delete the setting "${settingKey}"?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await adminDeleteRequest(`/api/admin/site-settings/${encodeURIComponent(settingKey)}`);
      setSuccess("Setting deleted successfully!");
      await load();
      setKey("");
      setValue("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      if (err instanceof APIError && err.status === 401) {
        router.push("/admin/login");
      } else if (err instanceof APIError) {
        setError(err.message || "Failed to delete setting");
      } else {
        setError("Failed to delete setting");
      }
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Site Settings"
          subtitle="Manage application configuration"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add Setting
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            <FormInput
              label="Key"
              placeholder="e.g., storeName"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <FormTextarea
              label="Value"
              placeholder='e.g., "willy COLLECTION" or {"open":"9AM","close":"5PM"} or just plain text'
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows="4"
            />
            <Button
              fullWidth
              variant="primary"
              onClick={save}
              disabled={!key.trim() || !value.trim()}
            >
              Save Setting
            </Button>
          </Card>

          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Current Settings
                </h2>

                {loading ? (
                  <LoadingSpinner />
                ) : Object.keys(settings).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No settings configured yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(settings).map(([k, v]) => (
                      <div
                        key={k}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono font-semibold text-gray-900">
                            {k}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => edit(k, v)}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteSetting(k)}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <pre className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200 overflow-auto max-h-32">
                          {JSON.stringify(v, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
