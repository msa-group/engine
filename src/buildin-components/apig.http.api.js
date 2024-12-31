export default `# 路由分组
HttpApi:
  Type: ALIYUN::APIG::HttpApi
  MsaResource: true
  Properties:
    HttpApiName: {{Parameters.ApiName}}
    Type: Rest
    BasePath: {{Default(Parameters.BasePath, '/')}}
    Protocols: '["HTTP", "HTTPS"]'
`