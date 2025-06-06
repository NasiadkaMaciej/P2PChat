#!/bin/bash
# This script builds Docker images and deploys them to a Kubernetes cluster.

# Generate Kubernetes configuration files from Docker Compose
# kompose convert -f docker-compose.yml -o k8s/

# Point to Minikube's Docker daemon
eval $(minikube docker-env)

# Clean up previous builds
kubectl delete all --all

# Build Docker images inside Minikube's environment
docker build -t backend:latest ./backend   #--no-cache
docker build -t frontend:latest ./frontend #--no-cache
docker build -t dht:latest ./dht           #--no-cache
docker build -t database:latest ./database #--no-cache
docker build -t stunturn:latest ./stunturn #--no-cache
docker build -t nginx:custom ./nginx       #--no-cache
docker build -t tracker:latest ./tracker   #--no-cache

# Apply ConfigMaps first
kubectl apply -f k8s/env-configmap.yaml

# Apply PVCs
kubectl apply -f k8s/mongo-data-persistentvolumeclaim.yaml

# Apply Services
kubectl apply -f k8s/database-service.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/tracker-service.yaml
kubectl apply -f k8s/dht-service.yaml
kubectl apply -f k8s/stunturn-service.yaml

# Apply Deployments
kubectl apply -f k8s/database-deployment.yaml
kubectl apply -f k8s/dht-deployment.yaml
kubectl apply -f k8s/stunturn-deployment.yaml
kubectl apply -f k8s/tracker-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/nginx-deployment.yaml

# Apply Ingress
kubectl apply -f k8s/ingress.yaml

# Wait for pods to be ready
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod --all --timeout=120s

# Forward services in the background
echo "Starting port forwarding..."
kubectl port-forward service/frontend 3010:3010 &
FRONTEND_PID=$!
kubectl port-forward service/backend 5000:5000 &
BACKEND_PID=$!

echo "Port forwarding active:"
echo "- Frontend available at http://localhost:3010"
echo "- Backend available at http://localhost:5000"
echo "Press Ctrl+C to stop port forwarding"

# Trap to kill background processes when script is terminated
trap "kill $FRONTEND_PID $BACKEND_PID; exit" INT TERM EXIT

# Keep script running
wait
