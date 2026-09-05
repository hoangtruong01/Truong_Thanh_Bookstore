#!/usr/bin/env bash
set -euo pipefail

# Persist the replica-set membership key separately from application data.
# The official entrypoint still handles initial root-user provisioning.
keyfile=/data/configdb/replica.key
if [ ! -s "$keyfile" ]; then
  umask 077
  openssl rand -base64 756 > "$keyfile"
fi
chown mongodb:mongodb "$keyfile"
chmod 400 "$keyfile"
exec /usr/local/bin/docker-entrypoint.sh "$@"
