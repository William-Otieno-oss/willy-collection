import requests

import os
BASE_URL = os.environ.get("BASE_URL", "http://localhost:4000")
ORDERS_ENDPOINT = "/api/orders"
TIMEOUT = 30


def test_post_api_orders_with_valid_order_data():
    url = BASE_URL + ORDERS_ENDPOINT
    headers = {
        "Content-Type": "application/json",
        "X-Bypass-Rate-Limit": "1",
        "X-Reset-Rate-Limit": "1"
    }
    # A valid order payload with items, customerName, phone, address, billing, deliveryMethod, and paymentMethod
    payload = {
        "items": [
            {
                "productId": "sample-product-id-1",
                "quantity": 2
            },
            {
                "productId": "sample-product-id-2",
                "quantity": 1
            }
        ],
        "customerName": "John Doe",
        "phone": "+1234567890",
        "address": "123 Sneaker St, Shoe City, SK 12345",
        "billing": {
            "cardNumber": "4111111111111111",
            "expiryDate": "12/26",
            "cvv": "123",
            "cardHolderName": "John Doe"
        },
        "deliveryMethod": "standard",
        "paymentMethod": "credit_card"
    }

    try:
        # clear rate limit before sending order
        headers["X-Reset-Rate-Limit"] = "1"
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    assert response.status_code == 201, f"Expected status code 201 but got {response.status_code}"

    try:
        order = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate response structure contains essential fields for an Order object
    assert "id" in order and isinstance(order["id"], (str, int)), "Order ID missing or invalid"
    assert "items" in order and isinstance(order["items"], list) and len(order["items"]) > 0, "Order items missing or invalid"
    assert "customerName" in order and order["customerName"] == payload["customerName"], "Customer name mismatch"
    assert "phone" in order and order["phone"] == payload["phone"], "Phone mismatch"
    assert "address" in order and order["address"] == payload["address"], "Address mismatch"

    # Check each order item matches the ordered quantity and productId
    for i, item in enumerate(payload["items"]):
        assert order["items"][i]["productId"] == item["productId"] or str(order["items"][i]["productId"]) == str(item["productId"]), \
            "Order item productId mismatch"
        assert order["items"][i]["quantity"] == item["quantity"], "Order item quantity mismatch"
        assert isinstance(order["items"][i].get("price"), (int, float)), "Order item price missing or not numeric"


test_post_api_orders_with_valid_order_data()
