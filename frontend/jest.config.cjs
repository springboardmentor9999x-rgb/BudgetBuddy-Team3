module.exports = {
  testEnvironment: "jsdom",

  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },

  moduleFileExtensions: [
    "js",
    "jsx",
    "json",
  ],

  setupFilesAfterEnv: [
    "<rootDir>/src/setupTests.js",
  ],

  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.[jt]s?(x)",
    "<rootDir>/src/**/*.(test|spec).[jt]s?(x)",
  ],

  moduleNameMapper: {
    "\\.(css|less|scss|sass)$":
      "<rootDir>/src/testStyleMock.js",

    "\\.(png|jpg|jpeg|gif|svg|webp)$":
      "<rootDir>/src/testFileMock.js",
  },

  clearMocks: true,
};