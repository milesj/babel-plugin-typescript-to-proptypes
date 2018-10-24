/* eslint-disable no-bitwise */

import { types as t } from '@babel/core';
import ts from 'typescript';
import {
  createCall,
  createMember,
  hasCustomPropTypeSuffix,
  isReactTypeMatch,
  wrapIsRequired,
} from './propTypes';
import { ConvertState, PropType } from './types';

export function convert(type: ts.Type, state: ConvertState, depth: number): PropType | null {
  const { reactImportedName, propTypes } = state;
  const propTypesImportedName = propTypes.defaultImport;
  const isMaxDepth = depth >= (state.options.maxDepth || 3);

  // Remove wrapping parens
  // if (ts.isParenthesizedExpression(type)) {
  //   type = type.typeAnnotation;
  // }

  state.propTypes.count += 1;

  // any -> PropTypes.any
  if (type.flags & ts.TypeFlags.Any) {
    return createMember(t.identifier('any'), propTypesImportedName);

    // string -> PropTypes.string
  } else if (type.flags & ts.TypeFlags.StringLike) {
    return createMember(t.identifier('string'), propTypesImportedName);

    // number -> PropTypes.number
  } else if (type.flags & ts.TypeFlags.NumberLike) {
    return createMember(t.identifier('number'), propTypesImportedName);

    // boolean -> PropTypes.bool
  } else if (type.flags & ts.TypeFlags.BooleanLike) {
    return createMember(t.identifier('bool'), propTypesImportedName);

    // symbol -> PropTypes.symbol
  } else if (type.flags & ts.TypeFlags.ESSymbolLike) {
    return createMember(t.identifier('symbol'), propTypesImportedName);

    // object -> PropTypes.object
  } else if (type.flags & ts.TypeFlags.Object) {
    const objType = type as ts.ObjectType;

    if (objType.objectFlags & ts.ObjectFlags.Interface) {
      // TODO
    } else if (objType.objectFlags & ts.ObjectFlags.Reference) {
      // TODO
    } else if (objType.objectFlags & ts.ObjectFlags.Tuple) {
      // TODO
    } else if (objType.objectFlags & ts.ObjectFlags.Mapped) {
      // TODO
    } else if (objType.objectFlags & ts.ObjectFlags.Instantiated) {
      // TODO
    } else if (objType.objectFlags & ts.ObjectFlags.ObjectLiteral) {
      // TODO
    }

    return createMember(t.identifier('object'), propTypesImportedName);

    // (() => void) -> PropTypes.func
  } else if (type.flags & ts.TypeFlags) {
    return createMember(t.identifier('func'), propTypesImportedName);

    // React.ReactNode -> PropTypes.node
    // React.ReactElement -> PropTypes.element
    // React.MouseEvent -> PropTypes.object
    // React.MouseEventHandler -> PropTypes.func
    // React.Ref -> PropTypes.oneOfType()
    // JSX.Element -> PropTypes.element
    // FooShape, FooPropType -> FooShape, FooPropType
    // Date, Error, RegExp -> Date, Error, RegExp
    // CustomType -> PropTypes.any
  } else if (t.isTSTypeReference(type)) {
    const name = getTypeName(type.typeName);

    // node
    if (
      isReactTypeMatch(name, 'ReactText', reactImportedName) ||
      isReactTypeMatch(name, 'ReactNode', reactImportedName) ||
      isReactTypeMatch(name, 'ReactType', reactImportedName)
    ) {
      return createMember(t.identifier('node'), propTypesImportedName);

      // function
    } else if (
      isReactTypeMatch(name, 'ComponentType', reactImportedName) ||
      isReactTypeMatch(name, 'ComponentClass', reactImportedName) ||
      isReactTypeMatch(name, 'StatelessComponent', reactImportedName)
    ) {
      return createMember(t.identifier('func'), propTypesImportedName);

      // element
    } else if (
      isReactTypeMatch(name, 'Element', 'JSX') ||
      isReactTypeMatch(name, 'ReactElement', reactImportedName) ||
      isReactTypeMatch(name, 'SFCElement', reactImportedName)
    ) {
      return createMember(t.identifier('element'), propTypesImportedName);

      // oneOfType
    } else if (isReactTypeMatch(name, 'Ref', reactImportedName)) {
      return createCall(
        t.identifier('oneOfType'),
        [
          t.arrayExpression([
            createMember(t.identifier('string'), propTypesImportedName),
            createMember(t.identifier('func'), propTypesImportedName),
            createMember(t.identifier('object'), propTypesImportedName),
          ]),
        ],
        propTypesImportedName,
      );

      // function
    } else if (name.endsWith('Handler')) {
      return createMember(t.identifier('func'), propTypesImportedName);

      // object
    } else if (name.endsWith('Event')) {
      return createMember(t.identifier('object'), propTypesImportedName);

      // native built-ins
    } else if (NATIVE_BUILT_INS.includes(name)) {
      return createCall(t.identifier('instanceOf'), [t.identifier(name)], propTypesImportedName);

      // inline references
    } else if (state.referenceTypes[name]) {
      return convert(state.referenceTypes[name], state, depth);

      // custom prop type variables
    } else if (hasCustomPropTypeSuffix(name, state.options.customPropTypeSuffixes)) {
      return t.identifier(name);

      // external references (uses type checker)
    } else if (state.typeChecker) {
      return convertSymbolFromSource(state.filePath, name, state);
    }

    // any (we need to support all these in case of unions)
    return createMember(t.identifier('any'), propTypesImportedName);

    // [] -> PropTypes.arrayOf(), PropTypes.array
  } else if (t.isTSArrayType(type)) {
    const args = convertArray([type.elementType], state, depth);

    return args.length > 0
      ? createCall(t.identifier('arrayOf'), args, propTypesImportedName)
      : createMember(t.identifier('array'), propTypesImportedName);

    // {} -> PropTypes.object
    // { [key: string]: string } -> PropTypes.objectOf(PropTypes.string)
    // { foo: string } -> PropTypes.shape({ foo: PropTypes.string })
  } else if (t.isTSTypeLiteral(type)) {
    // object
    if (type.members.length === 0 || isMaxDepth) {
      return createMember(t.identifier('object'), propTypesImportedName);

      // objectOf
    } else if (type.members.length === 1 && t.isTSIndexSignature(type.members[0])) {
      const index = type.members[0] as t.TSIndexSignature;

      if (index.typeAnnotation && index.typeAnnotation.typeAnnotation) {
        const result = convert(index.typeAnnotation.typeAnnotation, state, depth);

        if (result) {
          return createCall(t.identifier('objectOf'), [result], propTypesImportedName);
        }
      }

      // shape
    } else {
      return createCall(
        t.identifier('shape'),
        [
          t.objectExpression(
            convertListToProps(
              type.members.filter(member =>
                t.isTSPropertySignature(member),
              ) as t.TSPropertySignature[],
              state,
              [],
              depth + 1,
            ),
          ),
        ],
        propTypesImportedName,
      );
    }

    // string | number -> PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    // 'foo' | 'bar' -> PropTypes.oneOf(['foo', 'bar'])
  } else if (t.isTSUnionType(type) || t.isTSIntersectionType(type)) {
    const isAllLiterals = type.types.every(param => t.isTSLiteralType(param));
    let label;
    let args;

    if (isAllLiterals) {
      args = type.types.map(param => (param as t.TSLiteralType).literal);
      label = t.identifier('oneOf');
    } else {
      args = convertArray(type.types, state, depth);
      label = t.identifier('oneOfType');
    }

    if (label && args.length > 0) {
      return createCall(label, [t.arrayExpression(args)], propTypesImportedName);
    }

    // interface Foo {}
  } else if (t.isTSInterfaceDeclaration(type)) {
    if (type.body.body.length === 0 || isMaxDepth) {
      return createMember(t.identifier('object'), propTypesImportedName);
    }

    return createCall(
      t.identifier('shape'),
      [
        t.objectExpression(
          convertListToProps(
            type.body.body.filter(property =>
              t.isTSPropertySignature(property),
            ) as t.TSPropertySignature[],
            state,
            [],
            depth + 1,
          ),
        ),
      ],
      propTypesImportedName,
    );

    // type Foo = {};
  } else if (t.isTSTypeAliasDeclaration(type)) {
    return convert(type.typeAnnotation, state, depth);
  }

  state.propTypes.count -= 1;

  return null;
}

