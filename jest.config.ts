import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.module.ts', '!src/main.ts', '!src/worker/**'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@order/(.*)$': '<rootDir>/src/order/$1',
    '^@payment/(.*)$': '<rootDir>/src/payment/$1',
    '^@inventory/(.*)$': '<rootDir>/src/inventory/$1',
    '^@shipping/(.*)$': '<rootDir>/src/shipping/$1',
    '^@notification/(.*)$': '<rootDir>/src/notification/$1',
  },
};

export default config;
