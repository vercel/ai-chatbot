module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.[jt]s?(x)"],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],
};
