FROM debian:buster-slim

ARG DEBIAN_FRONTEND=noninteractive
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

ARG COMPOSE_VERSION=1.24.0
ENV DENO_INSTALL=/deno
ENV PATH=${DENO_INSTALL}/bin:${PATH}
ENV DENO_DIR=${DENO_INSTALL}/.cache/deno

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        apt-utils git openssh-client less procps wget nano jq htop lsb-release \
        apt-transport-https dialog gnupg2 libc6 libgssapi-krb5-2 libicu[0-9][0-9] liblttng-ust0 libstdc++6 zlib1g \
    #
    # install dotnet sdk
    && curl -sL https://packages.microsoft.com/config/debian/10/packages-microsoft-prod.deb > packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm -f packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y dotnet-sdk-3.1\
    #
    # steam dependencies
    && apt-get install -y --no-install-recommends ca-certificates iproute2 unzip curl tar jq locales \
    && apt-get install -y --no-install-recommends libsqlite3-0 lib32gcc1 lib32stdc++6 lib32z1 libgcc1 libcurl4-gnutls-dev:i386 libcurl4:i386 libtinfo5:i386 libncurses5:i386 libcurl3-gnutls:i386 libsdl1.2debian \
    && localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8 \
    #
    # create user
    && apt-get -y install --no-install-recommends sudo \
    && groupadd --gid $USER_GID $USERNAME \
    && useradd -s /bin/bash --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME \
    #
    # install deno
    && mkdir -p /deno \
    && chown -R $USERNAME /deno \
    && curl -fsSL https://deno.land/x/install/install.sh | sh \
    #
    # install docker
    && groupadd docker && usermod -aG docker ${USERNAME} \
    && apt-get install -y apt-transport-https gnupg-agent software-properties-common lsb-release \
    && curl -fsSL https://download.docker.com/linux/$(lsb_release -is | tr '[:upper:]' '[:lower:]')/gpg | (OUT=$(apt-key add - 2>&1) || echo $OUT) \
    && add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/$(lsb_release -is | tr '[:upper:]' '[:lower:]') $(lsb_release -cs) stable" \
    && apt-get update && apt-get install -y docker-ce-cli \
    && curl -sSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose \
    #
    # cleanup
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /var/tmp/* /tmp/*
