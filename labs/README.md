# Introduction to the Virtual Kubelet - Labs

## Lab 1 - Install Virtual Kubelet in a local Kubernetes cluster

This lab will guide you through installing the Virtual Kubelet in your local Kubernetes cluster. You will configure the Virtual Kubelet with the azure (Azure Container Instances) provider.

## Lab 2 - Explore burst scenario with the Virtual Kubelet

This lab will guide you through a workload burst scenario using the Virtual Kubelet in your local Kubernetes cluster. You will use the Virtual Kubelet that is configured with the azure (Azure Container Instances) provider.

The lab demonstrates a workload burst scenario where there is a worker container processing workitems off a queue and updating state in a database. The throughput is capped by the capacity within your cluster, so you will spin up additional adhoc instances of the worker via the Virtual Kubelet. You will see a ramp up in the processing of the workitems due to this additional adhoc processing capacity. Once the processing is done, you will spin down the adhoc instances down.

This is a great example of leveraging the Virtual Kubelet to add a burst capability to your cluster, and only paying for the time you use those additional resources.

## Lab 3 (Bonus) - Explore other Virtual Kubelet providers

Explore the other available Virtual Kubelet providers.