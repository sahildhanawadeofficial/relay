import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  // next-auth and @auth/core ship as ESM — transform them via ts-jest
  transformIgnorePatterns: [
    '/node_modules/(?!(next-auth|@auth/core|oauth4webapi|@panva/hkdf|jose|preact|preact-render-to-string)/)',
  ],
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
      },
      diagnostics: false,
    }],
  },
};

export default config;
