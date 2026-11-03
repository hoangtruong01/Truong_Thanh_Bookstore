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
      echo "  ⏳ Deployment is active but release SHA does not match expected ${EXPECTED_RELEASE}. Deployment may still be in progress."
    fi

    IS_UP=false
    if echo "$HTTP_BODY" | grep -q '"status":"UP"'; then
      IS_UP=true
    fi

    IS_DB_HEALTHY=false
    if echo "$HTTP_BODY" | grep -q '"database":{"status":"HEALTHY"' || echo "$HTTP_BODY" | grep -q '"status":"HEALTHY"'; then
      IS_DB_HEALTHY=true
    fi

    if [ "$IS_UP" = true ] && [ "$IS_DB_HEALTHY" = true ] && [ "$RELEASE_MATCHED" = true ]; then
      echo "  Payload validation: PASSED"
      echo "  Details: ${HTTP_BODY}"
      echo "======================================================================"
      echo "✅ SMOKE TEST PASSED: Backend is UP, Database is HEALTHY, and Release matches!"
      echo "======================================================================"
      exit 0
    else
      if [ "$RELEASE_MATCHED" = false ] && [ "$IS_UP" = true ] && [ "$IS_DB_HEALTHY" = true ]; then
        echo "  ⏳ Release mismatch: waiting for rolling update to commit ${EXPECTED_RELEASE}..."
      else
        echo "  ⚠️ HTTP 200 received but database or system is DEGRADED: ${HTTP_BODY}"
      fi
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
