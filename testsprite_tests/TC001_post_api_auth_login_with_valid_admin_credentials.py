import requests

def test_post_api_auth_login_with_valid_admin_credentials():
    import os
    # use backend directly; frontend dev server may not be running during tests
    base_url = os.environ.get("BASE_URL", "http://localhost:4000")
    url = f"{base_url}/api/auth/login"
    headers = {
        "Content-Type": "application/json"
    }
    # Use valid admin credentials for login. These can be set through
    # ADMIN_EMAIL and ADMIN_PASSWORD environment variables for security.
    import os
    payload = {
        "email": os.environ.get("ADMIN_EMAIL", "admin@example.com"),
        "password": os.environ.get("ADMIN_PASSWORD", "password123"),
    }
    try:
        # clear any existing rate‑limit counters before exercising auth
        headers["X-Reset-Rate-Limit"] = "1"
        headers["X-Bypass-Rate-Limit"] = "1"
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate presence of JWT token and admin profile keys in the response
    assert "token" in json_resp and isinstance(json_resp["token"], str) and len(json_resp["token"]) > 0, "JWT token missing or invalid"
    assert "admin" in json_resp and isinstance(json_resp["admin"], dict), "Admin profile missing or invalid"

    # Optionally check admin profile content for admin rights (e.g. isAdmin flag)
    admin_profile = json_resp["admin"]
    assert admin_profile.get("email") == payload["email"], "Admin email in profile does not match login email"
    assert admin_profile.get("isAdmin") is True, "User is not marked as admin in profile"

test_post_api_auth_login_with_valid_admin_credentials()
