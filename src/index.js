import syntaxTypeScript from '@babel/plugin-syntax-typescript';
import { types as t } from '@babel/core';
import * as ts from 'typescript';

export default function(api) {
  api.assertVersion(7);

  return {
    inherits: syntaxTypeScript,

    pre() {
      this.program = ts.createProgram(fileNames, options);
      this.checker = program.getTypeChecker();
    },

    visitor: {
      ClassDeclaration({ node }) {
        if (
          !t.isMemberExpression(node.superClass, {
            object: { name: 'React' },
            property: { name: 'Component' },
          }) ||
          !node.superTypeParameters
        ) {
          return;
        }
      },
    },
  };
}
