export default {
  module: '@beemo/dev',
  drivers: ['babel', 'eslint', 'jest', 'prettier', 'typescript'],
  settings: {
    node: true,
  },
  // babel: {
  //   sourceType: 'module',
  //   ignore: ['tests/fixtures/**/*.js'],
  // },
  // eslint: {
  //   rules: {
  //     complexity: 'off',
  //     'no-shadow': 'off',
  //     'no-param-reassign': 'off',
  //     'no-use-before-define': 'off',
  //     'react/forbid-foreign-prop-types': 'off',
  //     'typescript/no-use-before-define': 'off',
  //     'import/no-extraneous-dependencies': 'off',
  //   },
  //   ignore: ['tests/fixtures/'],
  //   overrides: [
  //     {
  //       files: ['*.ts'],
  //       rules: {
  //         '@typescript-eslint/no-explicit-any': 'off',
  //       },
  //     },
  //   ],
  // },
  // jest: {
  //   testPathIgnorePatterns: ['/node_modules/', '/tests/fixtures/'],
  //   testEnvironment: 'node',
  //   transformIgnorePatterns: ['/node_modules/', '/tests/fixtures/'],
  //   modulePathIgnorePatterns: ['/node_modules/', '/tests/fixtures/'],
  // },
  // typescript: {
  //   exclude: ['./tests/fixtures/**/*'],
  // },
};
