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
  data: any;
  resultYamlString: string;
  serviceJson: Record<string, any>;
}

export interface Composor {
  [key: string]: ComposorItem;
}

export type Services = Record<string, {
  Backend: {
    Component: string;
    Parameters: Record<string, any>;
  }
}[]>

export interface ComposorItem {
  Component: string;
}

// unimplemented
export interface ParseOptions { }

export interface GlobalData {
  Parameters: Record<string, any>;
}

export interface ComposerData {
  name: string;
  props: Record<string, any>;
  dependsOn: string[];
  parameters: Record<string, any>;
  operation?: Record<string, any>;
  componentName: string;
}