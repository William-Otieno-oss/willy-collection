#!/usr/bin/env python3
import subprocess
import sys

tests = [
    ("TC001", "TC001_post_api_auth_login_with_valid_admin_credentials.py"),
    ("TC002", "TC002_get_api_sneakers_with_filters.py"),
    ("TC003", "TC003_post_api_orders_with_valid_order_data.py"),
    ("TC004", "TC004_post_api_admin_sneakers_with_valid_jwt_and_product_data.py"),
    ("TC005", "TC005_post_api_s3_presign_with_valid_jwt_and_filename.py"),
    ("TC006", "TC006_get_api_health_returns_uptime_and_health_info.py"),
    ("TC007", "TC007_get_ready_returns_200_when_db_is_reachable.py"),
    ("TC008", "TC008_get_ready_returns_503_when_db_is_unavailable.py"),
    ("TC009", "TC009_rate_limiting_enforces_100_requests_per_15_minutes_per_ip.py"),
]

passed = 0
failed = 0
results = []

for name, test_file in tests:
    try:
        # TC009 rate limiting test needs more time (101 requests)
        timeout = 120 if name == "TC009" else 30
        result = subprocess.run(
            [sys.executable, test_file],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode == 0:
            passed += 1
            results.append(f"PASS {name}")
        else:
            failed += 1
            results.append(f"FAIL {name}: {result.stderr.split(chr(10))[0]}")
    except subprocess.TimeoutExpired:
        failed += 1
        results.append(f"FAIL {name}: Timeout")
    except Exception as e:
        failed += 1
        results.append(f"FAIL {name}: {str(e)}")

for result in results:
    print(result)

print(f"\n{'='*50}")
print(f"FINAL RESULTS: {passed}/9 PASSED ({passed*100//9}%)")
print(f"{'='*50}")
