import { types as t } from '@babel/core';
import convertToPropTypes from './convertToPropTypes';
import { createPropTypesObject } from './propTypes';
import { Path, ConvertState } from './types';

export default function addVariable(
  path: Path<t.TSInterfaceDeclaration | t.TSTypeAliasDeclaration>,
  name: string,
  state: ConvertState,
) {
  const propTypesList = convertToPropTypes(state.componentTypes, [name], state, []);

  if (propTypesList.length === 0) {
    return;
  }

  const isExport = t.isExportDeclaration(path.parentPath);

  const variableDeclaration = t.variableDeclaration(
    'const',
    [
      t.variableDeclarator(
        t.identifier(name),
        createPropTypesObject(propTypesList, state),
      ),
    ],
  );

  path.insertAfter(
    isExport ?
      t.exportNamedDeclaration(variableDeclaration, []) :
      variableDeclaration
  );
}
