import { declare } from '@babel/helper-plugin-utils';
import syntaxTypeScript from '@babel/plugin-syntax-typescript';
import { types as t } from '@babel/core';
import addToClass from './addToClass';
import addToFunctionOrVar from './addToFunctionOrVar';
import { Component, Path, TypePropertyMap } from './types';

export default declare((api: any) => {
  api.assertVersion(7);

  let reactImportPath: Path<t.ImportDeclaration> | null = null;
  let reactImportedName: string = 'React';
  let hasPropTypesImport: boolean = false;
  let components: Component<any>[] = [];
  const types: TypePropertyMap = {};

  return {
    inherits: syntaxTypeScript,

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

      // Add `propTypes` to each component
      components.forEach(component => {
        switch (component.type) {
          case 'class':
            addToClass(component, types, reactImportedName);
            break;

          case 'function':
          case 'var':
            addToFunctionOrVar(component, types, reactImportedName);
            break;
        }
      });
    },

    visitor: {
      ImportDeclaration(path: Path<t.ImportDeclaration>) {
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
      ClassDeclaration(path: Path<t.ClassDeclaration>) {
        const { node } = path;

        if (!node.superTypeParameters) {
          return;
        }

        const valid = t.isMemberExpression(node.superClass, {
          object: { name: reactImportedName },
          property: { name: 'Component|PureComponent' },
        });

        if (valid) {
          components.push({
            path,
            name: node.id.name,
            type: 'class',
          });
        }
      },

      // `function Foo() {}`
      FunctionDeclaration(path: Path<t.FunctionDeclaration>) {
        const { node } = path;

        if (node.id.name.match(/^[A-Z]/)) {
          components.push({
            path,
            name: node.id.name,
            type: 'function',
          });
        }
      },

      // `const Foo: React.SFC<Props> = () => {};`
      VariableDeclaration(path: Path<t.VariableDeclaration>) {
        const { node } = path;

        if (node.declarations.length === 0) {
          return;
        }

        const id = node.declarations[0].id as t.Identifier;

        if (!id.typeAnnotation || !id.typeAnnotation.typeAnnotation) {
          return;
        }

        const valid = t.isGenericTypeAnnotation(
          // @ts-ignore
          id.typeAnnotation.typeAnnotation.typeName,
          {
            left: { name: reactImportedName },
            right: { name: 'StatelessComponent|SFC' },
          },
        );

        if (valid) {
          components.push({
            path,
            name: id.name,
            type: 'var',
          });
        }
      },

      // `interface FooProps {}`
      TSInterfaceDeclaration({ node }: Path<t.TSInterfaceDeclaration>) {
        types[node.id.name] = node.body.body.filter(prop =>
          t.isTSPropertySignature(prop),
        ) as t.TSPropertySignature[];
      },

      // `type FooProps = {}`
      TSTypeAliasDeclaration({ node }: Path<t.TSTypeAliasDeclaration>) {
        types[node.id.name] = (node.typeAnnotation as t.TSTypeLiteral).members.filter(prop =>
          t.isTSPropertySignature(prop),
        ) as t.TSPropertySignature[];
      },
    },
  };
});
