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
# Install AWS Load Balancer Controller
export CLUSTER_NAME="your-cluster-name"
export AWS_REGION="your-aws-region"

# Create IAM OIDC provider
eksctl utils associate-iam-oidc-provider \
    --region ${AWS_REGION} \
    --cluster ${CLUSTER_NAME} \
    --approve

# Create IAM policy
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.5.4/docs/install/iam_policy.json

aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json

# Create service account
eksctl create iamserviceaccount \
  --cluster=${CLUSTER_NAME} \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=${CLUSTER_NAME} \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# Install cert-manager for SSL (optional)
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

2. ALB Ingress Issues
   - Check ALB controller logs: `kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller`
   - Verify IAM roles and policies are correctly configured
   - Check if target groups are created in AWS console
   - Ensure security groups allow traffic to target groups

3. Certificate Issues
   - Verify cert-manager pods are running (if using SSL)
   - Check certificate status: `kubectl get certificates -A`

4. Application Access Issues
   - Wait for ALB provisioning to complete (can take 3-5 minutes)
   - Check if target groups are healthy in AWS console
   - Verify the security group rules allow traffic on ports 3001 and 3002

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
