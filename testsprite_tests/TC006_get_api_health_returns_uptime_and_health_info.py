import requests

def test_get_api_health_returns_uptime_and_health_info():
    import os
    base_url = os.environ.get("BASE_URL", "http://localhost:4000")
    url = f"{base_url}/api/health"
    headers = {
        "Accept": "application/json",
        "X-Bypass-Rate-Limit": "1",
        "X-Reset-Rate-Limit": "1"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        json_data = response.json()
        assert isinstance(json_data, dict), "Response JSON should be an object"
        # We expect keys like uptime and some health info in the response
        assert "uptime" in json_data, "Response JSON missing 'uptime' field"
        # health info may be other fields, but at minimum expect uptime present
        # Optionally check uptime is a non-negative number
        uptime = json_data.get("uptime")
        assert isinstance(uptime, (int, float)) and uptime >= 0, "'uptime' should be a non-negative number"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_health_returns_uptime_and_health_info()
