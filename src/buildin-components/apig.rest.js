export default `Operation:
  Type: ALIYUN::APIG::Operation
  MsaResource: true
  Properties:
    HttpApiId: {{Operation.ApiId}}
    OperationName: {{Operation.Name}}
    Path: {{Operation.PathValue}}
    Method: {{Operation.PathType}}

# 路由发布
PublishOperation:
  DependsOn:
    - Operation
  Type: ALIYUN::APIG::ApiAttachment
  Properties:
    EnvironmentId: {{Parameters.EnvironmentId}}
    BackendScene: {{Operation.Scene}}
    RouteId: mockRoute
    HttpApiId: {{Operation.ApiId}}
    ServiceConfigs: {{RosRouterServices(Operation.Services)}}
`