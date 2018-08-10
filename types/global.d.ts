declare module '@babel/helper-plugin-utils';

declare module '@babel/plugin-syntax-typescript';

declare module '@babel/core' {
  import * as traverse from 'babel-traverse';

  export { traverse };
  export * from 'babel-core';
}
