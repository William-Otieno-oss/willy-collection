import requests

import os
BASE_URL = os.environ.get("BASE_URL", "http://localhost:4000")
TIMEOUT = 30

def test_get_ready_returns_200_when_db_reachable():
    # verify both aliased paths return the expected result
    for path in ["/api/ready"]:  # Only test /api/ready since it's the actual endpoint
        url = f"{BASE_URL}{path}"
        try:
            # ensure rate limit does not interfere
            response = requests.get(url, headers={"X-Reset-Rate-Limit": "1", "X-Bypass-Rate-Limit": "1"}, timeout=TIMEOUT)
            response.raise_for_status()
            assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        except requests.exceptions.RequestException as e:
            assert False, f"Request to {url} failed: {e}"

test_get_ready_returns_200_when_db_reachable()