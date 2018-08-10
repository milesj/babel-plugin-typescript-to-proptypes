import fs from 'fs';
import path from 'path';
import { transform } from '@babel/core';
import plugin from '../src';

describe('plugin', () => {
  it('works', () => {
    const { code } = transform(
      fs.readFileSync(path.join(__dirname, './fixtures/class/generic-interface.ts')),
      {
        filename: 'generic-interface.ts',
        presets: [
          ['@babel/preset-env', { targets: { node: '8.9' } }],
          '@babel/preset-react',
          '@babel/preset-typescript',
        ],
        plugins: [plugin],
      },
    );

    expect(code).toMatchSnapshot();
  });
});
