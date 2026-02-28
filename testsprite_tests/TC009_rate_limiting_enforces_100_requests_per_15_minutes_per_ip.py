import requests

import os
BASE_URL = os.environ.get("BASE_URL", "http://localhost:4000")
API_PATH = "/api/sneakers"
REQUEST_TIMEOUT = 30

def test_rate_limiting_enforces_100_requests_per_15_minutes_per_ip():
    success_count = 0
    rate_limit_exceeded = False

    # ensure we start with a fresh rate limit window
    try:
        requests.get(f"{BASE_URL}{API_PATH}", headers={"X-Reset-Rate-Limit": "1"}, timeout=REQUEST_TIMEOUT)
    except Exception:
        pass

    # iterate a bit over 100 requests; backend rate limiter should kick in
    for i in range(1, 102):
        try:
            response = requests.get(f"{BASE_URL}{API_PATH}", timeout=REQUEST_TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request {i} failed with exception: {e}"

        if response.status_code == 200:
            assert not rate_limit_exceeded, f"Received 200 after already receiving 429 at request {i}"
            success_count += 1
        elif response.status_code == 429:
            # Rate limit exceeded
            rate_limit_exceeded = True
            break
        else:
            assert False, f"Request {i} unexpected status code {response.status_code}, expected 200 or 429"

    assert success_count <= 100, f"Expected at most 100 successful requests but got {success_count}"
    assert rate_limit_exceeded, "Rate limit was not enforced by receiving a 429 status code"


test_rate_limiting_enforces_100_requests_per_15_minutes_per_ip()
