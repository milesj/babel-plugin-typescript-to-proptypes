import { declare } from '@babel/helper-plugin-utils';
import { addDefault } from '@babel/helper-module-imports';
import syntaxTypeScript from '@babel/plugin-syntax-typescript';
import { types as t } from '@babel/core';
// import ts from 'typescript';
import addToClass from './addToClass';
import addToFunctionOrVar from './addToFunctionOrVar';
import extractTypeProperties from './extractTypeProperties';
import { Path, TypePropertyMap } from './types';

export default declare((api: any) => {
  api.assertVersion(7);

  // let program;
  // let checker;
  let reactImportedName: string = '';
  let propTypesImportedName: string = 'PropTypes';
  let hasPropTypesImport: boolean = false;
  let componentCount = 0;
  const types: TypePropertyMap = {};

  return {
    inherits: syntaxTypeScript,

    // pre(state: any) {
    //   program = ts.createProgram([state.opts.filename], {});
    //   checker = program.getTypeChecker();

    //   console.log(checker.getSymbolAtLocation(program.getSourceFile(state.opts.filename)!));
    // },

    visitor: {
      Program: {
        enter(path: Path<t.Program>) {
          // Find existing `react` and `prop-types` imports
          path.node.body.forEach(node => {
            if (!t.isImportDeclaration(node)) {
              return;
            }

            if (node.source.value === 'prop-types') {
              hasPropTypesImport = true;

              node.specifiers.forEach(spec => {
                if (t.isImportDefaultSpecifier(spec) || t.isImportNamespaceSpecifier(spec)) {
                  propTypesImportedName = spec.local.name;
                }
              });
            }

            if (node.source.value === 'react') {
              node.specifiers.forEach(spec => {
                if (t.isImportDefaultSpecifier(spec) || t.isImportNamespaceSpecifier(spec)) {
                  reactImportedName = spec.local.name;
                }
              });
            }
          });

          // Add `prop-types` import if it does not exist.
          // We need to do this without a visitor as we need to modify
          // the AST before anything else has can run.
          if (!hasPropTypesImport) {
            addDefault(path, 'prop-types', {
              nameHint: 'pt',
            });

            // Babel prefixes with an underscore
            propTypesImportedName = `_pt`;
          }

          path.traverse({
            // `class Foo extends React.Component<Props> {}`
            // @ts-ignore
            'ClassDeclaration|ClassExpression'(path: Path<t.ClassDeclaration>) {
              const { node } = path;
              // prettier-ignore
              const valid = node.superTypeParameters && (
                // React.Component, React.PureComponent
                (
                  t.isMemberExpression(node.superClass) &&
                  t.isIdentifier(node.superClass.object, { name: reactImportedName }) && (
                    t.isIdentifier(node.superClass.property, { name: 'Component' }) ||
                    t.isIdentifier(node.superClass.property, { name: 'PureComponent' })
                  )
                ) ||
                // Component, PureComponent
                (
                  reactImportedName && (
                    t.isIdentifier(node.superClass, { name: 'Component' }) ||
                    t.isIdentifier(node.superClass, { name: 'PureComponent' })
                  )
                )
              );

              if (valid) {
                addToClass(node, types, { reactImportedName, propTypesImportedName });
                componentCount += 1;
              }
            },

            // `function Foo(props: Props) {}`
            FunctionDeclaration(path: Path<t.FunctionDeclaration>) {
              const { node } = path;
              const param = node.params[0];
              // prettier-ignore
              const valid =
                param &&
                reactImportedName &&
                node.id.name.match(/^[A-Z]/) && (
                  // (props: Props)
                  (t.isIdentifier(param) && param.typeAnnotation) ||
                  // ({ ...props }: Props)
                  (t.isObjectPattern(param) && param.typeAnnotation)
                );

              if (valid) {
                addToFunctionOrVar(path, node.id.name, types, {
                  reactImportedName,
                  propTypesImportedName,
                });
                componentCount += 1;
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

              const type = id.typeAnnotation.typeAnnotation;
              // prettier-ignore
              const valid = t.isTSTypeReference(type) &&
                type.typeParameters &&
                type.typeParameters.params.length > 0 && (
                // React.SFC, React.StatelessComponent
                (
                  t.isTSQualifiedName(type.typeName) &&
                  t.isIdentifier(type.typeName.left, { name: reactImportedName }) &&
                  (
                    t.isIdentifier(type.typeName.right, { name: 'SFC' }) ||
                    t.isIdentifier(type.typeName.right, { name: 'StatelessComponent' })
                  )
                ) ||
                // SFC, StatelessComponent
                (
                  reactImportedName && (
                    t.isIdentifier(type.typeName, { name: 'SFC' }) ||
                    t.isIdentifier(type.typeName, { name: 'StatelessComponent' })
                  )
                )
              );

              if (valid) {
                addToFunctionOrVar(path, id.name, types, {
                  reactImportedName,
                  propTypesImportedName,
                });
                componentCount += 1;
              }
            },

            // `interface FooProps {}`
            // @ts-ignore
            TSInterfaceDeclaration({ node }: Path<t.TSInterfaceDeclaration>) {
              types[node.id.name] = extractTypeProperties(node, types);
            },

            // `type FooProps = {}`
            TSTypeAliasDeclaration({ node }: Path<t.TSTypeAliasDeclaration>) {
              types[node.id.name] = extractTypeProperties(node, types);
            },
          });
        },

        exit(path: Path<t.Program>) {
          if (componentCount !== 0) {
            return;
          }

          // Remove the `prop-types` import of no components exist
          path.get('body').forEach(bodyPath => {
            if (
              t.isImportDeclaration(bodyPath.node) &&
              bodyPath.node.source.value === 'prop-types'
            ) {
              bodyPath.remove();
            }
          });
        },
      },
    },
  };
});
