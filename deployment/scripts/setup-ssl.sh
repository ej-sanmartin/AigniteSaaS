#!/bin/bash

# Exit on error
set -e

# Check if domain is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <domain>"
    exit 1
fi

DOMAIN=$1

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Stop Nginx if running
sudo systemctl stop nginx

# Obtain SSL certificate
echo "Obtaining SSL certificate for $DOMAIN..."
sudo certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Create directory for SSL certificates if it doesn't exist
sudo mkdir -p /etc/letsencrypt/live/$DOMAIN

# Set proper permissions
sudo chown -R root:root /etc/letsencrypt/live/$DOMAIN
sudo chmod -R 755 /etc/letsencrypt/live/$DOMAIN

echo "SSL certificate setup complete for $DOMAIN" 