module.exports = {
    preset: 'ts-jest', // Specify the ts-jest preset
    testEnvironment: 'node', // Use the Node.js test environment
    transform: {
        // '^.+\\.[tj]sx?$': 'babel-jest' // Use babel-jest for transformation
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(your-dependency)/)' // If needed, ignore specific modules 
    ],
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json' // Use the TypeScript config file
        }
    },
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ], // Ignore specific directories from tests
    collectCoverage: true, // Collect coverage information 
    collectCoverageFrom: [
        'src/**/*.ts' // Include TypeScript files from the `src` directory in coverage
    ]
};