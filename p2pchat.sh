#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}P2P Chat Deployment Script${NC}"
echo "=========================="
echo ""

# Load environment variables at startup
if [ -f .env ]; then
	# Use set -a to automatically export all variables
	set -a
	source .env
	set +a
fi

# Function to update .env file
update_env() {
	key=$1
	value=$2
	if grep -q "^$key=" .env; then
		# If key exists, replace it
		sed -i "s|^$key=.*|$key=$value|" .env
	else
		# If key doesn't exist, add it
		echo "$key=$value" >>.env
	fi
}

# Server configuration function - only asks for missing values
configure_server() {
	echo ""
	echo -e "${BLUE}Server Configuration${NC}"
	echo "===================="

	# DHT configuration
	# Optional external IP (for TURN server)
	if [ -z "$EXTERNAL_IP" ]; then
		read -p "Enter server's external IP address (leave blank to auto-detect): " external_ip
		if [ ! -z "$external_ip" ]; then
			update_env "EXTERNAL_IP" "$external_ip"
			export EXTERNAL_IP="$external_ip"
		fi
	fi

	# Add server's DHT service to the list of available DHT services
	dht_url="http://${DHT_DOMAIN}:${EXTERNAL_PORT}"
	if [[ ! $DEFAULT_DHT_SERVICES == *"$dht_url"* ]]; then
		if [[ -z $DEFAULT_DHT_SERVICES ]]; then
			update_env "DEFAULT_DHT_SERVICES" "$dht_url"
			export DEFAULT_DHT_SERVICES="$dht_url"
		else
			update_env "DEFAULT_DHT_SERVICES" "${DEFAULT_DHT_SERVICES},${dht_url}"
			export DEFAULT_DHT_SERVICES="${DEFAULT_DHT_SERVICES},${dht_url}"
		fi
	fi
}

# Function to generate turnserver.conf with values from .env
configure_turn_server() {
	# Create directory if it doesn't exist
	mkdir -p stunturn

	cat >stunturn/turnserver.conf <<EOF
listening-port=3478
realm=${TURN_REALM}
server-name=${TURN_SERVER_NAME}
no-multicast-peers
fingerprint
log-file=/var/log/turnserver/turnserver.log
simple-log
lt-cred-mech
user=${TURN_INTERNAL_USERNAME}:${TURN_INTERNAL_CREDENTIAL}
max-bps=0
userdb=/var/lib/turn/turndb
min-port=${MIN_TURN_PORT}
max-port=${MAX_TURN_PORT}
no-stdout-log
log-level=1
Verbose
EOF
	##### IMPORTANT, MAKE SSL OPTIONAL
	# Add external IP if provided
	if [ ! -z "$EXTERNAL_IP" ]; then
		echo "external-ip=$EXTERNAL_IP" >>stunturn/turnserver.conf
		echo "relay-ip=$EXTERNAL_IP" >>stunturn/turnserver.conf
	fi

	echo -e "${YELLOW}TURN server configuration created at stunturn/turnserver.conf${NC}"
}

echo "What would you like to deploy?"
echo "1) Chat client only (use others' services)"
echo "2) Server only (host services for others)"
echo "3) Both client and server (use own & others' services)"
echo ""

read -p "Please enter your choice (1-3): " choice

# Configure based on user choice
case $choice in
1)
	echo "Deploying chat client only..."
	cp compose/client.yml docker-compose.yml
	;;
2)
	echo "Deploying server only (DHT and STUN/TURN)..."
	configure_server
	configure_turn_server
	cp compose/server.yml docker-compose.yml
	;;
3)
	echo "Deploying both chat client and server components..."
	configure_server
	configure_turn_server
	cp compose/client_server.yml docker-compose.yml
	;;
*)
	echo "Invalid choice. Exiting..."
	exit 1
	;;
esac

echo ""
echo -e "${GREEN}Configuration complete. Starting containers...${NC}"
export COMPOSE_HTTP_TIMEOUT=180
docker-compose up -d --build

echo ""
echo -e "${GREEN}Deployment completed.${NC}"
echo "To check container status, run: docker-compose ps"
echo "To view logs, run: docker-compose logs -f"
echo "To stop the service, run: docker-compose down"

if [[ $choice == "2" || $choice == "3" ]]; then
	echo ""
	echo -e "${BLUE}Server Information:${NC}"
	echo "DHT Service: http://${DHT_DOMAIN}:${EXTERNAL_PORT}"
	echo "STUN/TURN: ${STUN_DOMAIN}:${EXTERNAL_PORT}"

	echo ""
	echo "To add TURN users, use: ./stunturn/add-turn-server.sh <username> <password>"
fi
