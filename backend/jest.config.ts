import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^shared$': '<rootDir>/../shared/src',
        '^@prisma/client$': '<rootDir>/node_modules/@prisma/client'
    },
    transform: {
        '^.+\\.ts?$': ['ts-jest', {
            useESM: true,
        }],
    },
    extensionsToTreatAsEsm: ['.ts'],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    testMatch: ['**/tests/**/*.test.ts'],
    setupFiles: ['<rootDir>/tests/setup.ts'],
    verbose: true,
};

export default config; 