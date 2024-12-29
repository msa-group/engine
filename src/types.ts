export interface IGlobalDefaultParameters {
  Type: string;
  Default?: string;
}


export interface EngineContext {
  templateText: {
    main: string;
    dependencies: Record<string, string>;
  };
  templateJson: {
    main: Record<string, any>;
    dependencies: Record<string, any>;
  };
  data: Record<string, any>;
  resultYamlString: string;
}

export interface Composor {
  [key: string]: ComposorItem;
}

export interface ComposorItem {
  Component: string;
}

export interface ParseOptions {
  globalData: {
    Parameters: Record<string, any>;
  };
  componentPath: string;
}


export interface ComposerData {
  name: string;
  props: Record<string, any>;
  dependsOn: string[];
  parameters: Record<string, any>;
  operation: Record<string, any>;
  componentName: string;
}