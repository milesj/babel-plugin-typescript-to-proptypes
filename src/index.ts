import ts from 'typescript';
import { declare } from '@babel/helper-plugin-utils';
import { addDefault, addNamed } from '@babel/helper-module-imports';
import syntaxTypeScript from '@babel/plugin-syntax-typescript';
import { types as t } from '@babel/core';
import addToClass from './addToClass';
import addToFunctionOrVar from './addToFunctionOrVar';
import extractTypeProperties from './extractTypeProperties';
import { loadTypeChecker } from './typeChecker';
import upsertImport from './upsertImport';
import { Path, PluginOptions, ConvertState } from './types';

const BABEL_VERSION = 7;

function isNotTS(name: string): boolean {
  return name.endsWith('.js') || name.endsWith('.jsx');
}

export default declare((api: any, options: PluginOptions, root: string) => {
  api.assertVersion(BABEL_VERSION);

  return {
    inherits: syntaxTypeScript,

    manipulateOptions(opts: any, parserOptions: any) {
      // Some codebases are only partially TypeScript, so we need to support
      // regular JS and JSX files, otherwise the Babel parser blows up.
      parserOptions.plugins.push('jsx');
    },

    post() {
      // Free up any memory we're hogging
      (this as any).state = null;
    },

    pre() {
      // Setup initial state
      (this as any).state = {
        airbnbPropTypes: {
          count: 0,
          forbidImport: '',
          hasImport: false,
          namedImports: [],
        },
        componentTypes: {},
        filePath: '',
        options,
        propTypes: {
          count: 0,
          defaultImport: '',
          hasImport: false,
        },
        reactImportedName: '',
      };
    },

    visitor: {
      Program: {
        enter(programPath: Path<t.Program>, { filename }: any) {
          const state = (this as any).state as ConvertState;

          state.filePath = filename;

          if (isNotTS(filename)) {
            return;
          }

          if (options.typeCheck) {
            state.typeChecker = loadTypeChecker(options.typeCheck, root);
          }

          // Find existing `react` and `prop-types` imports
          programPath.node.body.forEach(node => {
            if (!t.isImportDeclaration(node)) {
              return;
            }

            if (node.source.value === 'prop-types') {
              const response = upsertImport(node, {
                checkForDefault: 'PropTypes',
              });

              state.propTypes.hasImport = true;
              state.propTypes.defaultImport = response.defaultImport;
            }

            if (node.source.value === 'airbnb-prop-types') {
              const response = upsertImport(node, { checkForNamed: 'forbidExtraProps' });

              state.airbnbPropTypes.hasImport = true;
              state.airbnbPropTypes.namedImports = response.namedImports;
              state.airbnbPropTypes.forbidImport = response.namedImport;
            }

            if (node.source.value === 'react') {
              const response = upsertImport(node, {
                checkForDefault: 'React',
              });

              state.reactImportedName = response.defaultImport;
            }
          });

          // Add `prop-types` import if it does not exist.
          // We need to do this without a visitor as we need to modify
          // the AST before anything else has can run.
          if (!state.propTypes.hasImport && state.reactImportedName) {
            state.propTypes.defaultImport = addDefault(programPath, 'prop-types', {
              nameHint: 'pt',
            }).name;
          }

          if (
            !state.airbnbPropTypes.hasImport &&
            state.reactImportedName &&
            options.forbidExtraProps
          ) {
            state.airbnbPropTypes.forbidImport = addNamed(
              programPath,
              'forbidExtraProps',
              'airbnb-prop-types',
            ).name;

            state.airbnbPropTypes.count += 1;
          }

          // Abort early if we're definitely not in a file that needs conversion
          if (!state.propTypes.defaultImport && !state.reactImportedName) {
            return;
          }

          programPath.traverse({
            // airbnbPropTypes.componentWithName()
            CallExpression({ node }: Path<t.CallExpression>) {
              const { namedImports } = state.airbnbPropTypes;

              if (
                options.forbidExtraProps &&
                t.isIdentifier(node.callee) &&
                namedImports.includes(node.callee.name)
              ) {
                state.airbnbPropTypes.count += 1;
              }
            },

            // `class Foo extends React.Component<Props> {}`
            // @ts-ignore
            'ClassDeclaration|ClassExpression': (path: Path<t.ClassDeclaration>) => {
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
                node.id.name.match(/^[A-Z]/u) && (
                  // (props: Props)
                  (t.isIdentifier(param) && param.typeAnnotation) ||
                  // ({ ...props }: Props)
                  (t.isObjectPattern(param) && param.typeAnnotation)
                );

              if (valid) {
                addToFunctionOrVar(path, node.id.name, state);
              }
            },

            // airbnbPropTypes.nonNegativeInteger
            Identifier({ node }: Path<t.Identifier>) {
              const { namedImports } = state.airbnbPropTypes;

              if (options.forbidExtraProps && namedImports.includes(node.name)) {
                state.airbnbPropTypes.count += 1;
              }
            },

            // PropTypes.*
            MemberExpression({ node }: Path<t.MemberExpression>) {
              if (t.isIdentifier(node.object, { name: state.propTypes.defaultImport })) {
                state.propTypes.count += 1;
              }
            },

            // `interface FooProps {}`
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
              }
            },
          });
        },

        exit(path: Path<t.Program>, { filename }: any) {
          const state = (this as any).state as ConvertState;

          if (isNotTS(filename)) {
            return;
          }

          // Remove the `prop-types` import of no components exist,
          // and be sure not to remove pre-existing imports.
          path.get('body').forEach(bodyPath => {
            if (
              state.propTypes.count === 0 &&
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
