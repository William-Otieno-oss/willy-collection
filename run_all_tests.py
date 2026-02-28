#!/usr/bin/env python3
import subprocess
import os

os.chdir(r'c:\Data\Willy Collection website\testsprite_tests')

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

results = {}
passed_count = 0
failed_count = 0

print("\n" + "="*70)
print("RUNNING TESTSPRITE TEST SUITE (against 127.0.0.1:4000)")
print("="*70 + "\n")

for name, test_file in tests:
    try:
        result = subprocess.run(['python', test_file], capture_output=True, timeout=30, text=True)
        if result.returncode == 0:
            status = "✓ PASSED"
            passed_count += 1
            results[name] = "PASSED"
        else:
            status = "✗ FAILED"
            failed_count += 1
            results[name] = "FAILED"
            # Show last line of error
            if result.stderr:
                error_lines = result.stderr.strip().split('\n')
                print(f"  {name}: {error_lines[-1][:80]}")
    except subprocess.TimeoutExpired:
        status = "✗ TIMEOUT"
        failed_count += 1
        results[name] = "TIMEOUT"
    except Exception as e:
        status = f"✗ ERROR: {e}"
        failed_count += 1
        results[name] = "ERROR"
    
    print(f"{status:15}  {name}")

print("\n" + "="*70)
print("SUMMARY")
print("="*70)
print(f"Passed:  {passed_count}/9  ({passed_count*100//9}%)")
print(f"Failed:  {failed_count}/9")
print("="*70)

if passed_count == 9:
    print("🎉 ALL TESTS PASSED!")
elif passed_count >= 7:
    print(f"✓ {passed_count} tests passing - improvement from initial 44%!")
else:
    print(f"⚠ {passed_count} tests passing - continue debugging")
