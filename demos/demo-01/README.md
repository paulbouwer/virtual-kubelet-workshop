# Demo 1 - Explore the Virtual Kubelet

## Requirements
 
An AKS cluster with virtual node installed as per: https://docs.microsoft.com/en-us/azure/aks/virtual-nodes-cli

Client binaries:
- az cli
- kubectl

## Setup

Create the `demo01` namespace in the AKS cluster as follows:

```bash
kubectl create namespace demo01
```

Deploy the `hello-kubernetes` workload into the `demo01` namespace as follows:

```bash
kubectl create -f hello-kubernetes.deployment.yaml -n demo01
```
___

## Explore Virtual Kubelet deployed with Azure (ACI) provider

Get a list of the nodes in the AKS cluster. Notice that the Virtual Kubelet looks just like all of the other nodes, even though it isn't.

```bash
kubectl get nodes
```

Get the Virtual Kubelet node details.

```bash
kubectl describe node <VIRTUALKUBELET_NODE>
```

Call out the details in the labels, taints, conditions and capacity. The taint `virtual-kubelet.io/provider=azure:NoSchedule` hints that this Virtual Kubelet node is backed by Azure Container Instances via the Azure provider.

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

In addition to ensuring resource management in a cluster, the resource request limits ensure that we don't over-provision the specialised backing resources.

Deploy the example workload.

```bash
kubectl create -f hello-kubernetes.vk.deployment.yaml -n demo01
```

Notice that the workload is deployed onto the Virtual Kubelet node and also has an ip address out of the same pool as the other workloads. The ACI backed pod has been given a private ip address out of the AKS VNET. Talk to considerations around provider resources and whether they are able to be attached to the network of the cluster or not.

```bash
kubectl get deployments,pods -o wide -n demo01
kubectl logs <HELLO_KUBERNETES_POD>
```

Show the resources backed in ACI.

```bash
az container list -o table
az container logs <HELLO_KUBERNETES_POD>
```

Run an alpine instance to connect to the internal ip address of the pod and demonstrate connecting to the website.

```bash
kubectl run -it alpine --image=alpine:3.8 -n demo01 -- ash
$ apk add curl --update
$ curl -L <HELLO_KUBERNETES_POD_INTERNAL_IPADDRESS>
```