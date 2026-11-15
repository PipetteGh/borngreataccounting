#!/usr/bin/env bash
# ==============================================================================
# BorngreatAccounting (BtAccounting) — Automated Linux / macOS Installer
# Your Accounting. Your Servers. Your Control.
# Automatically installs missing dependencies (Docker, Compose, OpenSSL, Git,
# curl) from official OS repositories before launching the stack.
# ==============================================================================
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
ENV_FILE="${ENV_FILE:-.env}"
ENV_TEMPLATE="${ENV_TEMPLATE:-.env.production.example}"

echo "======================================================================"
echo "  BorngreatAccounting (BtAccounting) — Production Installer"
echo "  Your Accounting. Your Servers. Your Control."
echo "======================================================================"

SUDO=""
if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
  SUDO="sudo"
fi

install_system_packages() {
  if command -v apt-get >/dev/null 2>&1; then
    ${SUDO} apt-get update -y
    ${SUDO} apt-get install -y "$@"
  elif command -v dnf >/dev/null 2>&1; then
    ${SUDO} dnf install -y "$@"
  elif command -v yum >/dev/null 2>&1; then
    ${SUDO} yum install -y "$@"
  elif command -v pacman >/dev/null 2>&1; then
    ${SUDO} pacman -Sy --noconfirm "$@"
  elif command -v apk >/dev/null 2>&1; then
    ${SUDO} apk add --no-cache "$@"
  elif command -v brew >/dev/null 2>&1; then
    brew install "$@"
  fi
}

# Ensure curl, openssl, git are installed
for pkg in curl openssl git; do
  if ! command -v "${pkg}" >/dev/null 2>&1; then
    echo "[Dependencies] Installing missing package: ${pkg}..."
    install_system_packages "${pkg}"
  fi
done

# Ensure Docker Engine & Docker Compose are installed from official sources
if ! command -v docker >/dev/null 2>&1; then
  echo "[Dependencies] Docker not found. Installing Docker Engine from official get.docker.com script..."
  curl -fsSL https://get.docker.com | ${SUDO} sh
  if command -v systemctl >/dev/null 2>&1; then
    ${SUDO} systemctl enable --now docker || true
  fi
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "[Dependencies] Installing docker-compose-plugin..."
  install_system_packages docker-compose-plugin || install_system_packages docker-compose
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
  else
    COMPOSE_CMD="docker-compose"
  fi
fi

generate_secret() {
  local bytes="${1:-32}"
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 "${bytes}" | tr -d '\n\r/+=' | cut -c1-"${bytes}"
  else
    head -c "${bytes}" /dev/urandom | base64 | tr -d '\n\r/+=' | cut -c1-"${bytes}"
  fi
}

generate_hex() {
  local bytes="${1:-32}"
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "${bytes}" | tr -d '\n\r'
  else
    od -An -tx1 -N "${bytes}" /dev/urandom | tr -d ' \n\r'
  fi
}

if [ ! -f "${ENV_FILE}" ]; then
  echo "[1/4] Creating ${ENV_FILE} from ${ENV_TEMPLATE} and generating cryptographic secrets..."
  cp "${ENV_TEMPLATE}" "${ENV_FILE}"

  JWT_SECRET="$(generate_secret 48)"
  TOTP_KEY="$(generate_secret 32)"
  DB_PASS="$(generate_secret 24)"
  DB_ROOT_PASS="$(generate_secret 24)"
  CH_PASS="$(generate_secret 24)"
  GARAGE_RPC="$(generate_hex 32)"
  GARAGE_ADMIN="$(generate_secret 32)"

  sed -i.bak \
    -e "s|^APP_JWT_SECRET=.*|APP_JWT_SECRET=${JWT_SECRET}|" \
    -e "s|^TWO_FACTOR_ENCRYPTION_KEY=.*|TWO_FACTOR_ENCRYPTION_KEY=${TOTP_KEY}|" \
    -e "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|" \
    -e "s|^DB_ROOT_PASSWORD=.*|DB_ROOT_PASSWORD=${DB_ROOT_PASS}|" \
    -e "s|^CLICKHOUSE_PASSWORD=.*|CLICKHOUSE_PASSWORD=${CH_PASS}|" \
    -e "s|^GARAGE_RPC_SECRET=.*|GARAGE_RPC_SECRET=${GARAGE_RPC}|" \
    -e "s|^GARAGE_ADMIN_TOKEN=.*|GARAGE_ADMIN_TOKEN=${GARAGE_ADMIN}|" \
    "${ENV_FILE}"
  rm -f "${ENV_FILE}.bak"
  chmod 600 "${ENV_FILE}" || true
  echo "      Generated secure credentials in ${ENV_FILE}."
