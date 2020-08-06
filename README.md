# nurdism/rust:latest

Features:
  Rcon wrapper, auto updater, kills server when update detected

ENV
```bash
# Default launch args, not recomended to change this, use ADDITIONAL_ARGS to extend
STARTUP="./RustDedicated -batchmode +rcon.ip \\\"{{RCON_IP}}\\\" +rcon.port {{RCON_PORT}} +rcon.password \\\"{{RCON_PASS}}\\\" +rcon.web 1 +server.ip {{SERVER_IP}} +server.port {{SERVER_PORT}} +server.hostname \\\"{{SERVER_HOSTNAME}}\\\" +server.identity \\\"{{SERVER_IDENTITY}}\\\" +server.description \\\"{{SERVER_DESCRIPTION}}\\\" +server.url \\\"{{SERVER_URL}}\\\" +server.headerimage \\\"{{SERVER_IMG}}\\\" +server.level \\\"{{SERVER_LEVEL}}\\\" +server.worldsize \\\"{{WORLD_SIZE}}\\\" +server.seed \\\"{{WORLD_SEED}}\\\" +server.maxplayers {{MAX_PLAYERS}} +server.saveinterval {{SAVE_INTERVAL}} {{ADDITIONAL_ARGS}}"

# Additional args to pass to RustDedicated
ADDITIONAL_ARGS=""

# Set to "" to skip installing uMod/OxideMod
OXIDE_DOWNLOAD="https://github.com/OxideMod/Oxide.Rust/releases/latest/download/Oxide.Rust-linux.zip"

# Server info
SERVER_IDENTITY="server"
SERVER_IP="0.0.0.0"
SERVER_PORT="28015"
SERVER_HOSTNAME="A Rust Server"
SERVER_DESCRIPTION="A Rust Server"
SERVER_IMG=""
SERVER_URL="https://example.org/"

# World Settings
SERVER_LEVEL="Procedural Map"
WORLD_SIZE="3000"
WORLD_SEED=""

# RCON Settings
RCON_IP="0.0.0.0"
RCON_PORT="28016"
RCON_PASS="CHANGEME"

# Max player
MAX_PLAYERS="40"

# Server save interval
SAVE_INTERVAL="60"
```

PATHS:
```bash
# rust dedicated server directory
/home/rust/server/bin

# steamcmd directory
/home/rust/server/steam

# server identities directory
/home/rust/server/identities

# uMod/OxideMod directory
/home/rust/server/oxide
```
