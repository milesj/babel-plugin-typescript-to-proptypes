import { ConvertState, PropType } from './types';

export function convert() {}

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

  const symbol = checker.getSymbolAtLocation(source);

  if (!symbol) {
    return null;
  }

  return null;
}
