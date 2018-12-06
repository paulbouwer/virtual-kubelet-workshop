# Demo 2 - Install the Virtual Kubelet

## Requirements

An AKS cluster with virtual kubelet installed as per: https://docs.microsoft.com/en-us/azure/aks/virtual-kubelet

Client binaries:
- az cli
- kubectl
- helm

## Setup

Create the `demo02` namespace in the AKS cluster as follows:

```bash
kubectl create namespace demo02
```

Initialise Tiller in the cluster as follows:

```bash
kubectl apply rbac-virtualkubelet.yaml
helm init --service-account tiller
```

Set up the azure provider env vars via `setupEnvVars.sh` script.

```bash
. ./setupEnvVars.sh
```

---

## Demonstrate ACI Connector

Show how the installation of the Virtual Kubelet and the Azure (ACI) provider can be wrapped up. Have a look at the ACI Connector installation docs for the `az` cli.

https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest#az-aks-install-connector

## Deploy via Helm Chart

The Virtual Kubelet is not restricted to being installed via the `az` cli. Let's look at how we can install the Virtual Kubelet via Helm.

First let's obtain the Virtual Kubelet repo:

```bash
# option 1 - git clone
git clone https://github.com/virtual-kubelet/virtual-kubelet.git

# option 2 - curl
curl -sL "https://github.com/virtual-kubelet/virtual-kubelet/archive/master.tar.gz" | tar -zx && mv virtual-kubelet-master virtual-kubelet

cd virtual-kubelet
```

The following env vars have been set up in preparation:

```bash
AZURE_TENANT_ID
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
AZURE_SUBSCRIPTION_ID
AZURE_RG
ACI_REGION
```

Generate the api server certs. These will be added to the `cert` and `key` env vars.

```bash
chmod +x scripts/createCertAndKey.sh
. ./scripts/createCertAndKey.sh
```

Let's create a namespace to deploy our Virtual Kubelet into.

```bash
kubectl create namespace virtual-kubelet
```

If Tiller is installed in the cluster, we can use the following:

```bash
helm install "charts/virtual-kubelet" --name "aci-linux" --namespace "virtual-kubelet" \
  --set provider=azure \
  --set nodeName=virtual-kubelet-aci-linux \
  --set nodeOsType=Linux \
  --set taint.key=virtual-kubelet/aci \
  --set taint.value=linux \
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

Otherwise, use Helm to render the Chart into static yaml and deploy that using `kubectl` as follows:

```bash
helm template "charts/virtual-kubelet" --name "aci-linux" --kube-version "1.11" --namespace "virtual-kubelet" \
  --set provider=azure \
  --set nodeName=virtual-kubelet-aci-linux \
  --set nodeOsType=Linux \
  --set taint.key=virtual-kubelet/aci \
  --set taint.value=linux \
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

kubectl apply -f virtual-kubelet.yaml -n virtual-kubelet
```

Validate the node has been created and configured correctly:

```bash
kubectl get pods

kubectl get nodes

kubectl describe node virtual-kubelet-aci-linux
```

## Deploy workload to node backed by Virtual Kubelet

Have a look at an example workload we are going to deploy to the Virtual Kubelet node. Open the `hello-kubernetes.vk.deployment.yaml` file.

Call out the `nodeSelector` and `tolerations` sections. This is different to the previous demo since we have different args we have passed to our `virtual-kubelet` command.

Deploy the example workload.

```bash
kubectl create -f hello-kubernetes.vk.deployment.yaml -n demo02
```

Show the deployments and pods.

```bash
kubectl get deployments,pods -o wide -n demo02
```

Show the resources backed in ACI.

```bash
az container list -o table
```