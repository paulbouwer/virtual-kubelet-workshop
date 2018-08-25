# Demo 1 - Explore the Virtual Kubelet

## Setup

> **Requirements**
>
> An AKS cluster with virtual kubelet installed as per: https://docs.microsoft.com/en-us/azure/aks/virtual-kubelet
>
> Client binaries:
> - az cli
> - kubectl
>
> The `demo01` namespace created in the AKS cluster as follows:
>
> ```bash
> kubectl create namespace demo01
> ```
>
> The `hello-kubernetes` workload deployed into the `demo01` namespace as follows:
>
> ```bash
> kubectl create -f hello-kubernetes.deployment.yaml -n demo01
> ```

## Explore Virtual Kubelet deployed with Azure (ACI) provider

Get a list of the nodes in the AKS cluster. Notice that the Virtual Kubelet looks just like all of the other nodes, even though it isn't.

```bash
kubectl get nodes
```

Get the Virtual Kubelet node details.

```bash
kubectl describe node <VIRTUALKUBELET_NODE>
```

Call out the details in the labels, taints, conditions and capacity. The taint `azure.com/aci:NoSchedule` hints that this Virtual Kubelet node is backed by Azure Container Instances via the Azure provider.

Get the list of Virtual Kubelet pods and then the Virtual Kubelet pod details.

```bash
kubectl get pods
kubectl describe pod <VIRTUALKUBELET_POD>
```

Call out the `microsoft/virtual-kubelet:latest` image being used. Also call out the `virtual-kubelet` command and its args. 

Compare the arguments used with the full set at - https://github.com/virtual-kubelet/virtual-kubelet.

Then talk to the environment variables - both the common Virtual Kubelet vars and the Azure provider specific ones.

Notice that this pod will only be deployed to a Linux node.

## Deploy workload to node backed by Virtual Kubelet

Have a look at an example workload we are going to deploy to the Virtual Kubelet node. Open the `hello-kubernetes.vk.deployment.yaml` file.

Call out the `nodeSelector` and `tolerations` sections. Talk about why resource request limits are a good thing in terms of defaults that will be applied at the provider level without these.

In addition to ensuring resource management in a cluster, the resource request limits ensure that we don't overprovision the specialised backing resources.

Deploy the example workload.

```bash
kubectl create -f hello-kubernetes.deployment.yaml -n demo01
```

Notice that the workload is deployed onto the Virtual Kubelet node and also has an ip address not out of the same pool as the other workloads. The ACI backed pod has been given a public ip address. Talk to no VNET access currently via ACI.

```bash
kubectl get deployments,pods -o wide -n demo01
```

Show the resources backed in ACI.

```bash
az container list -o table
```