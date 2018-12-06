# Lab 1 - Install Virtual Kubelet in a local Kubernetes cluster

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

This lab will guide you through installing the Virtual Kubelet in your local Kubernetes cluster. You will configure the Virtual Kubelet with the azure (Azure Container Instances) provider.

## Set up

First let's obtain the Virtual Kubelet repo:

```bash
# option 1 - git clone
git clone https://github.com/virtual-kubelet/virtual-kubelet.git

# option 2 - curl
curl -sL "https://github.com/virtual-kubelet/virtual-kubelet/archive/master.tar.gz" | tar -zx && mv virtual-kubelet-master virtual-kubelet

cd virtual-kubelet
```

Set the following environment variables in a shell on your machine. The values will be provided to you during the workshop.

```bash
AZURE_TENANT_ID=<azure_tenant_id>
AZURE_CLIENT_ID=<azure_client_id>
AZURE_CLIENT_SECRET=<azure_client_secret>
AZURE_SUBSCRIPTION_ID=<azure_subscription_id>
AZURE_RG=<azure_resource_group>
ACI_REGION=<aci_region>
```

Generate the api server certs. These will be added to the `cert` and `key` env vars.

```bash
chmod +x scripts/createCertAndKey.sh
. ./scripts/createCertAndKey.sh
```

## Helm Chart

You will install the Virtual Kubelet via the Helm Chart available in the GitHub repo you cloned earlier. You will find the Helm Chart in the following folder:

- charts/virtual-kubelet

Have a look in the folder to familiarise yourself with the Chart, its components, and values that must be provided to configure the Virtual Kubelet.

## Install the Virtual Kubelet

Create a namespace to deploy the Virtual Kubelet into.

```bash
kubectl create namespace virtual-kubelet
```
> NOTE
>
> You have two methods of installing the Virtual Kubelet via the Helm Chart. You can select to deploy using Helm's Tiller component via `helm install`, or you can select to render the Helm Chart to yaml via `helm template` and deploy the yaml via `kubectl`.
> 

### Method 1 - Helm Tiller

If you would like to explore this option and don't have Helm's Tiller installed, then look at the following documentation. It shows how to correctly install and configure Tiller in an RBAC enabled Kubernetes cluster.

- https://docs.microsoft.com/en-us/azure/aks/kubernetes-helm
- https://docs.helm.sh/helm/#helm-init
- https://docs.helm.sh/using_helm/#tiller-namespaces-and-rbac

This command will install the Virtual Kubelet into the `virtual-kubelet` namespace we created earlier. It will create a Linux node and leverage the azure (Azure Container Instances) provider.

```bash
helm install "charts/virtual-kubelet" --name "aci-linux" --namespace "virtual-kubelet" \
  --set provider=azure \
  --set nodeName=virtual-kubelet-aci-linux \
  --set nodeOsType=Linux \
  --set providers.azure.targetAKS=false \
  --set providers.azure.tenantId=$AZURE_TENANT_ID \
  --set providers.azure.subscriptionId=$AZURE_SUBSCRIPTION_ID \
  --set providers.azure.clientId=$AZURE_CLIENT_ID \
  --set providers.azure.clientKey=$AZURE_CLIENT_SECRET \
  --set providers.azure.aciResourceGroup=$AZURE_RG \
  --set providers.azure.aciRegion=$ACI_REGION \
  --set apiserverCert=$cert \
  --set apiserverKey=$key
```

### Method 2 - Render yaml

If you don't want to install Helm Tiller in your cluster, then use this method.

This command will install the Virtual Kubelet into the `virtual-kubelet` namespace we created earlier. It uses the `helm template` command to render the Chart into a static yaml file `virtual-kubelet-linux-aci.yaml`. You can then use `kubectl create` to deploy the yaml into your cluster.

