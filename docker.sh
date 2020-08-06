#!/bin/bash

DOCKER_USER=user
DOCKER_KEY=pass
DOCKER_APP=nurdism/rust

if [ -f .env ]; then
  source <(grep -v '^#' .env | sed -E 's|^(.+)=(.*)$|: ${\1=\2}; export \1|g')
fi

docker_login() {
  set -eux; \
    echo $DOCKER_KEY | sudo docker login --username $DOCKER_USER --password-stdin ;
}

# sudo docker rm rust
# sudo docker run -it --name rust nurdism/rust:latest
# sudo docker start rust -i
# sudo docker stop rust && sudo docker rm rust && sudo docker run --name rust nurdism/rust:latest
docker_build() {
  set -eux; \
    deno bundle --unstable ./src/wrapper.ts wrapper.js ; \
    sudo docker build -f Dockerfile -t $DOCKER_APP:$1 \
      --build-arg BUILD_DATE=$(date +%s) \
      . ; \
    sudo docker images $DOCKER_APP ;
}

docker_push() {
  set -eux; \
    docker push $DOCKER_APP:$1 ;
}

case $1 in
  login) docker_login ;;
  build) docker_build ${2:-latest} ;;
  push) docker_push ${2:-latest} ;;
  *) echo "Unknown Option '$1'" ;;
esac
