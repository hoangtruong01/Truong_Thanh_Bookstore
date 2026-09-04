#!/usr/bin/env bash
# ==============================================================================
# Trường Thành Bookstore — Post-Deployment Smoke Test
# ==============================================================================
# Usage:
#   ./scripts/smoke-test.sh [TARGET_URL]
# Example:
#   ./scripts/smoke-test.sh http://localhost:3000
# ==============================================================================

set -euo pipefail

TARGET_URL="${1:-http://localhost:3000}"
EXPECTED_RELEASE="${2:-}"
HEALTH_ENDPOINT="${TARGET_URL%/}/api/health"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-15}"
WAIT_SECONDS="${WAIT_SECONDS:-3}"

echo "======================================================================"
echo "🚀 Starting Automated Smoke Test against: ${HEALTH_ENDPOINT}"
echo "======================================================================"

attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  echo "[$attempt/$MAX_ATTEMPTS] Pinging health endpoint: ${HEALTH_ENDPOINT}..."
  
  HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" "${HEALTH_ENDPOINT}" || true)
  HTTP_BODY=$(echo "$HTTP_RESPONSE" | sed '$d')
  HTTP_CODE=$(echo "$HTTP_RESPONSE" | tail -n1)

  if [ "$HTTP_CODE" = "200" ]; then
    echo "  Status Code: 200 OK"
    
    # Verify JSON response contains expected UP / HEALTHY statuses
    RELEASE_MATCHED=true
    if [ -n "$EXPECTED_RELEASE" ] && ! echo "$HTTP_BODY" | grep -q "\"release\":\"${EXPECTED_RELEASE}\""; then
      RELEASE_MATCHED=false
      echo "  Deployment is healthy but does not match expected release ${EXPECTED_RELEASE}."
    fi
    if echo "$HTTP_BODY" | grep -q '"status":"UP"' && echo "$HTTP_BODY" | grep -q '"database":{"status":"HEALTHY"' && [ "$RELEASE_MATCHED" = true ]; then
      echo "  Payload validation: PASSED"
      echo "  Details: ${HTTP_BODY}"
      echo "======================================================================"
      echo "✅ SMOKE TEST PASSED: Backend is UP and Database is HEALTHY!"
      echo "======================================================================"
      exit 0
    else
      echo "  ⚠️ HTTP 200 received but database or system is DEGRADED: ${HTTP_BODY}"
    fi
  else
    echo "  ⚠️ Received HTTP ${HTTP_CODE} (Expected 200)"
  fi

  attempt=$((attempt + 1))
  if [ "$attempt" -le "$MAX_ATTEMPTS" ]; then
    echo "  Waiting ${WAIT_SECONDS}s before next retry..."
    sleep "$WAIT_SECONDS"
  fi
done

echo "======================================================================"
echo "❌ SMOKE TEST FAILED: Service failed to report HEALTHY within $((MAX_ATTEMPTS * WAIT_SECONDS))s"
echo "======================================================================"
exit 1
