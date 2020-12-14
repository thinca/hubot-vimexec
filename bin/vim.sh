#!/bin/bash

set -eu

: ${VIMEXEC_GROUP:=default}

cd "$(dirname "$(dirname $0)")"

docker pull thinca/vim:latest

NAME="${VIMEXEC_GROUP}_${RANDOM}"

docker run -it --rm --name "${NAME}" \
	--cpu-period=1000000 --cpu-quota=50000 \
	--memory=32m \
	--network=none \
	--env "VIMEXEC_GROUP=${VIMEXEC_GROUP}" \
	-v ${PWD}/vim-scripts:/tmp/vim-scripts:ro \
	thinca/vim:latest -N -S /tmp/vim-scripts/startup.vim
