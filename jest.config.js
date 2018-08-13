module.exports = {
  coverageDirectory: './coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/esm/', '/lib/'],
  coverageReporters: ['lcov'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/**/*.{ts,tsx,js,jsx}': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  globals: {
    __DEV__: true,
    'ts-jest': {
      useBabelrc: true,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  setupFiles: [],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  testMatch: ['**/?(*.)+(spec|test).{ts,tsx,js,jsx}'],
  testURL: 'http://localhost',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
  verbose: false,
  testPathIgnorePatterns: ['/node_modules/', '/tests/fixtures/'],
  testEnvironment: 'node',
  transformIgnorePatterns: ['/node_modules/', '/tests/fixtures/'],
  modulePathIgnorePatterns: ['/node_modules/', '/tests/fixtures/'],
};