else
  echo "[1/4] Existing ${ENV_FILE} detected — preserving existing configuration."
fi

echo "[2/4] Pulling or building BorngreatAccounting container images..."
${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" pull || \
  ${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" build

echo "[3/4] Starting BorngreatAccounting services and running database migrations..."
${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d

# Configure automatic startup on reboot for Linux (systemd) and macOS (launchd)
ABS_DIR="$(cd "$(dirname "${COMPOSE_FILE}")" && pwd)"
ABS_COMPOSE="${ABS_DIR}/$(basename "${COMPOSE_FILE}")"
ABS_ENV="$(cd "$(dirname "${ENV_FILE}")" && pwd)/$(basename "${ENV_FILE}")"
COMPOSE_BIN="$(command -v docker-compose || command -v docker)"

if [ "$(uname -s)" = "Linux" ] && command -v systemctl >/dev/null 2>&1; then
  echo "[3.5/4] Configuring systemd auto-start service (borngreataccounting.service)..."
  ${SUDO} systemctl enable --now docker >/dev/null 2>&1 || true
  if [ "${COMPOSE_CMD}" = "docker compose" ]; then
    EXEC_START="${COMPOSE_BIN} compose -f ${ABS_COMPOSE} --env-file ${ABS_ENV} up -d"
    EXEC_STOP="${COMPOSE_BIN} compose -f ${ABS_COMPOSE} --env-file ${ABS_ENV} down"
  else
    EXEC_START="${COMPOSE_BIN} -f ${ABS_COMPOSE} --env-file ${ABS_ENV} up -d"
    EXEC_STOP="${COMPOSE_BIN} -f ${ABS_COMPOSE} --env-file ${ABS_ENV} down"
  fi
  ${SUDO} tee /etc/systemd/system/borngreataccounting.service >/dev/null <<EOF
[Unit]
Description=BorngreatAccounting (BtAccounting) Service Stack
After=docker.service network-online.target
Requires=docker.service
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${ABS_DIR}
ExecStart=${EXEC_START}
ExecStop=${EXEC_STOP}
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
  ${SUDO} systemctl daemon-reload
  ${SUDO} systemctl enable borngreataccounting.service >/dev/null 2>&1 || true
  echo "      systemd auto-start enabled (borngreataccounting.service)."
elif [ "$(uname -s)" = "Darwin" ]; then
  echo "[3.5/4] Configuring macOS LaunchAgent auto-start..."
  LAUNCH_AGENTS_DIR="${HOME}/Library/LaunchAgents"
  PLIST_PATH="${LAUNCH_AGENTS_DIR}/com.borngreat.accounting.plist"
  mkdir -p "${LAUNCH_AGENTS_DIR}"
  cat > "${PLIST_PATH}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.borngreat.accounting</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>open -a Docker >/dev/null 2>&amp;1 || true; for i in \$(seq 1 30); do docker info >/dev/null 2>&amp;1 &amp;&amp; break; sleep 2; done; cd "${ABS_DIR}" &amp;&amp; ${COMPOSE_CMD} -f "${ABS_COMPOSE}" --env-file "${ABS_ENV}" up -d</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${ABS_DIR}/.runtime/launchd-stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${ABS_DIR}/.runtime/launchd-stderr.log</string>
</dict>
</plist>
EOF
  mkdir -p "${ABS_DIR}/.runtime"
  launchctl unload "${PLIST_PATH}" >/dev/null 2>&1 || true
  launchctl load -w "${PLIST_PATH}" >/dev/null 2>&1 || true
  echo "      macOS LaunchAgent enabled (${PLIST_PATH})."
fi

echo "[4/4] Verifying service readiness..."
PORT_VAL="$(grep -E '^PUBLIC_PROXY_PORT=' "${ENV_FILE}" | cut -d= -f2 || echo 80)"
PORT_VAL="${PORT_VAL:-80}"

echo "======================================================================"
echo "  BorngreatAccounting is starting up!"
echo "  Dashboard URL: http://localhost:${PORT_VAL} (or http://<your-server-ip>:${PORT_VAL})"
echo ""
echo "  First-Time Setup (no default password required):"
echo "    1. Open the URL above in your browser — it will open First-Time Setup."
echo "    2. Create your Administrator Name, Email (username), and Password."
echo "    3. Complete the Organization Setup Wizard to initialize your company."
echo ""
echo "  Check status:  ${COMPOSE_CMD} -f ${COMPOSE_FILE} ps"
echo "  View logs:     ${COMPOSE_CMD} -f ${COMPOSE_FILE} logs -f"
echo "======================================================================"
