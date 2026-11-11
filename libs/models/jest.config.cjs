module.exports = {
  displayName: "models",
  testEnvironment: "node",
  transform: { "^.+\\.(t|j)sx?$": ["@swc/jest", { swcrc: false }] },
  moduleFileExtensions: ["ts", "tsx", "js"],
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  moduleNameMapper: {
    "^@enums$": "<rootDir>/../enums/src/index.ts",
  },
  coverageDirectory: "../../coverage/libs/models",
};
