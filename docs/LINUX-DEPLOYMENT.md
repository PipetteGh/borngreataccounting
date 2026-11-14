# Linux Server Deployment Guide

This guide covers deploying **BorngreatAccounting (`BtAccounting`)** on a production Linux server (Ubuntu 22.04 / 24.04 LTS, Debian 12, or RHEL/Rocky Linux 9) with HTTPS/TLS termination and systemd auto-start.

---

## 1. Install Docker Engine & Docker Compose v2 (Ubuntu / Debian)

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git openssl
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

---

## 2. Clone and Install BorngreatAccounting

```bash
sudo mkdir -p /opt/borngreataccounting
sudo chown "$USER":"$USER" /opt/borngreataccounting
git clone https://github.com/PipetteGh/borngreataccounting.git /opt/borngreataccounting
cd /opt/borngreataccounting
chmod +x install.sh backup.sh restore.sh upgrade.sh setup.sh
./install.sh
```

---

## 3. Configure Domain & HTTPS (Caddy or Nginx + Let's Encrypt)

If terminating HTTPS with **Caddy** or **Nginx** on the host:

1. In `/opt/borngreataccounting/.env`, set:
   ```ini
   BASE_URL=https://accounting.yourdomain.com
   PUBLIC_PROXY_PORT=8080
   ```
2. Restart the proxy container:
   ```bash
   docker compose -f docker-compose.production.yml up -d proxy server
   ```
3. Point Caddy (`Caddyfile`) to `127.0.0.1:8080`:
   ```caddyfile
   accounting.yourdomain.com {
       reverse_proxy 127.0.0.1:8080
   }
   ```

---

## 4. Systemd Service for Automatic Boot Recovery

Create `/etc/systemd/system/borngreataccounting.service`:

```ini
[Unit]
Description=BorngreatAccounting (BtAccounting) Production Stack
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/borngreataccounting
ExecStart=/usr/bin/docker compose -f docker-compose.production.yml --env-file .env up -d
ExecStop=/usr/bin/docker compose -f docker-compose.production.yml --env-file .env down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now borngreataccounting.service
```
