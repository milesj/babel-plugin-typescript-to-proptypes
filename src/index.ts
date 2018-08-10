import { declare } from '@babel/helper-plugin-utils';
import syntaxTypeScript from '@babel/plugin-syntax-typescript';
import { types as t, traverse } from '@babel/core';
import convertToPropTypes from './convertToPropTypes';
import extractGenericTypeNames from './extractGenericTypeNames';

type Path<N> = traverse.NodePath<N>;

type Component = {
  node: t.ClassDeclaration | t.FunctionDeclaration | t.VariableDeclaration;
  name: string;
  type: 'class' | 'function' | 'var';
};

export default declare((api: any) => {
  api.assertVersion(7);

  let reactImportPath: Path<t.ImportDeclaration> | null = null;
  let reactImportedName: string = 'React';
  let hasPropTypesImport: boolean = false;
  let components: Component[] = [];
  const types: { [key: string]: t.TSPropertySignature[] } = {};

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
          case 'class': {
            const node = component.node as t.ClassDeclaration;

            if (!node.superTypeParameters) {
              return;
            }

            // @ts-ignore
            const typeNames = extractGenericTypeNames(node.superTypeParameters);
            const propTypesList = convertToPropTypes(types, typeNames, reactImportedName);
            let hasPropTypeProperty = false;

            node.body.body.forEach(property => {
              const valid = t.isClassProperty(property, {
                static: true,
                key: { name: 'propTypes' },
                value: { type: 'ObjectExpression' },
              });

              if (valid) {
                hasPropTypeProperty = true;

                // Add to the beginning of the array so custom prop types aren't overwritten
                (property.value as t.ObjectExpression).properties = [
                  ...propTypesList,
                  ...(property.value as t.ObjectExpression).properties,
                ];
              }
            });

            // Add a new static class property
            if (!hasPropTypeProperty) {
              const propertyObjectExpr = t.classProperty(
                t.identifier('propTypes'),
                t.objectExpression(propTypesList),
              );

              // @ts-ignore
              propertyObjectExpr.static = true;

              node.body.body.push(propertyObjectExpr);
            }

            break;
          }
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
      ClassDeclaration({ node }: Path<t.ClassDeclaration>) {
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
      FunctionDeclaration({ node }: Path<t.FunctionDeclaration>) {
        if (node.id.name.match(/^[A-Z]/)) {
          components.push({
            node,
            name: node.id.name,
            type: 'function',
          });
        }
      },

      // `const Foo: React.SFC<Props> = () => {};`
      VariableDeclaration({ node }: Path<t.VariableDeclaration>) {
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
            node,
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
