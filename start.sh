#!/bin/bash

if [ "$UI5_PROFILES_ACTIVE" = "ecs" ]
then
export ECS_INSTANCE_IP_ADDRESS=$(curl http://169.254.170.2/v2/metadata | jq '.Containers[0].Networks[0].IPv4Addresses[0]' | tr -d '"')
echo ${ECS_INSTANCE_IP_ADDRESS}
fi

if [ -z "$UI5_PROFILES_ACTIVE" ]
then
ui5 serve --port 3000 --accept-remote-connections
else
ui5 serve --port 3000 --accept-remote-connections --config ui5-$UI5_PROFILES_ACTIVE.yaml
fi
