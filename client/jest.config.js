export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  moduleNameMapper: {  
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  testMatch: [
    '<rootDir>/src/tests/**/*.test.js',
    '<rootDir>/src/tests/**/*.test.jsx'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/tests/**/*',
    '!src/**/*.test.{js,jsx}'
  ],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  
  globals: {
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder,
  },
  // Handle ES modules better
  extensionsToTreatAsEsm: ['.jsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-router|react-router-dom)/)'
  ]
};