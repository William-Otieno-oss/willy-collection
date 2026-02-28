import requests
import uuid

import os
BASE_URL = os.environ.get("BASE_URL", "http://localhost:4000")
TIMEOUT = 30

import os
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "password123")

def test_post_api_s3_presign_with_valid_jwt_and_filename():
    login_url = f"{BASE_URL}/api/auth/login"
    presign_url = f"{BASE_URL}/api/s3/presign"

    # Step 1: Authenticate and get JWT token
    login_payload = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    try:
        # reset rate limiter to avoid 429 during the login step
        login_resp = requests.post(
            login_url,
            json=login_payload,
            headers={"X-Reset-Rate-Limit": "1", "X-Bypass-Rate-Limit": "1"},
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        token = login_data.get("token") or login_data.get("jwt") or login_data.get("accessToken")
        assert token and isinstance(token, str), "JWT token not found in login response"
    except (requests.RequestException, AssertionError) as e:
        raise Exception(f"Failed to authenticate admin user: {e}")

    # Step 2: Prepare presign request with valid filename and contentType
    unique_filename = f"test_upload_{uuid.uuid4()}.png"
    presign_payload = {
        "filename": unique_filename,
        "contentType": "image/png"
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        presign_resp = requests.post(presign_url, json=presign_payload, headers=headers, timeout=TIMEOUT)
        assert presign_resp.status_code == 200, f"Expected 200 but got {presign_resp.status_code}"
        presign_data = presign_resp.json()
        
        # Validate presign response content has URL and required fields or headers for upload
        assert "url" in presign_data or "URL" in presign_data, "Presigned upload URL missing"
        # PresignedUploadInfo can have fields or signedHeaders per PRD
        has_fields = isinstance(presign_data.get("fields"), dict) and presign_data["fields"]
        has_headers = isinstance(presign_data.get("signedHeaders"), dict) and presign_data["signedHeaders"]
        assert has_fields or has_headers, "Presigned upload credentials (fields or signedHeaders) missing or empty"
    except (requests.RequestException, AssertionError) as e:
        raise Exception(f"Presign S3 POST request failed or invalid response: {e}")

test_post_api_s3_presign_with_valid_jwt_and_filename()