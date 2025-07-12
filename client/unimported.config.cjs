module.exports = {
  entry: "./src/main.jsx",
  aliases: {
    "@": "./src",
    "@shared": "./src/shared",
  },
  ignorePatterns: [
    "**/index.js",
    "**/index.jsx",
    "**/*.test.js",
    "**/*.test.jsx",
    "**/__tests__/**",
    "**/types.js",
  ],
};
