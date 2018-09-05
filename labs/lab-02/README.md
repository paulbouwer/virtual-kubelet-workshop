# Lab 2 - Explore burst scenario with the Virtual Kubelet

> **Requirements**
>
> A local Kubernetes cluster running on your machine. This can be one of the following:
> - Docker for Mac (Kubernetes single-node cluster enabled)
> - Docker for Windows (Kubernetes single-node cluster enabled)
> - Minikube
>
> Client binaries:
> - git
> - kubectl
> - helm

## Overview

This lab will guide you through a workload burst scenario using the Virtual Kubelet in your local Kubernetes cluster. You will use the Virtual Kubelet that is configured with the azure (Azure Container Instances) provider.

The lab demonstrates a workload burst scenario where there is a worker container processing workitems off a queue and updating state in a database. The throughput is capped by the capacity within your cluster, so you will spin up additional adhoc instances of the worker via the Virtual Kubelet. You will see a ramp up in the processing of the workitems due to this additional adhoc processing capacity. Once the processing is done, you will spin down the adhoc instances down.

This is a great example of leveraging the Virtual Kubelet to add a burst capability to your cluster, and only paying for the time you use those additional resources.

## Set up

Ensure that you have the Virtual Kubelet Workshop repo cloned as you will be using it for this lab. If you didn't clone this repo as part of Lab 1, then do the following:

```bash
git clone https://github.com/paulbouwer/virtual-kubelet-workshop.git
cd virtual-kubelet-workshop/labs/lab-02
```

## Helm Chart

You will install the Burst Scenario workloads via the Helm Chart available in the GitHub repo you just cloned. You will find the Helm Chart in the following folder:

- charts/burst-scenario

Have a look in the folder to familiarise yourself with the Chart, its components, and values that must be provided to configure the lab. Ensure that the `nodeSelector` and `tolerations` values match what you have configured for the Virtual Kubelet.

## Install the Burst Scenario workloads

Create a Kubernetes namespace for the demo.

```bash
kubectl create namespace lab02
```

> NOTE
>
> You have two methods of installing the Burst Scenario workloads via the Helm Chart. You can select to deploy using Helm's Tiller component via `helm install`, or you can select to render the Helm Chart to yaml via `helm template` and deploy the yaml via `kubectl`.
> 

### Method 1 - Helm Tiller

If you would like to explore this option and don't have Helm's Tiller installed, then look at the following documentation. It shows how to correctly install and configure Tiller in an RBAC enabled Kubernetes cluster.

- https://docs.microsoft.com/en-us/azure/aks/kubernetes-helm
- https://docs.helm.sh/helm/#helm-init
- https://docs.helm.sh/using_helm/#tiller-namespaces-and-rbac

This command will install the Burst Scenario workloads into the `lab02` namespace we created earlier. You can specify the config values by using the `--set` command line options.

```bash
helm install "charts/burst-scenario" --name "lab02" --namespace "lab02" \
  --set mysql.host= \
  --set mysql.user= \
  --set mysql.password= \
  --set mysql.workItems.table= \
  --set azureStorage.account= \
  --set azureStorage.accessKey= \
  --set azureStorage.workItems.queue=
```

You can also chose to set these config values by updating the `charts/burst-scenario/values.yaml` file. The following simpler command can then be leveraged to install the Burst Scenario workloads into the `lab02` namespace we created earlier.

```bash
helm install "charts/burst-scenario" --name "lab02" --namespace "lab02"
```

### Method 2 - Render yaml

If you don't want to install Helm Tiller in your cluster, then use this method.

This command will install the Burst Scenario workloads into the `lab02` namespace we created earlier. It uses the `helm template` command to render the Chart into a static yaml file `lab02-burst-scenario.yaml`. You can specify the config values by using the `--set` command line options.

```bash
helm template "charts/burst-scenario" --name "lab02" --kube-version "1.10" --namespace "lab02" \
  --set mysql.host= \
  --set mysql.user= \
  --set mysql.password= \
  --set mysql.workItems.table= \
  --set azureStorage.account= \
  --set azureStorage.accessKey= \
  --set azureStorage.workItems.queue=
> lab02-burst-scenario.yaml
```

