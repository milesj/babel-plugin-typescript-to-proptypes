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

describe('babel-plugin-typescript-to-proptypes', () => {
  glob
    .sync('./fixtures/**/*.ts', { cwd: __dirname, dot: false, strict: true })
    .forEach(filePath => {
      // if (!filePath.endsWith('var/extended-interfaces.ts')) {
      //   return;
      // }

      it(`transforms ${filePath}`, () => {
        expect(transform(path.join(__dirname, filePath))).toMatchSnapshot();
      });
    });
});
