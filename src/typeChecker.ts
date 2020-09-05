import path from 'path';
import glob from 'fast-glob';
import ts from 'typescript';
import * as ttp from 'typescript-to-proptypes';

const TS_CONFIG = ttp.loadConfig(path.join(process.cwd(), 'tsconfig.json'));

const PROGRAM_LOOKUP: Record<string, ts.Program> = {};

function getProgramCacheKey(pattern: string | string[]) {
  return typeof pattern === 'string' ? pattern : pattern.join('//');
}

export function loadProgram(
  pattern: true | string | string[],
  root: string,
): ts.Program {
  const globSource = pattern === true ? './src/**/*.ts' : pattern;
  const key = getProgramCacheKey(globSource);

  if (key in PROGRAM_LOOKUP) {
    return PROGRAM_LOOKUP[key];
  }

  PROGRAM_LOOKUP[key] = ttp.createProgram(
    glob.sync(globSource, {
      absolute: true,
      cwd: root,
    }),
    TS_CONFIG,
  );

  return PROGRAM_LOOKUP[key];
}

interface GetPropsOptions {
  filename: string;
  pattern: true | string | string[];
  root: string;
}

export function getProps({
  filename,
  pattern,
  root,
}: GetPropsOptions): ttp.ComponentNode[] {
  const program = loadProgram(pattern, root);

  // `parseFromProgram` retrieves the TS definitions for the
  // props for every component in the file, and returns an
  // object representation of the props for each component
  return ttp.parseFromProgram(filename, program, {
    checkDeclarations: true,
  }).body;
}
