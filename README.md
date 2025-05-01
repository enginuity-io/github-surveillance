# GitHub Organization Surveillance

A Kubernetes-based application to monitor GitHub organizations, displaying repositories and audit logs.

## Prerequisites

1. AWS Account and CLI configured
2. GitHub Account and Personal Access Token
3. kubectl installed
4. Helm v3 installed
5. eksctl installed

## Infrastructure Setup

### 1. Create EKS Cluster

```bash
# Replace placeholders with your values
EKS_CLUSTER_NAME="<your-cluster-name>"
REGION="<your-aws-region>"
NODE_TYPE="t3.medium"  # Adjust based on your needs

# Create EKS cluster
eksctl create cluster \
  --name $EKS_CLUSTER_NAME \
  --region $REGION \
  --node-type $NODE_TYPE \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 5 \
  --with-oidc \
  --ssh-access \
  --managed
```

### 2. Configure kubectl

```bash
aws eks update-kubeconfig --name $EKS_CLUSTER_NAME --region $REGION
```

### 3. Install Required Tools

```bash
# Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx

# Install cert-manager for SSL
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```

## Application Deployment

### 1. Configure GitHub Secrets

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add these secrets:
   ```
   KUBE_CONFIG: <base64-encoded-kubeconfig>
   GITHUB_TOKEN: <your-github-token>
   AWS_ACCESS_KEY_ID: <your-aws-access-key>
   AWS_SECRET_ACCESS_KEY: <your-aws-secret-key>
   ```

### 2. Configure DNS

1. Get the LoadBalancer address:
```bash
kubectl get svc ingress-nginx-controller -n ingress-nginx
```

2. Create Route53 records:
- For production:
  - api.githubsurveillance.com → LoadBalancer address
  - githubsurveillance.com → LoadBalancer address
- For staging:
  - api.staging.githubsurveillance.com → LoadBalancer address
  - staging.githubsurveillance.com → LoadBalancer address

### 3. Create Namespaces

```bash
# Create staging namespace
kubectl create namespace github-surveillance-staging

# Create production namespace
kubectl create namespace github-surveillance-prod
```

### 4. Configure Container Registry

```bash
# Create secret for GitHub Container Registry
kubectl create secret docker-registry github-registry-secret \
  --docker-server=ghcr.io \
  --docker-username=<your-github-username> \
  --docker-password=<your-github-token> \
  --namespace github-surveillance-staging

kubectl create secret docker-registry github-registry-secret \
  --docker-server=ghcr.io \
  --docker-username=<your-github-username> \
  --docker-password=<your-github-token> \
  --namespace github-surveillance-prod
```

### 5. Deploy SSL Certificates

```bash
# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: <your-email>
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### 6. Manual Deployment (if needed)

```bash
# Deploy to staging
helm upgrade --install github-surveillance ./helm/githubsurveillance \
  --namespace github-surveillance-staging \
  -f helm/githubsurveillance/values.staging.yaml \
  --set backend.env.GITHUB_TOKEN=<your-github-token> \
  --set backend.env.GITHUB_ORG=<your-org-name>

# Deploy to production
helm upgrade --install github-surveillance ./helm/githubsurveillance \
  --namespace github-surveillance-prod \
  -f helm/githubsurveillance/values.production.yaml \
  --set backend.env.GITHUB_TOKEN=<your-github-token> \
  --set backend.env.GITHUB_ORG=<your-org-name>
```

## Continuous Deployment

### 1. Staging Deployment
Staging deployments happen automatically when:
- Push to main branch
- Manual trigger with environment=staging

### 2. Production Deployment
Production deployments happen when:
- Creating a new release tag (v*.*.*)  
- Manual trigger with environment=production

## Monitoring

### Install Prometheus and Grafana

```bash
# Add Helm repos
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

## Troubleshooting

### Check Deployments
```bash
# Check pods status
kubectl get pods -n github-surveillance-staging
kubectl get pods -n github-surveillance-prod

# Check logs
kubectl logs -l app=github-surveillance-backend -n github-surveillance-staging
kubectl logs -l app=github-surveillance-frontend -n github-surveillance-staging
```

### Common Issues

1. Image Pull Errors
   - Verify github-registry-secret exists in the namespace
   - Check GitHub token permissions

2. Ingress Issues
   - Verify NGINX Ingress Controller is running
   - Check DNS records point to the correct LoadBalancer

3. Certificate Issues
   - Verify cert-manager pods are running
   - Check certificate status: `kubectl get certificates -A`

## Cleanup

```bash
# Delete the application
helm uninstall github-surveillance -n github-surveillance-prod
helm uninstall github-surveillance -n github-surveillance-staging

# Delete the cluster
eksctl delete cluster --name $EKS_CLUSTER_NAME --region $REGION
```

## Features

- View all repositories in a GitHub organization
- Monitor organization audit logs
- Modern Material UI interface
- Real-time updates when searching for organizations

## Technologies Used

- Frontend:
  - React with TypeScript
  - Material UI
  - Axios for API calls

- Backend:
  - Node.js with TypeScript
  - Express
  - Octokit (GitHub API client)
