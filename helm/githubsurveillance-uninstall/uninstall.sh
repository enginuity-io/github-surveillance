#!/bin/bash

# GitHub Surveillance Uninstallation Script
# This script helps you uninstall the GitHub Surveillance application

# Set default values
RELEASE_NAME="githubsurveillance"
NAMESPACE="default"
USE_HELM=true

# Display help information
show_help() {
    echo "GitHub Surveillance Uninstallation Script"
    echo ""
    echo "Usage: ./uninstall.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -r, --release NAME      Specify the release name (default: githubsurveillance)"
    echo "  -n, --namespace NAME    Specify the namespace (default: default)"
    echo "  -k, --kubectl-only      Use kubectl commands only, skip Helm uninstall"
    echo "  -h, --help              Display this help message"
    echo ""
    echo "Example:"
    echo "  ./uninstall.sh --release my-gs-app --namespace monitoring"
}

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -r|--release)
            RELEASE_NAME="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -k|--kubectl-only)
            USE_HELM=false
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

echo "Starting uninstallation of GitHub Surveillance application..."
echo "Release name: $RELEASE_NAME"
echo "Namespace: $NAMESPACE"

# Function to perform cleanup using kubectl
kubectl_cleanup() {
    echo "Removing resources using kubectl..."
    
    echo "Removing deployments..."
    kubectl delete deployment -l app=githubsurveillance -n "$NAMESPACE" --ignore-not-found=true
    
    echo "Removing services..."
    kubectl delete service -l app=githubsurveillance -n "$NAMESPACE" --ignore-not-found=true
    
    echo "Removing ingress..."
    kubectl delete ingress -l app=githubsurveillance -n "$NAMESPACE" --ignore-not-found=true
    
    echo "Removing secrets..."
    kubectl delete secret -l app=githubsurveillance -n "$NAMESPACE" --ignore-not-found=true
    
    echo "Removing configmaps..."
    kubectl delete configmap -l app=githubsurveillance -n "$NAMESPACE" --ignore-not-found=true
    
    echo "Removing persistent volume claims..."
    kubectl delete pvc -l app=githubsurveillance -n "$NAMESPACE" --ignore-not-found=true
}

# Uninstall using Helm if requested
if $USE_HELM; then
    echo "Uninstalling release using Helm..."
    helm uninstall "$RELEASE_NAME" -n "$NAMESPACE"
    
    # Check if the uninstall was successful
    if [ $? -ne 0 ]; then
        echo "Helm uninstall failed or release not found."
        read -p "Would you like to perform manual cleanup using kubectl? (y/n): " response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            kubectl_cleanup
        fi
    else
        echo "Helm uninstall completed successfully."
    fi
else
    # Skip Helm and use kubectl directly
    kubectl_cleanup
fi

# Check for remaining resources
echo "Checking for any remaining resources..."
REMAINING=$(kubectl get all -l app=githubsurveillance -n "$NAMESPACE" 2>/dev/null)
if [ -n "$REMAINING" ]; then
    echo "Some resources still remain:"
    echo "$REMAINING"
    echo "You may need to remove them manually."
else
    echo "All Kubernetes resources have been removed successfully."
fi

# Clean up local development if present
echo "Do you want to clean up the local development environment? (y/n): "
read -p "" clean_local
if [[ "$clean_local" =~ ^[Yy]$ ]]; then
    echo "Cleaning up local development environment..."
    
    # Check if docker-compose.yml exists
    if [ -f "../docker-compose.yml" ]; then
        docker-compose -f ../docker-compose.yml down --volumes --remove-orphans
        echo "Local development environment has been cleaned up."
    else
        echo "docker-compose.yml not found. Skipping local environment cleanup."
    fi
fi

echo "Uninstallation process completed."
