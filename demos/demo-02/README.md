# Demo 2 - Burst scenario

## Setup

> **Requirements**
>
> An AKS cluster with virtual kubelet installed as per: https://docs.microsoft.com/en-us/azure/aks/virtual-kubelet
>
> Client binaries:
> - az cli
> - kubectl
> - helm

This demo is based on the `vk-burst-demo` demo at:
- https://github.com/rbitia/aci-demos

Install the nginx ingress controller.

```bash
helm install stable/nginx-ingress --name ingress --namespace kube-system
```

Wait until the external ip has been created for the nginx ingress.

```bash
kubectl get service ingress-nginx-ingress-controller --namespace kube-system --watch
```

Assign two DNS A records for the external ip address just created, with the following entries for the `DOMAIN_NAME` being used:

- `virtualkubelet-burst-demo.DOMAIN_NAME`
- `virtualkubelet-burst-demo-backend.DOMAIN_NAME`

Create a Kubernetes namespace for the demo.

```bash
kubectl create ns demo02
```

Install the demo via the Helm Chart into the `demo02` namespace. Replace `DOMAIN_NAME` and `VIRTUALKUBELET_NODE_NAME` with the values for your environment.

```bash
helm install charts/facerecognizer-demo --name demo --namespace demo02 \
  --set imageRecognizer.virtualKubelet.nodeName=VIRTUALKUBELET_NODE_NAME \
  --set frontend.ingress.hosts={virtualkubelet-burst-demo.DOMAIN_NAME} \
  --set backend.ingress.hosts={virtualkubelet-burst-demo-backend.DOMAIN_NAME}
```

## Demonstrate normal running

> TODO
> 
> Have diagram in deck

Show the components running in the `demo02` namespace.

```bash
kubectl get ingress,svc,deployment,pod -n demo02
```

Show the UI and reset the database to start processing again. Show that after around a minute, we cap out at processing around 1 image per second.

## Burst into Azure Container Instances with the Virtual Kubelet

Demonstrate that the aci burst deployment has 0 instances:

```bash 
kubectl get deployment demo-face-recognizer-ir-aci -n demo02
```

Scale up the deployment to 10 instances and have a look at the 10 instances spun up

```bash
kubectl scale deploy demo-face-recognizer-ir-aci --replicas 10 -n demo02
kubectl get pods -n demo02
```

You should see these start to provision in Azure Container Instances:

```bash
az container list --query "[].name" | fgrep demo-face-recognizer-ir-aci
```

Wait until the pods transition to a `Running` state:

```bash
kubectl get pods -n demo02 -w
```

Show the UI again and notice that the processing rate has increased substantially.

Once the image processing is complete, then scale the burst workload back to 0.

```bash
kubectl scale deploy demo-face-recognizer-ir-aci --replicas 10 -n demo02
```

Wait until the pods have been removed:

```bash
kubectl get pods -n demo02 -w
```

You should no longer see any pods running in Azure Container Instances:

```bash
az container list --query "[].name" | fgrep demo-face-recognizer-ir-aci
```

## Clean up

```bash
helm del --purge demo
```