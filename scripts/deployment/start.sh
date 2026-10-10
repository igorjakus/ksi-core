#!/bin/sh
set -eu
case "$KSI_APP" in
  server) exec bun apps/server/src/index.ts ;;
  web|auth|dashboard) exec bun "apps/$KSI_APP/build/index.js" ;;
  *) echo 'Invalid application' >&2; exit 1 ;;
esac
