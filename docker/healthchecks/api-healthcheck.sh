#!/usr/bin/env sh
set -e

node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/system_db', (r) => { process.exit(r.statusCode >= 200 && r.statusCode < 300 ? 0 : 1); }).on('error', () => process.exit(1));"
