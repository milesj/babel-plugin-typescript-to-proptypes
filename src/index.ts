/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable complexity */
/**
 * @copyright   2018-2019, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 */

import { types as t } from '@babel/core';
import { addDefault, addNamed } from '@babel/helper-module-imports';
import syntaxTypeScript from '@babel/plugin-syntax-typescript';
import { TSTypeParameterInstantiation } from '@babel/types';
import { addToClass } from './addToClass';
import { addToFunctionOrVar } from './addToFunctionOrVar';
import { extractTypeProperties } from './extractTypeProperties';
import { ConvertState, Path, PluginOptions, PropTypeDeclaration } from './types';
import { upsertImport } from './upsertImport';

const BABEL_VERSION = 7;
const MAX_DEPTH = 3;
const MAX_SIZE = 25;
const REACT_FC_NAMES = ['SFC', 'StatelessComponent', 'FC', 'FunctionComponent'];

function isNotTS(name: string): boolean {
	return name.endsWith('.js') || name.endsWith('.jsx');
}

function isComponentName(name: string) {
	return !!name.match(/^[A-Z]/u);
}

function isPropsParam(param: t.Node): param is t.Identifier | t.ObjectPattern {
	return (
		// (props: Props)
		(t.isIdentifier(param) && !!param.typeAnnotation) ||
		// ({ ...props }: Props)
		(t.isObjectPattern(param) && !!param.typeAnnotation)
	);
}

function isPropsType(param: t.Node): param is PropTypeDeclaration {
	return t.isTSTypeReference(param) || t.isTSIntersectionType(param) || t.isTSUnionType(param);
}

