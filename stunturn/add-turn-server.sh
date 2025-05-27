#!/bin/bash

if [ $# -ne 2 ]; then
  echo "Usage: $0 <username> <password>"
  exit 1
fi

USERNAME=$1
PASSWORD=$2

# Create directory if it doesn't exist
mkdir -p /var/lib/turn

# Add user to turnserver
docker exec -it p2pchat_stunturn_1 turnadmin -a -u "$USERNAME" -p "$PASSWORD" -r nasiadka.pl

echo "TURN user added successfully"