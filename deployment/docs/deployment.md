# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured
- SSL certificates (for production)
- Environment variables set up

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DB_USER=user
DB_PASSWORD=password
DB_NAME=dbname

# JWT
JWT_SECRET=your-secret-key

# Frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api

# Backend
FRONTEND_URL=http://localhost:3000
```

## Development Setup

1. Start services:
```bash
docker-compose -f deployment/docker/docker-compose.yml up
```

2. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## Production Setup

1. Set up SSL certificates:
```bash
./deployment/scripts/setup-ssl.sh yourdomain.com
```

2. Update environment variables for production:
```env
NEXT_PUBLIC_BACKEND_URL=https://yourdomain.com/api
FRONTEND_URL=https://yourdomain.com
```

3. Deploy the application:
```bash
./deployment/scripts/deploy.sh
```

## Security Considerations

- All traffic is encrypted with SSL/TLS
- CSRF protection enabled
- Rate limiting implemented
- Security headers enforced
- Database credentials managed securely
- JWT secrets stored securely

## Monitoring and Maintenance

- Check service logs:
```bash
docker-compose -f deployment/docker/docker-compose.yml logs
```

- Restart services:
```bash
docker-compose -f deployment/docker/docker-compose.yml restart
```

- Update services:
```bash
docker-compose -f deployment/docker/docker-compose.yml pull
docker-compose -f deployment/docker/docker-compose.yml up -d
```

## Troubleshooting

1. Check service status:
```bash
docker-compose -f deployment/docker/docker-compose.yml ps
```

2. View logs:
```bash
docker-compose -f deployment/docker/docker-compose.yml logs [service]
```

3. Common issues:
- SSL certificate issues: Check certbot logs
- Database connection issues: Verify credentials
- Service startup issues: Check environment variables 