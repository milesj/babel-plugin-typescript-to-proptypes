import { declare } from '@babel/helper-plugin-utils';
import { addDefault } from '@babel/helper-module-imports';
import syntaxTypeScript from '@babel/plugin-syntax-typescript';
import { types as t } from '@babel/core';
// import ts from 'typescript';
import addToClass from './addToClass';
import addToFunctionOrVar from './addToFunctionOrVar';
import extractTypeProperties from './extractTypeProperties';
import { Path, ConvertState } from './types';

function isNotTS(name: string): boolean {
  return name.endsWith('.js') || name.endsWith('.jsx');
}

export default declare((api: any) => {
  api.assertVersion(7);

  return {
    inherits: syntaxTypeScript,

    manipulateOptions(opts: any, parserOptions: any) {
      // Inheriting the syntax doesn't seem to define these
      parserOptions.plugins.push('jsx');
    },

    // pre(state: any) {
    //   program = ts.createProgram([state.opts.filename], {});
    //   checker = program.getTypeChecker();

    //   console.log(checker.getSymbolAtLocation(program.getSourceFile(state.opts.filename)!));
    // },

    visitor: {
      Program: {
        enter(path: Path<t.Program>, state: ConvertState) {
          if (isNotTS(state.filename)) {
            return;
          }

          // Setup our initial state
          state.reactImportedName = '';
          state.propTypesImportedName = '';
          state.hasPropTypesImport = false;
          state.componentCount = 0;
          state.componentTypes = {};

          // Find existing `react` and `prop-types` imports
          path.node.body.forEach(node => {
            if (!t.isImportDeclaration(node)) {
              return;
            }

            if (node.source.value === 'prop-types') {
              state.hasPropTypesImport = true;

              node.specifiers.forEach(spec => {
                if (t.isImportDefaultSpecifier(spec) || t.isImportNamespaceSpecifier(spec)) {
                  state.propTypesImportedName = spec.local.name;
                }
              });
            }

            if (node.source.value === 'react') {
              node.specifiers.forEach(spec => {
                if (t.isImportDefaultSpecifier(spec) || t.isImportNamespaceSpecifier(spec)) {
                  state.reactImportedName = spec.local.name;
                }
              });
            }
          });

          // Add `prop-types` import if it does not exist.
          // We need to do this without a visitor as we need to modify
          // the AST before anything else has can run.
          if (!state.hasPropTypesImport && state.reactImportedName) {
            state.hasPropTypesImport = true;
            state.propTypesImportedName = addDefault(path, 'prop-types', {
              nameHint: 'pt',
            }).name;
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
                  t.isIdentifier(node.superClass.object, { name: state.reactImportedName }) && (
                    t.isIdentifier(node.superClass.property, { name: 'Component' }) ||
                    t.isIdentifier(node.superClass.property, { name: 'PureComponent' })
                  )
                ) ||
                // Component, PureComponent
                (
                  state.reactImportedName && (
                    t.isIdentifier(node.superClass, { name: 'Component' }) ||
                    t.isIdentifier(node.superClass, { name: 'PureComponent' })
                  )
                )
              );

              if (valid) {
                addToClass(node, state);
                state.componentCount += 1;
              }
            },

            // `function Foo(props: Props) {}`
            FunctionDeclaration(path: Path<t.FunctionDeclaration>) {
              const { node } = path;
              const param = node.params[0];
              // prettier-ignore
              const valid =
                param &&
                state.reactImportedName &&
                node.id.name.match(/^[A-Z]/) && (
                  // (props: Props)
                  (t.isIdentifier(param) && param.typeAnnotation) ||
                  // ({ ...props }: Props)
                  (t.isObjectPattern(param) && param.typeAnnotation)
                );

              if (valid) {
                addToFunctionOrVar(path, node.id.name, state);
                state.componentCount += 1;
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
                  t.isIdentifier(type.typeName.left, { name: state.reactImportedName }) &&
                  (
                    t.isIdentifier(type.typeName.right, { name: 'SFC' }) ||
                    t.isIdentifier(type.typeName.right, { name: 'StatelessComponent' })
                  )
                ) ||
                // SFC, StatelessComponent
                (
                  state.reactImportedName && (
                    t.isIdentifier(type.typeName, { name: 'SFC' }) ||
                    t.isIdentifier(type.typeName, { name: 'StatelessComponent' })
                  )
                )
              );

              if (valid) {
                addToFunctionOrVar(path, id.name, state);
                state.componentCount += 1;
              }
            },

            // `interface FooProps {}`
            // @ts-ignore
            TSInterfaceDeclaration({ node }: Path<t.TSInterfaceDeclaration>) {
              state.componentTypes[node.id.name] = extractTypeProperties(
                node,
                state.componentTypes,
              );
            },

            // `type FooProps = {}`
            TSTypeAliasDeclaration({ node }: Path<t.TSTypeAliasDeclaration>) {
              state.componentTypes[node.id.name] = extractTypeProperties(
                node,
                state.componentTypes,
              );
            },
          });
        },

        exit(path: Path<t.Program>, state: ConvertState) {
          if (isNotTS(state.filename) || state.componentCount !== 0) {
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
