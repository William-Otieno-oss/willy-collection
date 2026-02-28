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

print("\n" + "="*70)
print("RUNNING TESTSPRITE TESTS (with fixes)")
print("="*70 + "\n")

passed = 0
failed = 0

for name, test_file in tests:
    try:
        result = subprocess.run(
            [sys.executable, test_file], 
            capture_output=True, 
            timeout=20, 
            text=True
        )
        if result.returncode == 0:
            print(f"✓ {name:6} PASSED")
            passed += 1
        else:
            print(f"✗ {name:6} FAILED")
            failed += 1
    except subprocess.TimeoutExpired:
        print(f"⏱ {name:6} TIMEOUT")
        failed += 1
    except Exception as e:
        print(f"✗ {name:6} ERROR: {e}")
        failed += 1

print("\n" + "="*70)
print("SUMMARY")
print("="*70)
print(f"Passed:  {passed}/9  ({passed*100//9}%)")
print(f"Failed:  {failed}/9")
print("="*70)

if passed >= 7:
    print("\n✓ Strong improvement! 7+ tests passing.")
elif passed >= 6:
    print(f"\n✓ Good progress! {passed} tests passing.")
else:
    print(f"\n⚠ {passed} tests passing - continue debugging")
