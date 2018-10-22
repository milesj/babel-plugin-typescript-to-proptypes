import path from 'path';
import glob from 'fast-glob';
import { transformFileSync } from '@babel/core';
import plugin from '../src';
import { PluginOptions } from '../src/types';

function transform(filePath: string, options: any = {}, pluginOptions: PluginOptions = {}): string {
  return (
    transformFileSync(filePath, {
      babelrc: false,
      configFile: false,
      filename: filePath,
      plugins: [[plugin, pluginOptions]],
      generatorOpts: {
        comments: false,
        quotes: 'single',
        jsescOption: { quotes: 'single' },
      },
      ...options,
    }).code || ''
  );
}

describe('babel-plugin-typescript-to-proptypes', () => {
  glob.sync('./fixtures/**/*.ts', { cwd: __dirname, dot: false }).forEach(basePath => {
    const filePath = String(basePath);

    if (filePath.includes('/special/')) {
      return;
    }

    // if (!filePath.endsWith('var/extended-interfaces.ts')) {
    //   return;
    // }

    it(`transforms ${filePath}`, () => {
      expect(transform(path.join(__dirname, filePath))).toMatchSnapshot();
    });
  });

  it('works correctly when transpiling down to ES3', () => {
    expect(
      transform(path.join(__dirname, './fixtures/special/es-target.ts'), {
        presets: ['@babel/preset-typescript', ['@babel/preset-env', { targets: { ie: '8' } }]],
        plugins: [plugin, '@babel/plugin-proposal-class-properties'],
      }),
    ).toMatchSnapshot();

    // loose
    expect(
      transform(path.join(__dirname, './fixtures/special/es-target.ts'), {
        presets: [
          '@babel/preset-typescript',
          ['@babel/preset-env', { targets: { ie: '8' }, loose: true }],
        ],
        plugins: [plugin, '@babel/plugin-proposal-class-properties'],
      }),
    ).toMatchSnapshot();
  });

  it('works correctly when transpiling down to ES5', () => {
    expect(
      transform(path.join(__dirname, './fixtures/special/es-target.ts'), {
        presets: ['@babel/preset-typescript', ['@babel/preset-env', { targets: { ie: '10' } }]],
        plugins: [plugin, '@babel/plugin-proposal-class-properties'],
      }),
    ).toMatchSnapshot();

    // loose
    expect(
      transform(path.join(__dirname, './fixtures/special/es-target.ts'), {
        presets: [
          '@babel/preset-typescript',
          ['@babel/preset-env', { targets: { ie: '10' }, loose: true }],
        ],
        plugins: [plugin, '@babel/plugin-proposal-class-properties'],
      }),
    ).toMatchSnapshot();
  });

  it('works correctly when transpiling down to ES6', () => {
    expect(
      transform(path.join(__dirname, './fixtures/special/es-target.ts'), {
        presets: [['@babel/preset-env', { targets: { node: '9' } }]],
      }),
    ).toMatchSnapshot();

    // loose
    expect(
      transform(path.join(__dirname, './fixtures/special/es-target.ts'), {
        presets: [['@babel/preset-env', { targets: { node: '9' }, loose: true }]],
      }),
    ).toMatchSnapshot();
  });

  it('works correctly when using the typescript preset', () => {
    expect(
      transform(path.join(__dirname, './fixtures/special/ts-preset.ts'), {
        presets: ['@babel/preset-typescript'],
      }),
    ).toMatchSnapshot();
  });

  it('works correctly when using the transform runtime', () => {
    expect(
      transform(path.join(__dirname, './fixtures/special/ts-preset.ts'), {
        presets: ['@babel/preset-typescript'],
        plugins: [plugin, '@babel/plugin-transform-runtime'],
      }),
    ).toMatchSnapshot();
  });

  it('works correctly when using ALL the things', () => {
    expect(
      transform(path.join(__dirname, './fixtures/special/ts-preset.ts'), {
        presets: [
          '@babel/preset-typescript',
          '@babel/preset-react',
          ['@babel/preset-env', { targets: { node: '9' } }],
        ],
        plugins: [plugin, '@babel/plugin-transform-runtime'],
      }),
    ).toMatchSnapshot();

    // Swap order & loose
    expect(
      transform(path.join(__dirname, './fixtures/special/ts-preset.ts'), {
        presets: [
          ['@babel/preset-env', { targets: { node: '9' }, loose: true }],
          '@babel/preset-react',
          '@babel/preset-typescript',
        ],
        plugins: ['@babel/plugin-transform-runtime', plugin],
      }),
    ).toMatchSnapshot();
  });

  it('works correctly when file is JSX/TSX', () => {
    expect(
      transform(path.join(__dirname, './fixtures/special/jsx.tsx'), {
        presets: [['@babel/preset-typescript', { isTSX: true, allExtensions: true }]],
      }),
    ).toMatchSnapshot();
  });

  describe('customPropTypeSuffixes', () => {
    it('supports custom prop type suffixes', () => {
      expect(
        transform(
          path.join(__dirname, './fixtures/special/custom-suffix.ts'),
          {},
          {
            customPropTypeSuffixes: ['Shape', 'PropType'],
          },
        ),
      ).toMatchSnapshot();
    });
  });

  describe('forbidExtraProps', () => {
    it('supports forbid extra props', () => {
      expect(
        transform(
          path.join(__dirname, './fixtures/special/forbid-extra-props.ts'),
          {},
          {
            forbidExtraProps: true,
          },
        ),
      ).toMatchSnapshot();
    });

    it('supports merging with forbid extra props', () => {
      expect(
        transform(
          path.join(__dirname, './fixtures/special/merge-forbid-extra-props.ts'),
          {},
          {
            forbidExtraProps: true,
          },
        ),
      ).toMatchSnapshot();
    });
  });
});
