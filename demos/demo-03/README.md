# Demo 3 - Burst workload with the Virtual Kubelet

## Requirements

An AKS cluster with virtual node installed as per: https://docs.microsoft.com/en-us/azure/aks/virtual-nodes-cli

Client binaries:
- az cli
- kubectl

Ensure that `helm repo update` has been run.

This demo is based on the `Virtual Node Autoscale` demo at:
- https://github.com/Azure-Samples/virtual-node-autoscale

## Setup

Pull down the `Virtual Node Autoscale` demo repo:

```bash
# option 1 - git clone
git clone https://github.com/Azure-Samples/virtual-node-autoscale.git
 
# option 2 - curl
curl -sL "https://github.com/Azure-Samples/virtual-node-autoscale/archive/master.tar.gz" | tar -zx && mv virtual-node-autoscale-master virtual-node-autoscale
 
cd virtual-node-autoscale
```

### Virtual Node Admission Controller

Install the Virtual Node admission-controller.

```bash
helm install --name vn-affinity --namespace kube-system ./charts/vn-affinity-admission-controller
```

Create the `demo03` namespace in the AKS cluster and label it for the admission controller.

```bash
kubectl create namespace demo03
kubectl label namespace demo03 vn-affinity-injection=enabled
```

### Prometheus

Install the Prometheus Operator.

```bash
curl -sL https://raw.githubusercontent.com/coreos/prometheus-operator/master/bundle.yaml -o prometheus-operator.yaml
sed -i 's/namespace\: default/namespace\: demo03/g' prometheus-operator.yaml
kubectl apply -f prometheus-operator.yaml -n demo03
```

Create a Prometheus instance.

```bash
sed -i 's/namespace\: default/namespace\: demo03/g' online-store/prometheus-config/prometheus/prometheus-cluster-role-binding.yaml
kubectl apply -f online-store/prometheus-config/prometheus -n demo03
```

Expose a service for Prometheus instance.

```bash
kubectl expose pod prometheus-prometheus-0 -n demo03 --port 9090 --target-port 9090
```

### Install Application

Export the Virtual Node name.

```bash
export VK_NODE_NAME=virtual-node-aci-linux

sed -i 's/\.Values\.service\.type/\.Values\.app\.service\.type/g' charts/online-store/templates/NOTES.txt
sed -i 's/\.Values\.service\.port/\.Values\.app\.service\.port/g' charts/online-store/templates/NOTES.txt

helm install ./charts/online-store --name online-store --set counter.specialNodeName=$VK_NODE_NAME,app.ingress.enabled=false,app.service.type=LoadBalancer,appInsight.enabled=false --namespace demo03
```

### Deploy Prometheus Adapter

TODO 
sed to replace url and fix custom rule - remove '

```bash
sed -i 's/default\.svc/demo03\.svc/g' online-store/prometheus-config/prometheus-adapter/values.yaml
sed -i 's/'"'"'round(avg/round(avg/g' ./online-store/prometheus-config/prometheus-adapter/values.yaml
sed -i 's/\.GroupBy>>))'"'"'/\.GroupBy>>))/g' ./online-store/prometheus-config/prometheus-adapter/values.yaml

helm install stable/prometheus-adapter --name prometheus-adaptor -f ./online-store/prometheus-config/prometheus-adapter/values.yaml --namespace demo03
```

### Deploy Grafana Dashboard

```bash
helm install stable/grafana --name grafana -f grafana/values.yaml --namespace demo03
```

```bash
# password
kubectl get secret --namespace demo03 grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo

# pod
export GRAFANA_POD=$(kubectl get pods --namespace demo03 -l "app=grafana" -o jsonpath="{.items[0].metadata.name}")
kubectl --namespace demo03 port-forward $GRAFANA_POD 3000
```

---

## Discuss Application

Show store application

```bash
export EXTERNAL_IP=$(kubectl get service online-store -n demo03 -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
browse to http://$EXTERNAL_IP
```

Show Grafana dashboard

```bash
http://localhost:3000
```

Show pods running the online store

```bash
kubectl get pods -o wide -l app=online-store
```

Show Container Instances

```bash
az container list -o table
```

## Run load

Fire up the load tester binary.

```bash
docker run --rm -it rakyll/hey:0.1.1 -n 10 -c 10 -z 20m http://$EXTERNAL_IP
```

Show the Grafana dashboard and the increased requests per second. Keep an eye on the number of pods on the Node and in ACI.

Once the pods scale, have a look at the number of pods.

```bash
kubectl get pods -o wide -l app=online-store
az container list -o table
```

After some time, kill the load tester and look at the number of pods again. This should come down and all ACI instances should be deleted.

```bash
kubectl get pods -o wide -l app=online-store
az container list -o table
```