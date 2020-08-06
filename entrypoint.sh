#!/bin/bash

if [ -f .env ]; then
  source <(grep -v '^#' .env | sed -E 's|^(.+)=(.*)$|: ${\1=\2}; export \1|g')
fi

export TERM=xterm
export USERNAME=$(whoami)
export INTERNAL_IP=`ip route get 1 | awk '{print $NF;exit}'`
export ROOT_DIR=/home/$USERNAME/server
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$ROOT_DIR/bin/RustDedicated_Data/Plugins/x86_64:$(pwd)

if [[ $DEBUG == "1" ]]; then
  echo "--------------------------"
  echo "DEBUG"
  echo "USERNAME: '${USERNAME}'"
  echo "STARTUP: '${STARTUP}'"
  echo "APP_ID: '${APP_ID}'"
  echo "STEAM_USER: '${STEAM_USER}'"
  echo "OXIDE_DOWNLOAD: '${OXIDE_DOWNLOAD}'"
  echo "SERVER_IDENTITY: '${SERVER_IDENTITY}'"
  echo "SERVER_LEVEL: '${SERVER_LEVEL}'"
  echo "SERVER_HOSTNAME: '${SERVER_HOSTNAME}'"
  echo "SERVER_PORT: '${SERVER_PORT}'"
  echo "SERVER_DESCRIPTION: '${SERVER_DESCRIPTION}'"
  echo "SERVER_IMG: '${SERVER_IMG}'"
  echo "SERVER_URL: '${SERVER_URL}'"
  echo "WORLD_SIZE: '${WORLD_SIZE}'"
  echo "WORLD_SEED: '${WORLD_SEED}'"
  echo "RCON_PORT: '${RCON_PORT}'"
  echo "RCON_PASS: '${RCON_PASS}'"
  echo "ADDITIONAL_ARGS: '${ADDITIONAL_ARGS}'"
  echo "MAX_PLAYERS: '${MAX_PLAYERS}'"
  echo "SAVE_INTERVAL: '${SAVE_INTERVAL}'"
fi

#
# create base dir
mkdir -p $ROOT_DIR

#
# install steamcmd
if [[ ! -f $ROOT_DIR/steam/steamcmd.sh ]]; then
  echo "Installing SteamCMD"
  mkdir -p $ROOT_DIR/steam
  curl -sL http://media.steampowered.com/installer/steamcmd_linux.tar.gz | tar -v -C $ROOT_DIR/steam -zx
  chmod +x $ROOT_DIR/steam/steamcmd.sh
fi

#
# check for updates
if [[ -f $ROOT_DIR/bin/latest.json ]]; then
  export VERSION=$(cat $ROOT_DIR/bin/latest.json | jq '.version')
  export CURRENT_VERSION=$(curl -sL https://umod.org/games/rust/latest.json | jq '.version')

  if [[ $VERSION == $CURRENT_VERSION ]]; then
    export UPDATE="0"
  else
    export UPDATE="1"
  fi
else
  export UPDATE="1"
fi

#
# update/install server
if [[ ! -f $ROOT_DIR/bin/RustDedicated ]]; then
  export UPDATE="1"
fi

if [[ $UPDATE == "1" ]]; then
    echo "Updating Server"
    mkdir -p $ROOT_DIR/bin
	if [[ -f $ROOT_DIR/steam.txt ]]; then
		$ROOT_DIR/steam/steamcmd.sh +login $STEAM_USER $STEAM_PASS +force_install_dir $ROOT_DIR/bin +app_update $APP_ID validate +runscript $ROOT_DIR/steam.txt
	else
		$ROOT_DIR/steam/steamcmd.sh +login $STEAM_USER $STEAM_PASS +force_install_dir $ROOT_DIR/bin +app_update $APP_ID validate +quit
	fi
fi

if [[ ! -f $ROOT_DIR/bin/RustDedicated  ]]; then
  echo "Error installing AppID(${APP_ID}) via SteamCMD!"
  exit
fi

if [[ ! -L $ROOT_DIR/bin/server ]]; then
  mkdir -p $ROOT_DIR/identities
  ln -s $ROOT_DIR/identities $ROOT_DIR/bin/server
fi

#
# update/install mod platform
if [[ $OXIDE_DOWNLOAD != "" ]]; then
  if [[ ! -f $ROOT_DIR/bin/RustDedicated_Data/Managed/Oxide.Core.dll ]]; then
    export UPDATE="1"
  fi

  if [[ $UPDATE == "1" ]]; then
    echo "--------------------------"
    echo "Updating Mod Platform ($OXIDE_DOWNLOAD)"
    curl -sL $OXIDE_DOWNLOAD > $ROOT_DIR/bin/oxide.zip
    unzip -o -q $ROOT_DIR/bin/oxide.zip -d $ROOT_DIR/bin
    rm $ROOT_DIR/bin/oxide.zip
  fi

  if [[ ! -f $ROOT_DIR/bin/RustDedicated_Data/Managed/Oxide.Core.dll  ]]; then
    echo "Error installing Mod Platform from $OXIDE_DOWNLOAD!"
    exit
  fi

  if [[ ! -L $ROOT_DIR/bin/oxide ]]; then
    mkdir -p $ROOT_DIR/oxide
    ln -s $ROOT_DIR/oxide $ROOT_DIR/bin/oxide
  fi
fi

#
# save latest.json
if [[ $UPDATE == "1" ]]; then
  curl -sL https://umod.org/games/rust/latest.json -o $ROOT_DIR/bin/latest.json
fi

cd $ROOT_DIR/bin

#
# replace startup variables
MODIFIED_STARTUP=`eval echo $(echo ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g')`

#
# run the server
# eval ${MODIFIED_STARTUP}
if [[ -f $ROOT_DIR/src/wrapper.ts ]]; then
  deno run --unstable --allow-env --allow-net --allow-run --allow-read $ROOT_DIR/src/wrapper.ts "${MODIFIED_STARTUP}"
else
  deno run --unstable --allow-env --allow-net --allow-run --allow-read /wrapper.js "${MODIFIED_STARTUP}"
fi
