# GitHub Surveillance Uninstall Chart

This Helm chart helps you cleanly uninstall the GitHub Surveillance application and all its components from your Kubernetes cluster.

## Prerequisites

- Kubernetes cluster
- Helm v3 installed

## Uninstallation Steps

### Option 1: Standard Helm Uninstall (Recommended)

The simplest way to uninstall the GitHub Surveillance application is to use the standard Helm uninstall command:

```bash
# Replace 'my-release' with your actual release name
helm uninstall my-release
```

This will remove all the Kubernetes resources created by the GitHub Surveillance chart.

### Option 2: Using this Uninstall Chart

This chart provides an alternative approach if you need more control over the uninstallation process:

1. Make sure you know the release name of your GitHub Surveillance installation
2. Run the uninstall chart:

```bash
# Replace 'my-release' with your actual release name
helm install uninstall-github-surveillance ./helm/githubsurveillance-uninstall --set releaseName=my-release
```

3. Verify that all resources have been removed:

```bash
kubectl get all -l app=githubsurveillance
```

## Resources Removed

The uninstallation will remove the following resources:

- Deployments (Frontend and Backend)
- Services (Frontend and Backend)
- Ingress
- Secrets
- ConfigMaps (if any)
- PersistentVolumeClaims (if any)

## Manual Cleanup (if needed)

If some resources persist after the uninstallation, you can manually remove them:

```bash
kubectl delete deployment -l app=githubsurveillance
kubectl delete service -l app=githubsurveillance
kubectl delete ingress -l app=githubsurveillance
kubectl delete secret -l app=githubsurveillance
```

## Cleaning Up Local Development Environment

If you also have a local development setup, you can remove it with:

```bash
# Navigate to the project directory
cd /path/to/githubsurveillance

# Stop and remove Docker containers
docker-compose down --volumes --remove-orphans
```