You can also chose to set these config values by updating the `charts/burst-scenario/values.yaml` file. The following simpler command can then be leveraged to render the Burst Scenario workloads yaml.

```bash
helm template "charts/burst-scenario" --name "lab02" --kube-version "1.10" --namespace "lab02" > lab02-burst-scenario.yaml
```

You can then use `kubectl create` to deploy the yaml into your cluster.

```bash
kubectl create -f lab02-burst-scenario.yaml -n lab02
```

## Run the Burst Scenario workload

Show the components running in the `lab02` namespace.

```bash
kubectl get svc,deployment,pod -n lab02
```

The following command will grab the url that the `burst-scenario-app` component can be reached at:

```bash
# Docker for Mac/Windows
kubectl get service lab02-burst-scenario-app -n lab02 -o jsonpath='http://host.docker.internal:{.spec.ports[0].nodePort}'

# Minikube
IP=$(sudo minikube ip)
PORT=$(kubectl get service lab02-burst-scenario-app -n lab02 -o jsonpath='{.spec.ports[0].nodePort}')
echo "http://$IP:$PORT"
```

Paste the retrieved url into a browser. You will be presented with a web ui that will show you details about the number of workitems being processed. The number of workitems that can be processed will quickly reach a plateau.

You can also look at the logs of each component to understand the processing taking place.

```bash
kubectl get pods -n lab02
kubectl logs lab02-burst-scenario-app-* -n lab02
kubectl logs lab02-burst-scenario-worker-* -n lab02
```

## Burst into Azure Container Instances with the Virtual Kubelet

To process the workitems faster, you will need additional processing capacity. You will need more instances of the `burst-scenario-worker` component. You will now add that additional processing capacity via the Virtual Kubelet backed by the azure (Azure Container Instances) provider.

Your pods for the additional processing capacity will be deployed on infrastructure outside your local cluster.

If you have a look at the Virtual Kubelet burst deployment `lab02-burst-scenario-worker-vk-aci`, you will see that it currently has 0 instances:

```bash 
kubectl get deployment lab02-burst-scenario-worker-vk-aci -n lab02
```

To add additional processing capacity, you will now scale up the deployment to 3  instances.

```bash
kubectl scale deploy lab02-burst-scenario-worker-vk-aci --replicas 3 -n lab02
```

Have a look at the 3 instances spinning up.

```bash
kubectl get pods -n lab02
```

It will be easier to add a `watch` to the previous command. the Wait until the first of the pods transition to a `Running` state:

```bash
kubectl get pods -n lab02 -w
```

Have a look at the logs of the pods running in the Virtual Kubelet to ensure that they are processing as expected.

```bash
kubectl logs lab02-burst-scenario-worker-vk-aci-* -n lab02
```

If you browse back to the web ui, you will notice that the work item processing rate has increased. This processing rate will continue to increase as more of the pods deployed into the Virtual Kubelet move to a `Running` state.

Once all the work items have been processed, scale the Virtual Kubelet burst deployment back to 0.

```bash
kubectl scale deploy lab02-burst-scenario-worker-vk-aci --replicas 0 -n lab02
```

Wait until the pods have been removed:

```bash
kubectl get pods -n lab02 -w
```

You have successfully added burst capacity to your worker pool in this lab via the Virtual Kubelet and the azure (Azure Container Instances) provider. You only pay for these resources by the second and do not need to spin up additional VM based nodes for this burst capability.

## Additional

Change the number of work items to a smaller number (200) and increase the compute time to 4s. Can you still scale up 5 worker instances via your `workitem-worker-vk-aci` deployment in time to process these work items?

> Note
> 
> You will need to use the `reset` button in the web ui to reset the queue and database.

What other ways can you think of connecting this burst capability to automatically respond?

## Clean up

You can clean up the resources in this lab as follows:

```bash
# if you used 'helm install'
helm del --purge "lab02"

# if you used 'helm template' and 'kubectl create'
kubectl delete -f lab02-burst-scenario.yaml -n lab02
```