import path from 'path';
import glob from 'glob';
import { transformFileSync } from '@babel/core';
import plugin from '../src';

function transform(filePath: string): string {
  return transformFileSync(filePath, {
    filename: filePath,
    plugins: [plugin],
    generatorOpts: {
      comments: false,
      quotes: 'single',
      jsescOption: { quotes: 'single' },
    },
  }).code;
}

describe('plugin', () => {
  glob
    .sync('./fixtures/**/*.ts', { absolute: true, cwd: __dirname, dot: false, strict: true })
    .forEach(filePath => {
      // if (!filePath.endsWith('extended-interfaces.ts')) {
      //   return;
      // }

      it(`transforms: ${path.basename(filePath)}`, () => {
        expect(transform(filePath)).toMatchSnapshot();
      });
    });
});
