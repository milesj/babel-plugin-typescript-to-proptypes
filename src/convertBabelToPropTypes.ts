/* eslint-disable @typescript-eslint/no-use-before-define */

import { types as t } from '@babel/core';
import { addComment } from '@babel/types';
import { convertSymbolFromSource } from './convertTSToPropTypes';
import extractEnumValues from './extractEnumValues';
import getTypeName from './getTypeName';
import {
  getDefaultImportNameFromPragma,
  getNodeTypesFromPragma,
  getFunctionTypesFromPragma,
  getElementTypesFromPragma,
} from './jsx-pragma';
import {
  createCall,
  createMember,
  hasCustomPropTypeSuffix,
  isReactTypeMatch,
  wrapIsRequired,
  getInstalledPropTypesVersion,
} from './propTypes';
import { PropType, TypePropertyMap, ConvertState } from './types';

const NATIVE_BUILT_INS = ['Date', 'Error', 'RegExp', 'Map', 'WeakMap', 'Set', 'WeakSet', 'Promise'];
const PROP_TYPES_15_7 = 15.7;

function convert(type: any, state: ConvertState, depth: number): PropType | null {
  const { reactImportedName, propTypes } = state;
  const propTypesImportedName = propTypes.defaultImport;
  const isMaxDepth = depth >= state.options.maxDepth;
  const { jsxPragma } = state.options;
  const defaultImportName = getDefaultImportNameFromPragma(jsxPragma);

  // Remove wrapping parens
  if (t.isTSParenthesizedType(type)) {
    type = type.typeAnnotation;
  }

  state.propTypes.count += 1;

  // any -> PropTypes.any
  // unknown -> PropTypes.any
  if (t.isTSAnyKeyword(type) || t.isTSVoidKeyword(type) || type.type === 'TSUnknownKeyword') {
    return createMember(t.identifier('any'), propTypesImportedName);

    // string -> PropTypes.string
  } else if (t.isTSStringKeyword(type)) {
    return createMember(t.identifier('string'), propTypesImportedName);

    // number -> PropTypes.number
  } else if (t.isTSNumberKeyword(type)) {
    return createMember(t.identifier('number'), propTypesImportedName);

    // boolean -> PropTypes.bool
  } else if (t.isTSBooleanKeyword(type)) {
    return createMember(t.identifier('bool'), propTypesImportedName);

    // symbol -> PropTypes.symbol
  } else if (t.isTSSymbolKeyword(type)) {
    return createMember(t.identifier('symbol'), propTypesImportedName);

    // object -> PropTypes.object
  } else if (t.isTSObjectKeyword(type)) {
    return createMember(t.identifier('object'), propTypesImportedName);

    // null -> PropTypes.oneOf([null])
  } else if (t.isTSNullKeyword(type)) {
    return createCall(
      t.identifier('oneOf'),
      [t.arrayExpression([t.nullLiteral()])],
      propTypesImportedName,
    );

    // 'foo' -> PropTypes.oneOf(['foo'])
  } else if (t.isTSLiteralType(type)) {
    return createCall(
      t.identifier('oneOf'),
      [t.arrayExpression([type.literal])],
      propTypesImportedName,
    );

    // enum Foo {} -> PropTypes.oneOf
  } else if (t.isTSEnumDeclaration(type)) {
    return createCall(
      t.identifier('oneOf'),
      [
        t.arrayExpression(
          extractEnumValues(type).map((value) => {
            if (typeof value === 'number') {
              return t.numericLiteral(value);
            }

            return t.stringLiteral(value);
          }),
        ),
      ],
      propTypesImportedName,
    );

    // Foo.VALUE -> *
  } else if (t.isTSEnumMember(type)) {
    if (type.initializer) {
      return type.initializer as t.Literal;
    }

    // (() => void) -> PropTypes.func
  } else if (t.isTSFunctionType(type)) {
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

    // Array<*>
    if (name === 'Array') {
      const args = convertArray([type.typeParameters?.params[0]], state, depth);

      if (args.length === 0) {
        return null;
      }

      return createCall(t.identifier('arrayOf'), args, propTypesImportedName);

      // node
    } else if (
      getNodeTypesFromPragma(jsxPragma).some((element) =>
        isReactTypeMatch(name, element, defaultImportName, reactImportedName),
      )
    ) {
      return createMember(t.identifier('node'), propTypesImportedName);

      // function
    } else if (
      getFunctionTypesFromPragma(jsxPragma).some((element) =>
        isReactTypeMatch(name, element, defaultImportName, reactImportedName),
      )
    ) {
      return getInstalledPropTypesVersion() >= PROP_TYPES_15_7
        ? createMember(t.identifier('elementType'), propTypesImportedName)
        : createMember(t.identifier('func'), propTypesImportedName);

      // element
    } else if (
      isReactTypeMatch(name, 'Element', defaultImportName, 'JSX') ||
      getElementTypesFromPragma(jsxPragma).some((element) =>
        isReactTypeMatch(name, element, defaultImportName, reactImportedName),
      )
    ) {
      return createMember(t.identifier('element'), propTypesImportedName);

      // oneOfType
    } else if (isReactTypeMatch(name, 'Ref', defaultImportName, reactImportedName)) {
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

    // Nothing found, so just omit
    return null;

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

      if (index.typeAnnotation?.typeAnnotation) {
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
              type.members.filter((member) =>
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

    // { [K in Type]: string } -> PropTypes.objectOf(PropTypes.string)
  } else if (t.isTSMappedType(type)) {
    const result = convert(type.typeAnnotation, state, depth);

    if (result) {
      return createCall(t.identifier('objectOf'), [result], propTypesImportedName);
    }

    // string | number -> PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    // 'foo' | 'bar' -> PropTypes.oneOf(['foo', 'bar'])
  } else if (t.isTSUnionType(type) || t.isTSIntersectionType(type)) {
    const isAllLiterals = type.types.every((param) => t.isTSLiteralType(param));
    const containsAny = type.types.some((param) => t.isTSAnyKeyword(param));
    let label;
    let args;

    if (isAllLiterals) {
      args = type.types.map((param) => (param as t.TSLiteralType).literal);
      label = t.identifier('oneOf');

      if (state.options.maxSize) {
        args = args.slice(0, state.options.maxSize);
      }
    } else if (containsAny) {
      return createMember(t.identifier('any'), propTypesImportedName);
    } else {
      args = convertArray(type.types, state, depth);
      label = t.identifier('oneOfType');

      // Contained unresolved references, so just omit for now
      if (args.length !== type.types.length) {
        return null;
      }
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
            type.body.body.filter((property) =>
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

    // Type['prop']
  } else if (t.isTSIndexedAccessType(type)) {
    const { objectType, indexType } = type;

    if (t.isTSTypeReference(objectType) && t.isTSLiteralType(indexType)) {
      const ref = state.referenceTypes[(objectType.typeName as any).name];
      let properties;

      if (t.isTSInterfaceDeclaration(ref)) {
        properties = ref.body.body;
      } else if (t.isTSTypeAliasDeclaration(ref) && t.isTSTypeLiteral(ref.typeAnnotation)) {
        properties = ref.typeAnnotation.members;
      } else {
        return null;
      }

      const property = properties.find(
        (prop) =>
          t.isTSPropertySignature(prop) && (prop.key as any).name === indexType.literal.value,
      );

      return property ? convert(property.typeAnnotation!.typeAnnotation, state, depth) : null;
    }

    // typeof foo
  } else if (t.isTSTypeQuery(type)) {
    return createMember(t.identifier('any'), propTypesImportedName);

    // keyof foo
  } else if (t.isTSTypeOperator(type) && type.operator === 'keyof') {
    return createMember(t.identifier('any'), propTypesImportedName);
  }

  state.propTypes.count -= 1;

  return null;
}

function mustBeOptional(type: t.Node): boolean {
  // Unions that contain undefined or null cannot be required by design
  if (t.isTSUnionType(type)) {
    return type.types.some(
      (value) =>
        t.isTSAnyKeyword(value) || t.isTSNullKeyword(value) || t.isTSUndefinedKeyword(value),
    );
  }

  return false;
}

function convertArray(types: any[], state: ConvertState, depth: number): PropType[] {
  const propTypes: PropType[] = [];

  types.forEach((type) => {
    const prop = convert(type, state, depth);

    if (prop) {
      propTypes.push(prop);
    }
  });

  return propTypes;
}

function convertListToProps(
  properties: t.TSPropertySignature[],
  state: ConvertState,
  defaultProps: string[],
  depth: number,
): t.ObjectProperty[] {
  const propTypes: t.ObjectProperty[] = [];
  let hasChildren = false;
  let size = 0;

  properties.some((property) => {
    if (state.options.maxSize && size === state.options.maxSize) {
      return true;
    }

    if (!property.typeAnnotation) {
      return false;
    }

    const type = property.typeAnnotation.typeAnnotation;
    const propType = convert(type, state, depth);
    const { name } = property.key as t.Identifier;

    if (propType) {
      const objProperty = t.objectProperty(
        property.key,
        wrapIsRequired(
          propType,
          !state.options.strict ||
            property.optional ||
            defaultProps.includes(name) ||
            mustBeOptional(type),
        ),
      );

      if (state.options.comments && property.leadingComments) {
        property.leadingComments.forEach((comment) => {
          addComment(objProperty as any, 'leading', comment.value);
        });
      }

      propTypes.push(objProperty);

      if (name === 'children') {
        hasChildren = true;
      }

      size += 1;
    }

    return false;
  });

  // Only append implicit children when the root list is being created
  if (!hasChildren && depth === 0 && propTypes.length > 0 && state.options.implicitChildren) {
    propTypes.push(
      t.objectProperty(
        t.identifier('children'),
        createMember(t.identifier('node'), state.propTypes.defaultImport),
      ),
    );
  }

  return propTypes;
}

export default function convertToPropTypes(
  types: TypePropertyMap,
  typeNames: string[],
  state: ConvertState,
  defaultProps: string[],
): t.ObjectProperty[] {
  const properties: t.ObjectProperty[] = [];

  typeNames.forEach((typeName) => {
    if (types[typeName]) {
      properties.push(...convertListToProps(types[typeName], state, defaultProps, 0));
    }
  });

  return properties;
}
