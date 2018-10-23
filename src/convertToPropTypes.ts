import { types as t } from '@babel/core';
import getTypeName from './getTypeName';
import { PropType, TypePropertyMap, ConvertState } from './types';

const NATIVE_BUILT_INS = ['Date', 'Error', 'RegExp', 'Map', 'WeakMap', 'Set', 'WeakSet', 'Promise'];

function hasCustomPropTypeSuffix(name: string, suffixes?: string[]): boolean {
  return !!suffixes && suffixes.some(suffix => name.endsWith(suffix));
}

function isReactTypeMatch(name: string, type: string, reactImportedName: string): boolean {
  return name === type || name === `React.${type}` || name === `${reactImportedName}.${type}`;
}

function wrapIsRequired(propType: PropType, optional?: boolean | null): PropType {
  return optional ? propType : t.memberExpression(propType, t.identifier('isRequired'));
}

function createMember(value: t.Identifier, propTypesImportedName: string): t.MemberExpression {
  return t.memberExpression(t.identifier(propTypesImportedName), value);
}

function createCall(
  value: t.Identifier,
  args: (PropType | t.ArrayExpression | t.ObjectExpression)[],
  propTypesImportedName: string,
): t.CallExpression {
  return t.callExpression(createMember(value, propTypesImportedName), args);
}

function convert(type: any, state: ConvertState): PropType | null {
  const { reactImportedName, propTypes } = state;
  const propTypesImportedName = propTypes.defaultImport;

  // Remove wrapping parens
  if (t.isTSParenthesizedType(type)) {
    type = type.typeAnnotation;
  }

  state.propTypes.count += 1;

  // any -> PropTypes.any
  if (t.isTSAnyKeyword(type)) {
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
      return convert(state.referenceTypes[name], state);

      // custom prop type variables (must be last)
    } else if (hasCustomPropTypeSuffix(name, state.options.customPropTypeSuffixes)) {
      return t.identifier(name);
    }

    // any (we need to support all these in case of unions)
    return createMember(t.identifier('any'), propTypesImportedName);

    // [] -> PropTypes.arrayOf(), PropTypes.array
  } else if (t.isTSArrayType(type)) {
    const args = convertArray([type.elementType], state);

    return args.length > 0
      ? createCall(t.identifier('arrayOf'), args, propTypesImportedName)
      : createMember(t.identifier('array'), propTypesImportedName);

    // {} -> PropTypes.object
    // { [key: string]: string } -> PropTypes.objectOf(PropTypes.string)
    // { foo: string } -> PropTypes.shape({ foo: PropTypes.string })
  } else if (t.isTSTypeLiteral(type)) {
    // object
    if (type.members.length === 0) {
      return createMember(t.identifier('object'), propTypesImportedName);

      // objectOf
    } else if (type.members.length === 1 && t.isTSIndexSignature(type.members[0])) {
      const index = type.members[0] as t.TSIndexSignature;

      if (index.typeAnnotation && index.typeAnnotation.typeAnnotation) {
        const result = convert(index.typeAnnotation.typeAnnotation, state);

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
      args = convertArray(type.types, state);
      label = t.identifier('oneOfType');
    }

    if (label && args.length > 0) {
      return createCall(label, [t.arrayExpression(args)], propTypesImportedName);
    }

    // interface Foo {}
  } else if (t.isTSInterfaceDeclaration(type)) {
    if (type.body.body.length === 0) {
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
          ),
        ),
      ],
      propTypesImportedName,
    );

    // type Foo = {};
  } else if (t.isTSTypeAliasDeclaration(type)) {
    return convert(type.typeAnnotation, state);
  }

  state.propTypes.count -= 1;

  return null;
}

function convertArray(types: any[], state: ConvertState): PropType[] {
  const propTypes: PropType[] = [];

  types.forEach(type => {
    const prop = convert(type, state);

    if (prop) {
      propTypes.push(prop);
    }
  });

  return propTypes;
}

function convertListToProps(
  properties: t.TSPropertySignature[],
  state: ConvertState,
  defaultProps: string[] = [],
): t.ObjectProperty[] {
  const propTypes: t.ObjectProperty[] = [];

  properties.forEach(property => {
    if (!property.typeAnnotation) {
      return;
    }

    const propType = convert(property.typeAnnotation.typeAnnotation, state);

    if (propType) {
      propTypes.push(
        t.objectProperty(
          property.key,
          wrapIsRequired(
            propType,
            property.optional || defaultProps.includes((property.key as t.Identifier).name),
          ),
        ),
      );
    }
  });

  return propTypes;
}

export default function convertToPropTypes(
  types: TypePropertyMap,
  typeNames: string[],
  state: ConvertState,
  defaultProps: string[],
): t.ObjectProperty[] {
  const properties: t.ObjectProperty[] = [];

  typeNames.forEach(typeName => {
    if (types[typeName]) {
      properties.push(...convertListToProps(types[typeName], state, defaultProps));
    }
  });

  return properties;
}