export default (api: any, options: PluginOptions, root: string) => {
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
				options: {
					comments: false,
					customPropTypeSuffixes: [],
					forbidExtraProps: false,
					mapUnknownReferenceTypesToAny: false,
					maxDepth: MAX_DEPTH,
					maxSize: MAX_SIZE,
					strict: true,
					typeCheck: false,
					...options,
				},
				propTypes: {
					count: 0,
					defaultImport: '',
					hasImport: false,
				},
				reactImportedName: '',
				referenceTypes: {},
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

					// Find existing `react` and `prop-types` imports
					programPath.node.body.forEach((node) => {
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
							const response = upsertImport(node, {
								checkForNamed: 'forbidExtraProps',
							});

							state.airbnbPropTypes.hasImport = true;
							state.airbnbPropTypes.namedImports = response.namedImports;
							state.airbnbPropTypes.forbidImport = response.namedImport;
						}

						if (node.source.value === 'react') {
							const response = upsertImport(node);

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

					const transformers: (() => void)[] = [];

					programPath.traverse({
						// airbnbPropTypes.componentWithName()
						CallExpression(path: Path<t.CallExpression>) {
							const { node } = path;
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
						// @ts-expect-error Union not typed
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
								transformers.push(() => void addToClass(node, state));
							}
						},

						// `function Foo(props: Props) {}`
						FunctionDeclaration(path: Path<t.FunctionDeclaration>) {
							const { node } = path;

							if (
								!!state.reactImportedName &&
								node.id &&
								isComponentName(node.id.name) &&
								isPropsParam(node.params[0]) &&
								t.isTSTypeAnnotation(node.params[0].typeAnnotation) &&
								isPropsType(node.params[0].typeAnnotation.typeAnnotation)
							) {
								transformers.push(
									() =>
										void addToFunctionOrVar(
											path,
											node.id!.name,
											(node.params[0] as any).typeAnnotation.typeAnnotation,
											state,
										),
								);
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
							if (
								t.isIdentifier(node.object, {
									name: state.propTypes.defaultImport,
								})
							) {
								state.propTypes.count += 1;
							}
						},

						// `enum Foo {}`
						TSEnumDeclaration({ node }: Path<t.TSEnumDeclaration>) {
							state.referenceTypes[node.id.name] = node;

							node.members.forEach((member) => {
								state.referenceTypes[`${node.id.name}.${(member.id as t.Identifier).name}`] =
									member;
							});
						},

						// `interface FooProps {}`
						TSInterfaceDeclaration({ node }: Path<t.TSInterfaceDeclaration>) {
							state.componentTypes[node.id.name] = extractTypeProperties(
								node,
								state.componentTypes,
							);

							state.referenceTypes[node.id.name] = node;
						},

						// `type FooProps = {}`
						TSTypeAliasDeclaration({ node }: Path<t.TSTypeAliasDeclaration>) {
							state.componentTypes[node.id.name] = extractTypeProperties(
								node,
								state.componentTypes,
							);

							state.referenceTypes[node.id.name] = node;
						},

						// `const Foo = (props: Props) => {};`
						// `const Foo: React.FC<Props> = () => {};`
						// `const Ref = React.forwardRef<Element, Props>();`
						// `const Memo = React.memo<Props>();`
						VariableDeclaration(path: Path<t.VariableDeclaration>) {
							const { node } = path;

							if (node.declarations.length === 0) {
								return;
							}

							const decl = node.declarations[0];
							const id = decl.id as t.Identifier;
							let props: PropTypeDeclaration | null = null;

							// const Foo: React.FC<Props> = () => {};
							if (
								id?.typeAnnotation &&
								t.isTSTypeAnnotation(id.typeAnnotation) &&
								id?.typeAnnotation.typeAnnotation
							) {
								const type = id.typeAnnotation.typeAnnotation;

								if (
									t.isTSTypeReference(type) &&
									!!type.typeParameters &&
									type.typeParameters.params.length > 0 &&
									isPropsType(type.typeParameters.params[0]) &&
									// React.FC, React.FunctionComponent
									((t.isTSQualifiedName(type.typeName) &&
										t.isIdentifier(type.typeName.left, {
											name: state.reactImportedName,
										}) &&
										REACT_FC_NAMES.some((name) =>
											t.isIdentifier((type.typeName as any).right, { name }),
										)) ||
										// FC, FunctionComponent
										(!!state.reactImportedName &&
											REACT_FC_NAMES.some((name) => t.isIdentifier(type.typeName, { name }))))
								) {
									props = type.typeParameters.params[0];
								}

								// const Foo = (props: Props) => {};
								// const Foo = function(props: Props) {};
							} else if (
								t.isArrowFunctionExpression(decl.init) ||
								t.isFunctionExpression(decl.init)
							) {
								if (
									!!state.reactImportedName &&
									isComponentName(id.name) &&
									isPropsParam(decl.init.params[0]) &&
									t.isTSTypeAnnotation(decl.init.params[0].typeAnnotation) &&
									isPropsType(decl.init.params[0].typeAnnotation.typeAnnotation)
								) {
									props = decl.init.params[0].typeAnnotation.typeAnnotation;
								}

								// const Ref = React.forwardRef();
								// const Memo = React.memo<Props>();
							} else if (t.isCallExpression(decl.init)) {
								const { init } = decl;
								const typeParameters = (init as any).typeParameters as TSTypeParameterInstantiation;

								if (
									t.isMemberExpression(init.callee) &&
									t.isIdentifier(init.callee.object) &&
									t.isIdentifier(init.callee.property) &&
									init.callee.object.name === state.reactImportedName
								) {
									if (init.callee.property.name === 'forwardRef') {
										// const Ref = React.forwardRef<Element, Props>();
										if (
											!!typeParameters &&
											t.isTSTypeParameterInstantiation(typeParameters) &&
											typeParameters.params.length > 1 &&
											isPropsType(typeParameters.params[1])
										) {
											props = typeParameters.params[1];

											// const Ref = React.forwardRef((props: Props) => {});
										} else if (
											t.isArrowFunctionExpression(init.arguments[0]) &&
											init.arguments[0].params.length > 0 &&
											isPropsParam(init.arguments[0].params[0]) &&
											t.isTSTypeAnnotation(init.arguments[0].params[0].typeAnnotation) &&
											isPropsType(init.arguments[0].params[0].typeAnnotation.typeAnnotation)
										) {
											props = init.arguments[0].params[0].typeAnnotation.typeAnnotation;
										}
									} else if (init.callee.property.name === 'memo') {
										// const Ref = React.memo<Props>();
										if (
											!!typeParameters &&
											t.isTSTypeParameterInstantiation(typeParameters) &&
											typeParameters.params.length > 0 &&
											isPropsType(typeParameters.params[0])
										) {
											props = typeParameters.params[0];

											// const Ref = React.memo((props: Props) => {});
										} else if (
											t.isArrowFunctionExpression(init.arguments[0]) &&
											init.arguments[0].params.length > 0 &&
											isPropsParam(init.arguments[0].params[0]) &&
											t.isTSTypeAnnotation(init.arguments[0].params[0].typeAnnotation) &&
											isPropsType(init.arguments[0].params[0].typeAnnotation.typeAnnotation)
										) {
											props = init.arguments[0].params[0].typeAnnotation.typeAnnotation;
										}
									}
								}
							}

							if (props) {
								transformers.push(() => void addToFunctionOrVar(path, id.name, props!, state));
							}
						},
					});

					// After we have extracted all our information, run all transformers
					transformers.forEach((transformer) => {
						transformer();
					});
				},

				exit(path: Path<t.Program>, { filename }: any) {
					const state = (this as any).state as ConvertState;

					if (isNotTS(filename)) {
						return;
					}

					// Remove the `prop-types` import if no components exist,
					// and be sure not to remove pre-existing imports.
					path.get('body').forEach((bodyPath) => {
						if (
							state.propTypes.count === 0 &&
							t.isImportDeclaration(bodyPath.node) &&
							bodyPath.node.specifiers.length <= 1 &&
							bodyPath.node.source.value === 'prop-types'
						) {
							bodyPath.remove();
						}
					});
				},
			},
		},
	};
};
