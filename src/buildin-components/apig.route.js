export default `# 路由配置
Route:
  Type: ALIYUN::APIG::Route
  MsaResource: true
  Properties:
    HttpApiId: {{Operation.ApiId}}
    RouteName: {{Parameters.RouteName}}
    EnvironmentInfo: '{"EnvironmentId": "{{Parameters.EnvironmentId}}"}'
    Match: '{"Path": {"Type":"{{GetOperationPath(Operation, "type")}}", "Value": "{{GetOperationPath(Operation, "value")}}"}}'
    Backend: {{RosRouterServices(Operation.Services, Operation.Scene)}}

# 路由发布
PublishRoute:
  DependsOn:
    - Route
  Type: ALIYUN::APIG::ApiAttachment
  Properties:
    EnvironmentId: {{Parameters.EnvironmentId}}
    BackendScene: {{Operation.Scene}}
    RouteId:
      Fn::GetAtt:
      - Route
      - RouteId
    HttpApiId: {{Operation.ApiId}}
    ServiceConfigs: '[{"ServiceId":"mockServie","Weight":100}]'
`