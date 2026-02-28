import requests

import os
BASE_URL = os.environ.get("BASE_URL", "http://localhost:4000")
TIMEOUT = 30
BYPASS_HEADERS = {"X-Bypass-Rate-Limit": "1", "X-Reset-Rate-Limit": "1"}

def test_get_api_sneakers_with_filters():
    try:
        # First, get a list of brands to use brand filter
        brands_resp = requests.get(f"{BASE_URL}/api/brands", headers=BYPASS_HEADERS, timeout=TIMEOUT)
        assert brands_resp.status_code == 200
        brands = brands_resp.json()
        brand_id = brands[0]['id'] if brands else None

        # Get a list of categories to use category filter
        categories_resp = requests.get(f"{BASE_URL}/api/categories", headers=BYPASS_HEADERS, timeout=TIMEOUT)
        assert categories_resp.status_code == 200
        categories = categories_resp.json()
        category_id = categories[0]['id'] if categories else None

        # Prepare search term (using a known brand or category name or generic term if none)
        search_term = "Air"  # common sneaker search term

        # Test combinations of filters
        filter_combinations = [
            {},
            {"brand": brand_id} if brand_id else {},
            {"category": category_id} if category_id else {},
            {"search": search_term},
            {"brand": brand_id, "category": category_id} if brand_id and category_id else {},
            {"brand": brand_id, "search": search_term} if brand_id else {},
            {"category": category_id, "search": search_term} if category_id else {},
            {"brand": brand_id, "category": category_id, "search": search_term} if brand_id and category_id else {}
        ]

        # also try slug-based filters if possible
        if brands and len(brands) > 0:
            filter_combinations.append({"brand": brands[0]['slug']})
        if categories and len(categories) > 0:
            filter_combinations.append({"category": categories[0]['slug']})

        # Removed filtering out empty dicts to keep the no-filter test case

        for params in filter_combinations:
            resp = requests.get(f"{BASE_URL}/api/sneakers", params=params, headers=BYPASS_HEADERS, timeout=TIMEOUT)
            assert resp.status_code == 200
            data = resp.json()
            assert isinstance(data, list)
            # Each item should be a sneaker object (dict) with at least id and modelName keys expected in Sneaker
            for sneaker in data:
                assert isinstance(sneaker, dict)
                assert 'id' in sneaker
                assert 'modelName' in sneaker

                # Optional deeper validation: If brand filter applied, sneaker.brandId should match brand_id
                if "brand" in params:
                    assert sneaker.get('brandId') == params['brand']

                # Removed categoryId assertion because PRD does not define categoryId in Sneaker

                # If search term applied, match it in modelName or description (case insensitive)
                if "search" in params:
                    search_lower = params['search'].lower()
                    model_name = sneaker.get('modelName', '').lower()
                    desc = sneaker.get('description', '').lower() if 'description' in sneaker else ''
                    assert (search_lower in model_name) or (search_lower in desc)

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_get_api_sneakers_with_filters()
