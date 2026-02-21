import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import API_BASE from "../../lib/api";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { FormInput, FormTextarea } from "../../components/Form";
import Badge from "../../components/Badge";
import { LoadingSpinner } from "../../components/Loading";

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE}/api/admin/site-settings`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      // Error handled via error state
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE}/api/admin/site-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          key,
          value: JSON.parse(value || '""'),
        }),
      });
      if (res.ok) {
        load();
        setKey("");
        setValue("");
      }
    } catch (err) {
      // Error handled via error state
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
            <FormInput
              label="Key"
              placeholder="e.g., storeName"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <FormTextarea
              label="Value (JSON)"
              placeholder='e.g., "willy COLLECTION" or {"text":"hello"}'
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
                          <Badge variant="default">String</Badge>
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