export function convertSymbolFromSource(
  filePath: string,
  symbolName: string,
  state: ConvertState,
): PropType | null {
  const program = state.typeProgram!;
  const checker = state.typeChecker!;
  const source = program.getSourceFile(filePath);

  if (!source) {
    return null;
  }

  let refNode: ts.Identifier | null = null;

  // Type references we're looking for are always from imports
  source.statements.some(node => {
    if (ts.isImportDeclaration(node) && node.importClause) {
      const { name, namedBindings } = node.importClause;

      if (name && name.text === symbolName) {
        refNode = name;

        return true;
      }

      if (!refNode && namedBindings && ts.isNamedImports(namedBindings)) {
        return namedBindings.elements.some(element => {
          if (element.name.text === symbolName) {
            refNode = element.name;

            return true;
          }

          return false;
        });
      }
    }

    return false;
  });

  if (!refNode) {
    return null;
  }

  const symbol = checker.getSymbolAtLocation(refNode);

  if (!symbol) {
    return null;
  }

  const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);

  console.log(symbol, source.locals.get(symbolName));

  // // This is a map of all symbols in the file.
  // // @ts-ignore
  // const symbol = source.locals.get(symbolName) as ts.Symbol;

  // if (!symbol) {
  //   return null;
  // }

  // console.log(symbol, symbol.declarations[0].);

  // const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.declarations[0].name);

  // console.log(type);
  // // console.log(type.getProperties());

  return null;
}
