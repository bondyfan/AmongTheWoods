# Among The Woods — dedicated co-op server (Version C)

A neutral game server so co-op no longer has to run on a host **player's**
browser. Clients connect over WebSocket; the room lives on the VPS 24/7.

- `GET /health` → JSON liveness. The web client polls this and only enables the
  **🖥️ Server** button when it answers `{"ready":true}`.
- `WebSocket /ws` → the game transport (see `protocol.js`, mirrors `js/net.js`).

## Status — both milestones DONE ✅

**Milestone 1:** the server owns the room (registry, lifecycle, 24/7
persistence, peer join/leave) and relays the co-op protocol.

**Milestone 2 (live):** the authoritative simulation runs **on the server** —
`GameRoom` (`sim/game-room.mjs`) drives the REAL game modules headless (World +
EnemyManager + Pickups + Projectiles) and broadcasts `snap`. **No player** is the
authority; every client — creator included — is a pure guest that renders the
server's snapshots. Enable/disable with `WOODS_SIM` (default ON; `=0` falls back
to the M1 client-authority relay).

Classic **Create Co-op** still works entirely without this server (Firebase P2P,
`js/net.js`); the **🖥️ Server** button is the server-hosted path (`js/netws.js`).
The two transports coexist behind `multiplayer.js`'s `this.net` seam.

> **Start via `boot.mjs`, never `index.js` directly.** The sim imports bare
> `three`, resolved to `libs/three.module.js` by the ESM hook that `boot.mjs`
> registers first. `node index.js` on a clean box (only `ws` installed) throws
> `ERR_MODULE_NOT_FOUND: three`.

## Run locally

```bash
cd server
npm install
npm start            # listens on :8080  (PORT env to change)
curl localhost:8080/health
```

## Deploy on a Hetzner CX box (Ubuntu 22.04/24.04)

You need a **domain** pointing at the box — the web client is served over HTTPS,
so it can only reach the server over `https://` + `wss://` (browsers block
mixed content). Caddy gives you an automatic TLS cert with almost no config.

```bash
# 1. Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# 2. the code
sudo git clone https://github.com/<you>/AmongTheWoods.git /opt/woods
cd /opt/woods/server && npm ci --omit=dev

# 3. run it under systemd (restarts on crash / reboot)
sudo tee /etc/systemd/system/woods.service >/dev/null <<'UNIT'
[Unit]
Description=Among The Woods server
After=network.target
[Service]
WorkingDirectory=/opt/woods/server
ExecStart=/usr/bin/node boot.mjs
Environment=PORT=8080
# WOODS_SIM=0 to disable server-side sim (fall back to M1 client-authority relay)
Restart=always
RestartSec=2
User=www-data
[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl enable --now woods

# 4. TLS reverse proxy (Caddy → automatic Let's Encrypt cert)
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy

sudo tee /etc/caddy/Caddyfile >/dev/null <<'CADDY'
woods.example.com {
    reverse_proxy localhost:8080
}
CADDY
sudo systemctl reload caddy      # Caddy fetches the cert automatically

# 5. firewall
sudo ufw allow 22,80,443/tcp && sudo ufw --force enable
```

Now `https://woods.example.com/health` should return `{"ready":true}`.

## Point the game at it

Edit **`server-config.js`** in the repo root:

```js
export const SERVER_URL = 'https://woods.example.com';
```

Commit + let Cloudflare Pages redeploy. The **🖥️ Server** button on the Survival
screen lights up as soon as the health check succeeds, and greys out (with a
reason) whenever the box is down.

## Environment knobs

| var | default | meaning |
|-----|---------|---------|
| `PORT` | `8080` | listen port |
| `WOODS_SIM` | `1` | server-side sim ON; `0` = M1 client-authority relay |
| `TICK_HZ` | `15` | server tick rate (drives `Room.tick` → `GameRoom.tick`) |
| `EMPTY_ROOM_TTL_MS` | `120000` | how long an empty room lingers for reconnects |
