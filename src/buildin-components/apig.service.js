export default `Service:
  Type: ALIYUN::APIG::Service
  MsaResource: true
  Properties:
    GatewayId: {{Parameters.GatewayId}}
    ServiceName: {{Parameters.Name}}
    Addresses:
      Fn::Sub:
        - '["\${AddressesName}:\${Port}"]'
        - AddressesName: {{Parameters.AddressesName}}
          Port: {{Parameters.Port}}
    SourceType: 'DNS'

{{#if or(eq(Parameters.Port, 443), eq(Parameters.Port, 465))}}
ServiceTlsPolicy:
  Type: ALIYUN::APIG::Policy
  DependsOn:
    - Service
  Properties:
    EnvironmentId: {{Parameters.EnvironmentId}}
    AttachResourceIds:
      Fn::Sub:
        - '["\${ResourceId}"]'
        - ResourceId:
            Fn::GetAtt:
            - Service
            - ServiceId
    PolicyClassName: "ServiceTls"
    PolicyConfig:
      Fn::Sub:
        - '{"mode":"SIMPLE","sni":"\${HOST}","enable":true}'
        - HOST: {{Parameters.AddressesName}}
    GatewayId: {{Parameters.GatewayId}}
    AttachResourceType: "GatewayService"
{{/if}}
`