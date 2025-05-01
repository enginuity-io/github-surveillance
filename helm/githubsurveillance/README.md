# GitHub Organization Surveillance Helm Chart

This Helm chart deploys the GitHub Organization Surveillance application on a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster 1.19+
- Helm 3.0+
- Ingress controller (nginx)
- Docker images for both frontend and backend pushed to a container registry

## Installation

1. First, build and push the Docker images:
```bash
# Build images
docker build -t your-registry/githubsurveillance-backend:latest ./backend
docker build -t your-registry/githubsurveillance-frontend:latest ./frontend

# Push images
docker push your-registry/githubsurveillance-backend:latest
docker push your-registry/githubsurveillance-frontend:latest
```

2. Update the values.yaml file with your configuration:
```yaml
backend:
  image:
    repository: your-registry/githubsurveillance-backend
  env:
    GITHUB_TOKEN: "your-github-token"
    GITHUB_ORG: "your-org-name"

frontend:
  image:
    repository: your-registry/githubsurveillance-frontend
```

3. Install the Helm chart:
```bash
# Add your hosts to /etc/hosts for local development
echo "127.0.0.1 githubsurveillance.local api.githubsurveillance.local" | sudo tee -a /etc/hosts

# Install the chart
helm install github-surveillance ./helm/githubsurveillance
```

4. Verify the deployment:
```bash
# Check pods
kubectl get pods

# Check services
kubectl get svc

# Check ingress
kubectl get ingress
```

## Configuration

The following table lists the configurable parameters of the GitHub Surveillance chart and their default values:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend.replicaCount` | Number of backend replicas | `1` |
| `backend.image.repository` | Backend image repository | `githubsurveillance-backend` |
| `backend.image.tag` | Backend image tag | `latest` |
| `backend.service.port` | Backend service port | `3001` |
| `backend.ingress.host` | Backend ingress host | `api.githubsurveillance.local` |
| `frontend.replicaCount` | Number of frontend replicas | `1` |
| `frontend.image.repository` | Frontend image repository | `githubsurveillance-frontend` |
| `frontend.image.tag` | Frontend image tag | `latest` |
| `frontend.service.port` | Frontend service port | `3002` |
| `frontend.ingress.host` | Frontend ingress host | `githubsurveillance.local` |

## Accessing the Application

Once deployed, you can access the application at:
- Frontend: http://githubsurveillance.local
- Backend API: http://api.githubsurveillance.local

## Uninstalling the Chart

To uninstall/delete the deployment:
```bash
helm uninstall github-surveillance
```

## Troubleshooting

1. Check pod status:
```bash
kubectl get pods
kubectl describe pod <pod-name>
```

2. Check logs:
```bash
# Backend logs
kubectl logs -l app=github-surveillance-backend

# Frontend logs
kubectl logs -l app=github-surveillance-frontend
```

3. Check ingress:
```bash
kubectl describe ingress
```
