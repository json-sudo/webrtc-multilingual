module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
        '^(.*)\\?raw$': '$1'
    },
    transform: {
        '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.app.json' }]
    },
    testMatch: ['**/__tests__/**/*.test.ts?(x)']
};
