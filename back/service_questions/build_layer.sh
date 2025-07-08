#!/bin/bash
set -e

sudo docker build -t lambda-layer-builder .

container_id=$(sudo docker create lambda-layer-builder)

sudo docker cp "$container_id":/layer_common_lib.zip ./layer_common_lib.zip

sudo docker rm "$container_id"

echo "El archivo layer_common_lib.zip se ha creado exitosamente."
