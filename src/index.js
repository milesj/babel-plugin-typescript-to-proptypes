import { declare } from '@babel/helper-plugin-utils';
import syntaxTypeScript from '@babel/plugin-syntax-typescript';
import { types as t } from '@babel/core';
import * as ts from 'typescript';

export default declare(api => {
  api.assertVersion(7);

  let reactImportPath = null;
  let reactImportedName = 'React';
  let hasPropTypesImport = false;
  let components = [];

  return {
    inherits: syntaxTypeScript,

    pre() {
      const program = ts.createProgram(fileNames, options);

      this.program = program;
      this.checker = program.getTypeChecker();
    },

    post() {
      // Add `import PropTypes from 'prop-types'` if it does not exist
      if (reactImportPath && !hasPropTypesImport) {
        reactImportPath.insertAfter(
          t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier('PropTypes'))],
            t.stringLiteral('prop-types'),
          ),
        );
      }
    },

    visitor: {
      ImportDeclaration(path) {
        const { node } = path;

        if (node.source.value === 'prop-types') {
          hasPropTypesImport = true;
        }

        if (
          node.source.value === 'react' &&
          node.specifiers.length > 0 &&
          node.specifiers[0].type === 'ImportDefaultSpecifier'
        ) {
          reactImportPath = path;
          reactImportedName = node.specifiers[0].local.name;
        }
      },

      // `class Foo extends React.Component<Props> {}`
      ClassDeclaration({ node }) {
        if (!node.superTypeParameters) {
          return;
        }

        const valid = t.isMemberExpression(node.superClass, {
          object: { name: reactImportedName },
          property: { name: 'Component|PureComponent' },
        });

        if (valid) {
          components.push({
            node,
            name: node.id.name,
            type: 'class',
          });
        }
      },

      // `function Foo() {}`
      FunctionDeclaration({ node }) {
        if (node.name.text.match(/^[A-Z]/)) {
          components.push({
            node,
            name: node.id.name,
            type: 'function',
          });
        }
      },

      // `const Foo: React.SFC<Props> = () => {};`
      VariableDeclaration({ node }) {
        if (node.declarations.length === 0) {
          return;
        }

        const { id } = node.declarations[0];

        if (!id.typeAnnotation || !id.typeAnnotation.typeAnnotation) {
          return;
        }

        const valid = t.isGenericTypeAnnotation({
          qualification: { name: reactImportedName },
          id: { name: 'StatelessComponent|SFC' },
        });

        if (valid) {
          components.push({
            node,
            name: id.name,
            type: 'var',
          });
        }
      },
    },
  };
});
