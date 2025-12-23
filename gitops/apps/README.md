# TiQology GitOps Apps Directory

This directory contains ArgoCD Application manifests for the TiQology platform.

## Structure

```
apps/
├── frontend-app.yaml          # Next.js frontend application
├── ai-agents-app.yaml         # AI agent swarm services
├── quantum-engine-app.yaml    # Quantum computing integration
└── holographic-app.yaml       # Holographic/WebXR services
```

## Application Definitions

### Frontend App
- **Name**: tiqology-frontend
- **Source**: Main repository
- **Sync**: Automated with self-healing
- **Namespace**: tiqology-prod

### AI Agents App
- **Name**: tiqology-ai-agents
- **Purpose**: Autonomous AI agent orchestration
- **Sync**: Automated

### Quantum Engine App
- **Name**: tiqology-quantum
- **Purpose**: Quantum computation services
- **Sync**: Manual (requires approval)

### Holographic App
- **Name**: tiqology-holographic
- **Purpose**: WebXR and holographic rendering
- **Sync**: Automated

## Deployment Flow

```
Git Commit → ArgoCD Detects Change → Sync Application 
  → Deploy to Cluster → Health Check → Ready
```

## Adding New Applications

1. Create application manifest:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: tiqology
  source:
    repoURL: https://github.com/vercel/ai-chatbot.git
    targetRevision: HEAD
    path: gitops/apps/my-app
  destination:
    server: https://kubernetes.default.svc
    namespace: tiqology-prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

2. Apply to cluster:
```bash
kubectl apply -f gitops/apps/my-app.yaml
```

3. ArgoCD will automatically sync

## Sync Policies

- **Automated**: Changes are automatically applied
- **Self-Heal**: ArgoCD will fix drift from desired state
- **Prune**: Removes resources not in Git
- **Manual**: Requires explicit sync approval

## Best Practices

1. Always use `targetRevision: HEAD` or specific tags
2. Enable `selfHeal` for production stability
3. Set appropriate `revisionHistoryLimit`
4. Use `ignoreDifferences` for dynamic resources
5. Configure retry policies for resilience
