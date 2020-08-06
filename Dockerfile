FROM debian:buster-slim

ARG DEBIAN_FRONTEND=noninteractive
ARG USERNAME=rust
ARG USER_UID=1000
ARG USER_GID=$USER_UID

ENV DENO_INSTALL=/deno
ENV PATH=${DENO_INSTALL}/bin:${PATH}
ENV DENO_DIR=${DENO_INSTALL}/.cache/deno

#
# install dependencies
RUN dpkg --add-architecture i386 \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates iproute2 unzip curl tar jq locales \
    && apt-get install -y --no-install-recommends libsqlite3-0 lib32gcc1 lib32stdc++6 lib32z1 libgcc1 libcurl4-gnutls-dev:i386 libcurl4:i386 libtinfo5:i386 libncurses5:i386 libcurl3-gnutls:i386 libsdl1.2debian \
    && localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8 \
    #
    # create user
    && groupadd --gid $USER_GID $USERNAME \
    && useradd -s /bin/bash --uid $USER_UID --gid $USER_GID -m $USERNAME \
    #
    # install deno for wrapper.js
    && mkdir -p /deno \
    && chown -R $USERNAME /deno \
    && curl -fsSL https://deno.land/x/install/install.sh | sh \
    #
    # cleanup
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /var/tmp/* /tmp/*

USER ${USERNAME}

COPY entrypoint.sh /entrypoint.sh
COPY wrapper.js /wrapper.js

ARG BUILD_DATE='1'

ENV BUILD="$BUILD_DATE"
ENV LANGUAGE="en_US.UTF-8"
ENV LANG="en_US.utf8"
ENV TZ="Etc/UTC"
ENV TERM="xterm"

ENV DEBUG="0"
ENV STARTUP="./RustDedicated -batchmode +rcon.ip \\\"{{RCON_IP}}\\\" +rcon.port {{RCON_PORT}} +rcon.password \\\"{{RCON_PASS}}\\\" +rcon.web 1 +server.ip {{SERVER_IP}} +server.port {{SERVER_PORT}} +server.hostname \\\"{{SERVER_HOSTNAME}}\\\" +server.identity \\\"{{SERVER_IDENTITY}}\\\" +server.description \\\"{{SERVER_DESCRIPTION}}\\\" +server.url \\\"{{SERVER_URL}}\\\" +server.headerimage \\\"{{SERVER_IMG}}\\\" +server.level \\\"{{SERVER_LEVEL}}\\\" +server.worldsize \\\"{{WORLD_SIZE}}\\\" +server.seed \\\"{{WORLD_SEED}}\\\" +server.maxplayers {{MAX_PLAYERS}} +server.saveinterval {{SAVE_INTERVAL}} {{ADDITIONAL_ARGS}}"
ENV APP_ID="258550"
ENV STEAM_USER="anonymous"
ENV OXIDE_DOWNLOAD="https://github.com/OxideMod/Oxide.Rust/releases/latest/download/Oxide.Rust-linux.zip"
ENV SERVER_IDENTITY="server"

ENV SERVER_IP="0.0.0.0"
ENV SERVER_PORT="28015"

ENV SERVER_HOSTNAME="A Rust Server"
ENV SERVER_DESCRIPTION="A Rust Server"
ENV SERVER_IMG=""
ENV SERVER_URL="https://example.org/"

ENV SERVER_LEVEL="Procedural Map"
ENV WORLD_SIZE="3000"
ENV WORLD_SEED=""

ENV RCON_IP="0.0.0.0"
ENV RCON_PORT="28016"
ENV RCON_PASS="CHANGEME"
ENV ADDITIONAL_ARGS=""
ENV MAX_PLAYERS="40"
ENV SAVE_INTERVAL="60"

ENV USER=${USERNAME}
ENV HOME=/home/${USERNAME}

WORKDIR /server

CMD ["/bin/bash", "/entrypoint.sh"]
