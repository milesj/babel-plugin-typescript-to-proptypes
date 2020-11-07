import { JsxPragma } from './types';

const JSXPragmaToFcNamesMap: Record<JsxPragma, string[]> = {
  preact: ['ComponentFactory', 'FunctionComponent', 'FunctionalComponent'],
  react: ['SFC', 'StatelessComponent', 'FC', 'FunctionComponent'],
};

const JSXPragmaToClassComponentNamesMap: Record<JsxPragma, string[]> = {
  preact: ['Component', 'AnyComponent', 'ComponentClass', 'ComponentConstructor'],
  react: ['Component', 'PureComponent'],
};

const JSXPragmaToFcDefaultImportNameMap: Record<JsxPragma, string> = {
  preact: 'preact',
  react: 'React',
};

const JSXPragmaToNodeTypesMap: Record<JsxPragma, string[]> = {
  preact: ['VNode', 'Text', 'Element', 'JSX.Element', 'JSX.ElementClass'],
  react: ['ReactText', 'ReactNode', 'ReactType', 'ElementType'],
};

const JSXPragmaToFunctionTypesMap: Record<JsxPragma, string[]> = {
  preact: ['VNode', 'ComponentType', 'ComponentClass', 'ComponentConstructor', 'AnyComponent', 'ComponentType', 'Element', 'JSX.Element', 'JSX.ElementClass'],
  react: ['ComponentType', 'ComponentClass', 'StatelessComponent', 'ElementType'],
};

const JSXPragmaToElementTypesMap: Record<JsxPragma, string[]> = {
  preact: ['VNode', 'Element', 'JSX.Element', 'JSX.ElementClass'],
  react: [
    'ReactElement',
    'ComponentElement',
    'FunctionComponentElement',
    'DOMElement',
    'SFCElement',
  ],
};

export function checkForUnsupportedPragma(pragma: string) {
  if (!JSXPragmaToFcNamesMap[pragma as JsxPragma]) {
    throw new Error(
      `Unsupported JSX Pragma: ${pragma}, please use one of the following list: [${Object.keys(
        JSXPragmaToFcNamesMap,
      ).join(', ')}]`,
    );
  }
}

export function getFcNamesFromPragma(pragma: JsxPragma): string[] {
  return JSXPragmaToFcNamesMap[pragma];
}

export function getClassComponentNamesFromPragma(pragma: JsxPragma): string[] {
  return JSXPragmaToClassComponentNamesMap[pragma];
}

export function getDefaultImportNameFromPragma(pragma: JsxPragma): string {
  return JSXPragmaToFcDefaultImportNameMap[pragma];
}

export function getNodeTypesFromPragma(pragma: JsxPragma): string[] {
  return JSXPragmaToNodeTypesMap[pragma];
}

export function getFunctionTypesFromPragma(pragma: JsxPragma): string[] {
  return JSXPragmaToFunctionTypesMap[pragma];
}

export function getElementTypesFromPragma(pragma: JsxPragma): string[] {
  return JSXPragmaToElementTypesMap[pragma];
}
