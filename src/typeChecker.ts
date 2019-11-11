import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';
import ts from 'typescript';

let config: ts.CompilerOptions;
let program: ts.Program;

export function loadTSConfig(): ts.CompilerOptions {
  if (config) {
    return config;
  }

  const { config: maybeConfig, error } = ts.readConfigFile(
    path.join(process.cwd(), 'tsconfig.json'),
    filePath => fs.readFileSync(filePath, 'utf8'),
  );

  if (error) {
    throw error;
  }

  const { options, errors } = ts.parseJsonConfigFileContent(maybeConfig, ts.sys, process.cwd());

  if (errors.length > 0) {
    throw errors[0];
  }

  config = options;

  return options;
}

export function loadProgram(pattern: true | string, root: string): ts.Program {
  if (program) {
    return program;
  }

  program = ts.createProgram(
    glob.sync(pattern === true ? './src/**/*.ts' : pattern, { absolute: true, cwd: root }),
    loadTSConfig(),
  );

  return program;
}
