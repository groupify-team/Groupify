export default {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.js"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@api/(.*)$": "<rootDir>/src/api/$1",
    "^@assets/(.*)$": "<rootDir>/src/assets/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@features/(.*)$": "<rootDir>/src/features/$1",
    "^@pages/(.*)$": "<rootDir>/src/pages/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@tests/(.*)$": "<rootDir>/src/tests/$1",
    "^@auth/(.*)$": "<rootDir>/src/features/auth/$1",
    "^@dashboard/(.*)$": "<rootDir>/src/features/dashboard/$1",
    "^@face-recognition/(.*)$": "<rootDir>/src/features/face-recognition/$1",
    "^@friends/(.*)$": "<rootDir>/src/features/friends/$1",
    "^@photos/(.*)$": "<rootDir>/src/features/photos/$1",
    "^@trips/(.*)$": "<rootDir>/src/features/trips/$1",
    "^@settings/(.*)$": "<rootDir>/src/features/settings/$1",
    "^@notifications/(.*)$": "<rootDir>/src/features/notifications/$1",
  },
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  testMatch: [
    "<rootDir>/src/tests/**/*.test.js",
    "<rootDir>/src/tests/**/*.test.jsx",
  ],
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/main.jsx",
    "!src/tests/**/*",
    "!src/**/*.test.{js,jsx}",
  ],
  moduleDirectories: ["node_modules", "<rootDir>/src"],

  globals: {
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder,
  },
  // Handle ES modules better
  extensionsToTreatAsEsm: [".jsx"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-router|react-router-dom)/)",
  ],
};
