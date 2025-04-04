#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Check required environment variables
required_vars=("DATABASE_URL" "JWT_SECRET" "DB_USER" "DB_PASSWORD" "DB_NAME")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set"
        exit 1
    fi
done

# Build and start services
echo "Building and starting services..."
docker-compose -f deployment/docker/docker-compose.yml up -d --build

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
if ! docker-compose -f deployment/docker/docker-compose.yml ps | grep -q "Up"; then
    echo "Error: Some services failed to start"
    docker-compose -f deployment/docker/docker-compose.yml logs
    exit 1
fi

echo "Deployment completed successfully" 