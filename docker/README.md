# Production Docker Deployment

This directory contains Docker configuration files for deploying the KPT Website backend in production.

## Services

- **app**: Node.js application container
- **mongodb**: MongoDB database
- **redis**: Redis cache and session store
- **elasticsearch**: Search engine
- **nginx**: Reverse proxy and load balancer

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available
- At least 10GB free disk space

## Quick Start

1. **Environment Setup**
   ```bash
   # Copy and configure environment variables
   cp ../.env.example ../.env
   # Edit .env with your production values
   ```

2. **Create Uploads Directory**
   ```bash
   mkdir -p ../uploads
   ```

3. **Deploy**
   ```bash
   # Build and start all services
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Check service health
   docker-compose ps
   ```

## Configuration

### Environment Variables

Key production environment variables to configure in `.env`:

```bash
# App
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://mongodb:27017/kpt_website

# Redis
REDIS_URL=redis://redis:6379

# Elasticsearch
ELASTICSEARCH_URL=http://elasticsearch:9200

# Add your other secrets (JWT, Cloudinary, etc.)
```

### Ports

- **80**: HTTP (nginx)
- **443**: HTTPS (nginx) - configure SSL certificates
- **5000**: App internal port
- **27017**: MongoDB (internal)
- **6379**: Redis (internal)
- **9200**: Elasticsearch (internal)

## Management Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f [service_name]

# Scale services
docker-compose up -d --scale app=3

# Backup database
docker exec kpt-mongodb mongodump --db kpt_website --out /backup
```

## Health Checks

- App: `GET /health` (via nginx)
- MongoDB: Built-in health check
- Redis: Built-in health check
- Elasticsearch: Built-in health check

## Security Considerations

1. **Change default passwords** in production
2. **Enable SSL/TLS** with Let's Encrypt or your certificate provider
3. **Configure firewall** rules
4. **Use secrets management** for sensitive data
5. **Regular updates** of base images
6. **Monitor logs** and set up alerts

## SSL Configuration

To enable HTTPS, update `nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ... rest of config
}
```

And mount certificates in docker-compose.yml:

```yaml
nginx:
  volumes:
    - ./ssl:/etc/nginx/ssl:ro
```

## Monitoring

Consider adding monitoring services:

- **Prometheus** + **Grafana** for metrics
- **ELK Stack** for centralized logging
- **cAdvisor** for container metrics

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 80, 443 are available
2. **Memory issues**: Increase Docker memory limit
3. **Disk space**: Clean up Docker images and volumes
4. **Network issues**: Check firewall and DNS settings

### Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app

# Follow logs
docker-compose logs -f app
```

### Debugging

```bash
# Enter container
docker exec -it kpt-website-backend sh

# Check app status
curl http://localhost:5000/health

# Database connection
docker exec -it kpt-mongodb mongosh
```

## Backup Strategy

1. **Database**: Use MongoDB backup tools
2. **Redis**: RDB snapshots
3. **Elasticsearch**: Snapshots to S3
4. **Uploads**: Sync to cloud storage
5. **Configuration**: Version control

## Scaling

For high traffic:

1. **Horizontal scaling**: Increase app replicas
2. **Database clustering**: MongoDB replica set
3. **Redis clustering**: Redis Cluster
4. **Load balancing**: Multiple nginx instances
5. **CDN**: For static assets