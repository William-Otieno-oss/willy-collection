import requests

import os
BASE_URL = os.environ.get("BASE_URL", "http://localhost:4000")
LOGIN_ENDPOINT = "/api/auth/login"
ADMIN_SNEAKERS_ENDPOINT = "/api/admin/sneakers"
REQUEST_TIMEOUT = 30

# Replace these with valid admin credentials for testing or use
# environment variables to avoid committing secrets
import os
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "password123")

def test_post_api_admin_sneakers_with_valid_jwt_and_product_data():
    # Step 1: Authenticate as admin to get JWT token
    login_url = BASE_URL + LOGIN_ENDPOINT
    login_payload = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    try:
        # reset rate limiter before login
        login_response = requests.post(
            login_url,
            json=login_payload,
            headers={"X-Reset-Rate-Limit": "1", "X-Bypass-Rate-Limit": "1"},
            timeout=REQUEST_TIMEOUT,
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        login_data = login_response.json()
        token = login_data.get("token") or login_data.get("jwt") or login_data.get("accessToken") \
                or login_data.get("authToken")  # Handling common naming variants
        # If token not found in common fields, check admin profile for token key
        if not token:
            # Try nested keys if present
            if isinstance(login_data, dict):
                for key in ["authToken", "accessToken", "token", "jwt"]:
                    if key in login_data:
                        token = login_data[key]
                        break
        assert token and isinstance(token, str), "JWT token not found in login response"
    except Exception as e:
        raise AssertionError(f"Admin login failed with exception: {e}")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Step 2: define valid sneaker product data
    # grab an existing brand id from the public API so we pass validation
    brands_resp = requests.get(BASE_URL + "/api/brands", timeout=REQUEST_TIMEOUT)
    if brands_resp.status_code == 200:
        brands_list = brands_resp.json()
        if isinstance(brands_list, list) and brands_list:
            first_brand = brands_list[0]
            brand_id_value = first_brand.get("id") or first_brand.get("_id")
        else:
            brand_id_value = None
    else:
        brand_id_value = None

    import uuid
    unique_model_name = f"TestSneaker_{uuid.uuid4()}"
    sneaker_payload = {
        "modelName": unique_model_name,
        "price": 199.99,
        # use a numeric brand id when available to satisfy backend validation
        "brandId": brand_id_value if brand_id_value is not None else 1,
    }

    sneaker_url = BASE_URL + ADMIN_SNEAKERS_ENDPOINT

    created_sneaker_id = None

    try:
        # Step 3: POST new sneaker product with JWT authorization
        # reset rate limit so the admin call is not throttled
        headers["X-Reset-Rate-Limit"] = "1"
        response = requests.post(sneaker_url, headers=headers, json=sneaker_payload, timeout=REQUEST_TIMEOUT)
        assert response.status_code == 201, f"Expected status 201, got {response.status_code}: {response.text}"
        sneaker_data = response.json()

        # Validate response contains sneaker object with expected keys
        # At minimum, it should include modelName, price, brandId and some id field
        assert isinstance(sneaker_data, dict), "Response JSON is not an object"
        assert sneaker_data.get("modelName") == sneaker_payload["modelName"], "modelName mismatch in response"
        assert sneaker_data.get("price") == sneaker_payload["price"], "price mismatch in response"
        assert sneaker_data.get("brandId") == sneaker_payload["brandId"], "brandId mismatch in response"
        # Try common id keys for sneaker product
        created_sneaker_id = sneaker_data.get("id") or sneaker_data.get("_id") or sneaker_data.get("productId")
        assert created_sneaker_id, "Response does not contain sneaker id"

    finally:
        # Cleanup: delete the created sneaker product to avoid test pollution
        if created_sneaker_id:
            # cleanup using the actual sneakers endpoint (previously mislabeled as products)
            delete_url = f"{BASE_URL}/api/admin/sneakers/{created_sneaker_id}"
            try:
                del_response = requests.delete(delete_url, headers=headers, timeout=REQUEST_TIMEOUT)
                assert del_response.status_code in (200, 204), f"Failed to delete test sneaker: {del_response.text}"
            except Exception as e:
                # Log but do not fail test on cleanup
                print(f"Warning: cleanup delete failed with exception: {e}")

test_post_api_admin_sneakers_with_valid_jwt_and_product_data()