```bash
helm template "charts/virtual-kubelet" --name "aci-linux" --kube-version "1.10" --namespace "virtual-kubelet" \
  --set provider=azure \
  --set nodeName=virtual-kubelet-aci-linux \
  --set nodeOsType=Linux \
  --set providers.azure.targetAKS=false \
  --set providers.azure.tenantId=$AZURE_TENANT_ID \
  --set providers.azure.subscriptionId=$AZURE_SUBSCRIPTION_ID \
  --set providers.azure.clientId=$AZURE_CLIENT_ID \
  --set providers.azure.clientKey=$AZURE_CLIENT_SECRET \
  --set providers.azure.aciResourceGroup=$AZURE_RG \
  --set providers.azure.aciRegion=$ACI_REGION \
  --set apiserverCert=$cert \
  --set apiserverKey=$key \
> virtual-kubelet-linux-aci.yaml

kubectl create -f virtual-kubelet.yaml -n virtual-kubelet
```

### Validation

You should see the following components get created in your Kubernetes cluster as a result of installing via either of the two methods above:

- service account
- cluster role binding
- secret
- deployment

Verify that the Virtual Kubelet pod has been created and is `Running`.

```bash
kubectl get pods -n virtual-kubelet
```

Verify that the Virtual Kubelet is presenting itself as a node within your cluster. The node name should match the `nodeName` value you provided during installation. The node should have a status of `Ready` and role of `agent`.

```bash
kubectl get nodes
```

Have a look at the details of the Virtual Kubelet node. Inspect and ensure you understand the values of the labels, taints, conditions and capacity sections.

```bash
kubectl describe node virtual-kubelet-aci-linux
```

## Deploy workload to node backed by Virtual Kubelet

Now that you have installed the Virtual Kubelet, you will need to obtain the Virtual Kubelet Workshop repo:

```bash
# option 1 - git clone
git clone https://github.com/paulbouwer/virtual-kubelet-workshop.git

# option 2 - curl
curl -sL "https://github.com/paulbouwer/virtual-kubelet-workshop/archive/master.tar.gz" | tar -zx && mv virtual-kubelet-workshop-master virtual-kubelet-workshop

cd virtual-kubelet-workshop/labs/lab-01
```

Create a namespace for this lab for the workload we will be deploying.

```bash
kubectl create namespace lab01
```

Have a look at an example workload we are going to deploy to the Virtual Kubelet node. Open the `hello-kubernetes.vk.deployment.yaml` file. Ensure that the `nodeSelector` and `tolerations` values match what you have configured for the Virtual Kubelet.

Deploy the example workload.

```bash
kubectl create -f hello-kubernetes.vk.deployment.yaml -n lab01
```

Show the deployments and pods.

```bash
kubectl get deployments,pods -o wide -n lab01
```

Once the `hello-kubernetes-*` pod is in a `Running` state, browse to the pod's IP address in a browser. Note that this is actually an external IP address provisioned in the Azure Container Instance resource that is backing the Virtual Kubelet you just installed.

Get details of the node. You will see the pod has been scheduled onto this virtual node. Pay close attention to the `Non-terminated Pods` and `Allocated resources` sections.

```bash
kubectl describe node virtual-kubelet-aci-linux
```

The pod is exposed on a public ip via Azure Container Instances. You can obtain this ip and browse to it in your browser.

```bash
kubectl get pods -o wide -n lab01
```

The resource backed by Virtual Kubelet is not joined to the same network as your Kubernetes cluster, hence you are seeing a public ip address for your pod.

Some of the Virtual Kubelet cloud providers provide a mechanism to join the private network of the Kubernetes cluster to the private network of the provider resource (e.g. Azure Container Instances). This flexibility allows you choice in how you would like to configure your Virtual Kubelet for different scenarios and workloads.

## Additional

You can deploy multiple Virtual Kubelets into your cluster. Explore how to add another into your cluster. Ensure you configure it with a different node name and/or taints to the one you just deployed. Change the yaml of the workload you deployed earlier to target this new Virtual Kubelet node.