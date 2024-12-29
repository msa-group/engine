export default `Resources:
  MSECluster:
    Type: ALIYUN::MSE::Cluster
    MsaResource: true
    Properties:
      InstanceCount: 1
      MseVersion: mse_dev
      ClusterVersion: NACOS_2_0_0
      PubNetworkFlow: 0
      ClusterType: Nacos-Ans
      ConnectionType: eni
      NetType: privatenet
      # 规格 1核2G
      ClusterSpecification: MSE_SC_1_2_60_c
      ClusterAliasName: {{Parameters.ClusterName}}
`