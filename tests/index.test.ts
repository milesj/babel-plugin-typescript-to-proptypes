import path from 'path';
import glob from 'fast-glob';
import { transformFileSync } from '@babel/core';
import plugin from '../src';
import { PluginOptions } from '../src/types';

function transform(
	filePath: string,
	options: Record<string, unknown> = {},
	pluginOptions: PluginOptions = {},
): string {
	return (
		transformFileSync(filePath, {
			babelrc: false,
			comments: pluginOptions.comments ?? false,
			configFile: false,
			filename: filePath,
			plugins: [[plugin, pluginOptions]],
			presets: [],
			generatorOpts: {
				jsescOption: { quotes: 'single' },
			},
			...options,
		})?.code ?? ''
	);
}

describe('babel-plugin-typescript-to-proptypes', () => {
	glob.sync('./fixtures/**/*.{ts,tsx}', { cwd: __dirname, dot: false }).forEach((basePath) => {
		const filePath = String(basePath);

		if (filePath.includes('/special/')) {
			return;
		}

		// if (!filePath.endsWith('var/extended-interfaces.ts')) {
		//   return;
		// }

		it(`transforms ${filePath}`, () => {
			expect(transform(path.join(__dirname, filePath), {}, { maxSize: 0 })).toMatchSnapshot();
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

	it('works correctly when transpiling to ESM modules', () => {
		expect(
			transform(path.join(__dirname, './fixtures/special/es-target.ts'), {
				presets: [['@babel/preset-env', { targets: { node: 12 }, modules: false }]],
			}),
		).toMatchSnapshot();

		// loose
		expect(
			transform(path.join(__dirname, './fixtures/special/es-target.ts'), {
				presets: [['@babel/preset-env', { targets: { node: 12 }, modules: false, loose: true }]],
			}),
		).toMatchSnapshot();
	});

	it('works correctly when transpiling to CJS modules', () => {
		expect(
			transform(path.join(__dirname, './fixtures/special/es-target.ts'), {
				presets: [['@babel/preset-env', { targets: { node: 12 }, modules: 'commonjs' }]],
			}),
		).toMatchSnapshot();

		// loose
		expect(
			transform(path.join(__dirname, './fixtures/special/es-target.ts'), {
				presets: [
					['@babel/preset-env', { targets: { node: 12 }, modules: 'commonjs', loose: true }],
				],
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

	it('handles self referencing types', () => {
		expect(
			transform(path.join(__dirname, './fixtures/special/recursive-type.ts')),
		).toMatchSnapshot();
	});

	it('handles type index access operator', () => {
		expect(transform(path.join(__dirname, './fixtures/special/index-access.ts'))).toMatchSnapshot();
	});

	it('handles typeof operator', () => {
		expect(transform(path.join(__dirname, './fixtures/special/type-of.ts'))).toMatchSnapshot();
	});

	it('handles keyof operator', () => {
		expect(transform(path.join(__dirname, './fixtures/special/key-of.ts'))).toMatchSnapshot();
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

	describe('implicitChildren', () => {
		it('includes a children prop type', () => {
			expect(
				transform(
					path.join(__dirname, './fixtures/special/implicit-children.ts'),
					{},
					{ implicitChildren: true },
				),
			).toMatchSnapshot();
		});
	});

	describe('maxDepth', () => {
		it('stops converting once max depth is met', () => {
			expect(
				transform(path.join(__dirname, './fixtures/special/max-depth.ts'), {}, { maxDepth: 3 }),
			).toMatchSnapshot();
		});
	});

	describe('maxSize', () => {
		it('stops at max size for shapes and literal arrays', () => {
			expect(
				transform(
					path.join(__dirname, './fixtures/special/max-size.ts'),
					{},
					{
						maxSize: 2,
					},
				),
			).toMatchSnapshot();
		});
	});

	describe('comments', () => {
		it('copies leading comments', () => {
			expect(
				transform(
					path.join(__dirname, './fixtures/special/comments.ts'),
					{},
					{
						comments: true,
					},
				),
			).toMatchSnapshot();
		});
	});

	describe('strict', () => {
		it('adds `isRequired` when strict', () => {
			expect(
				transform(
					path.join(__dirname, './fixtures/special/strict.ts'),
					{},
					{
						strict: true,
					},
				),
			).toMatchSnapshot();
		});

		it('omits `isRequired` when not strict', () => {
			expect(
				transform(
					path.join(__dirname, './fixtures/special/strict.ts'),
					{},
					{
						strict: false,
					},
				),
			).toMatchSnapshot();
		});
	});
});
