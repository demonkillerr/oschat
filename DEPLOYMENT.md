# OSChat - Deployment Guide

## 🚀 Production Deployment Guide

This guide covers deploying OSChat to production using various methods.

## Prerequisites

- Domain name (e.g., oschat.example.com)
- SSL certificates (Let's Encrypt recommended)
- Kubernetes cluster or Docker host
- MongoDB instance or managed service
- Google OAuth credentials configured for production

---

## Option 1: Kubernetes Deployment (Recommended)

### Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Helm (optional)
- Container registry (Docker Hub, GCR, ECR, etc.)

### Step 1: Build and Push Docker Images

```bash
# Build images
docker build -t your-registry.com/oschat-server:v1.0 -f infra/docker/server.Dockerfile .
docker build -t your-registry.com/oschat-web:v1.0 -f infra/docker/web.Dockerfile .

# Push to registry
docker push your-registry.com/oschat-server:v1.0
docker push your-registry.com/oschat-web:v1.0
```

### Step 2: Configure Kubernetes Secrets

Create a file `infra/k8s/secrets.yml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: oschat-secrets
  namespace: oschat
type: Opaque
stringData:
  MONGODB_URI: "mongodb://admin:SECURE_PASSWORD@mongodb:27017/oschat?authSource=admin"
  MONGODB_PASSWORD: "SECURE_MONGODB_PASSWORD"
  JWT_SECRET: "GENERATE_STRONG_RANDOM_STRING"
  SESSION_SECRET: "GENERATE_ANOTHER_STRONG_RANDOM_STRING"
  GOOGLE_CLIENT_ID: "your-production-google-client-id"
  GOOGLE_CLIENT_SECRET: "your-production-google-client-secret"
  GOOGLE_CALLBACK_URL: "https://api.oschat.example.com/api/auth/google/callback"
```

**⚠️ Important**: Never commit this file to version control!

### Step 3: Update ConfigMap

Edit `infra/k8s/configmap.yml`:

```yaml
data:
  MONGODB_DB: "oschat"
  WEB_ORIGIN: "https://oschat.example.com"
  NODE_ENV: "production"
```

### Step 4: Update Ingress

Edit `infra/k8s/ingress.yml`:

```yaml
spec:
  tls:
  - hosts:
    - oschat.example.com
    - api.oschat.example.com
    secretName: oschat-tls
  rules:
  - host: oschat.example.com
    # ... rest of config
```

### Step 5: Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f infra/k8s/namespace.yml

# Apply secrets (create secrets.yml first!)
kubectl apply -f infra/k8s/secrets.yml

# Apply configurations
kubectl apply -f infra/k8s/configmap.yml

# Deploy MongoDB
kubectl apply -f infra/k8s/mongodb-deployment.yml

# Wait for MongoDB to be ready
kubectl wait --for=condition=Ready pod -l app=mongodb -n oschat --timeout=300s

# Deploy application
kubectl apply -f infra/k8s/server-deployment.yml
kubectl apply -f infra/k8s/web-deployment.yml

# Setup ingress
kubectl apply -f infra/k8s/ingress.yml

# Check status
kubectl get pods -n oschat
kubectl get svc -n oschat
kubectl get ingress -n oschat
```

### Step 6: Configure DNS

Point your domain to the ingress load balancer:

```bash
# Get ingress IP
kubectl get ingress -n oschat oschat-ingress

# Create A records:
# oschat.example.com -> <INGRESS_IP>
# api.oschat.example.com -> <INGRESS_IP>
```

### Step 7: Setup SSL with cert-manager

```bash
# Install cert-manager (if not installed)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Cert-manager will automatically provision SSL certificates
```

---

## Option 2: Docker Compose Deployment

For smaller deployments or single-server setups:

### Step 1: Prepare Server

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 2: Configure Environment

Create production `.env` file:

```env
# MongoDB
MONGO_INITDB_ROOT_PASSWORD=SECURE_PASSWORD

# Application
JWT_SECRET=GENERATE_STRONG_SECRET
SESSION_SECRET=GENERATE_STRONG_SECRET
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_CALLBACK_URL=https://api.oschat.example.com/api/auth/google/callback
```

### Step 3: Create Production docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    restart: always
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD}
    networks:
      - oschat-network

  server:
    image: your-registry.com/oschat-server:latest
    restart: always
    depends_on:
      - mongodb
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:${MONGO_INITDB_ROOT_PASSWORD}@mongodb:27017/oschat?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      SESSION_SECRET: ${SESSION_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GOOGLE_CALLBACK_URL: ${GOOGLE_CALLBACK_URL}
      WEB_ORIGIN: https://oschat.example.com
    networks:
      - oschat-network

  web:
    image: your-registry.com/oschat-web:latest
    restart: always
    depends_on:
      - server
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://api.oschat.example.com
      NEXT_PUBLIC_SOCKET_URL: https://api.oschat.example.com
    networks:
      - oschat-network

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - server
      - web
    networks:
      - oschat-network

networks:
  oschat-network:
    driver: bridge

volumes:
  mongodb_data:
```

### Step 4: Configure NGINX

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server server:4000;
    }

    upstream web {
        server web:3000;
    }

    server {
        listen 80;
        server_name oschat.example.com api.oschat.example.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name oschat.example.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://web;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    server {
        listen 443 ssl http2;
        server_name api.oschat.example.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

### Step 5: Deploy

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

---

## Option 3: Using Ansible

### Step 1: Configure Inventory

Edit `infra/ansible/inventory.ini`:

```ini
[k8s_masters]
k8s-master ansible_host=your-master-ip ansible_user=ubuntu

[k8s_workers]
k8s-worker-1 ansible_host=worker1-ip ansible_user=ubuntu
k8s-worker-2 ansible_host=worker2-ip ansible_user=ubuntu
```

### Step 2: Setup Kubernetes Cluster

```bash
cd infra/ansible
ansible-playbook -i inventory.ini k8s-setup.yml
```

### Step 3: Deploy Application

```bash
ansible-playbook -i inventory.ini deploy-app.yml
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n oschat

# Check services
kubectl get svc -n oschat

# Test health endpoint
curl https://api.oschat.example.com/health
```

### 2. Setup Monitoring

Consider adding:
- Prometheus for metrics
- Grafana for dashboards
- ELK stack for logs
- Sentry for error tracking

### 3. Backup Strategy

```bash
# MongoDB backup script
kubectl exec -n oschat mongodb-0 -- mongodump --out=/backup --authenticationDatabase admin -u admin -p <password>

# Schedule regular backups with CronJob
```

### 4. Scaling

```bash
# Manual scaling
kubectl scale deployment oschat-server --replicas=5 -n oschat

# HPA is already configured in deployment files
kubectl get hpa -n oschat
```

---

## Troubleshooting

### Check Logs

```bash
# Server logs
kubectl logs -n oschat -l app=oschat-server --tail=100 -f

# Web logs
kubectl logs -n oschat -l app=oschat-web --tail=100 -f

# MongoDB logs
kubectl logs -n oschat mongodb-0 -f
```

### Database Connection Issues

```bash
# Test MongoDB connection
kubectl exec -it -n oschat mongodb-0 -- mongosh -u admin -p <password> --authenticationDatabase admin
```

### SSL Certificate Issues

```bash
# Check cert-manager
kubectl get certificate -n oschat
kubectl describe certificate oschat-tls -n oschat

# Force renewal
kubectl delete certificate oschat-tls -n oschat
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT and session secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Setup rate limiting
- [ ] Enable monitoring and alerts
- [ ] Regular security updates
- [ ] Backup strategy in place
- [ ] DDoS protection (CloudFlare, AWS Shield)
- [ ] Database access restricted
- [ ] Use managed MongoDB (Atlas) for production

---

## Performance Tuning

1. **MongoDB**: 
   - Enable replication
   - Add indexes
   - Use connection pooling

2. **Node.js**:
   - Use cluster mode
   - Enable compression
   - Implement caching (Redis)

3. **Next.js**:
   - Enable ISR where applicable
   - Optimize images
   - Use CDN for static assets

---

## Support

For issues or questions about deployment:
- Open an issue on GitHub
- Contact: your-email@example.com

---

**Good luck with your deployment! 🚀**
