#!/bin/bash

if [ $# -ne 2 ]; then
	echo "Usage: $0 <username> <password>"
	exit 1
fi

USERNAME=$1
PASSWORD=$2
REALM=${TURN_REALM}

# Get the actual container name
CONTAINER_NAME=$(docker-compose ps -q stunturn)
if [ -z "$CONTAINER_NAME" ]; then
	echo "Error: TURN server container not found"
	exit 1
fi

# Add user to turnserver
docker exec -it $CONTAINER_NAME turnadmin -a -u "$USERNAME" -p "$PASSWORD" -r $REALM

echo "TURN user added successfully"
