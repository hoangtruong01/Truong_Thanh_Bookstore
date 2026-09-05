#!/usr/bin/env bash
# ==============================================================================
# TRƯỜNG THÀNH BOOKSTORE — ANDROID RELEASE KEYSTORE GENERATOR (Bash)
# ==============================================================================
# Usage:
#   bash mobile/scripts/generate-keystore.sh [KEY_ALIAS] [KEYSTORE_PATH]
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEY_ALIAS="${1:-truongthanh_release_key}"
KEYSTORE_PATH="${2:-"${SCRIPT_DIR}/../android/app/upload-keystore.jks"}"

echo "======================================================================"
echo "🔐 TRƯỜNG THÀNH BOOKSTORE — RELEASE KEYSTORE GENERATOR"
echo "======================================================================"

if ! command -v keytool &> /dev/null; then
    if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/keytool" ]]; then
        KEYTOOL="${JAVA_HOME}/bin/keytool"
    else
        echo "❌ Error: keytool not found. Please install JDK and configure JAVA_HOME."
        exit 1
    fi
else
    KEYTOOL="keytool"
fi

if [[ -f "${KEYSTORE_PATH}" ]]; then
    echo "Keystore already exists: ${KEYSTORE_PATH}. Preserve it; use a different path for a new key."
    exit 1
fi

echo ""
echo "Generating 2048-bit RSA Keystore..."
echo "Target file: ${KEYSTORE_PATH}"
echo "Key alias:   ${KEY_ALIAS}"
echo "Validity:    10,000 days (27+ years)"
echo ""

"${KEYTOOL}" -genkey -v \
    -keystore "${KEYSTORE_PATH}" \
    -alias "${KEY_ALIAS}" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storetype JKS \
    -dname "CN=Truong Thanh Bookstore, OU=Mobile Engineering, O=Truong Thanh Co Ltd, L=Ninh Binh, ST=Ninh Binh, C=VN"

echo ""
echo "✅ Keystore generated successfully at: ${KEYSTORE_PATH}"
echo ""
echo "Next steps:"
echo "1. Copy 'mobile/android/key.properties.example' to 'mobile/android/key.properties'"
echo "2. Fill in your chosen passwords and set 'storeFile=../app/upload-keystore.jks'"
echo "3. Build release bundle: flutter build appbundle --release"
echo "======================================================================"
