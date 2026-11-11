module.exports = {
  displayName: "services",
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      { swcrc: false, jsc: { transform: { react: { runtime: "automatic" } } } },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js"],
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  moduleNameMapper: {
    "^@utils$": "<rootDir>/../utils/src/index.ts",
    "^@models$": "<rootDir>/../models/src/index.ts",
    "^@dtos$": "<rootDir>/../dtos/src/index.ts",
    "^@enums$": "<rootDir>/../enums/src/index.ts",
  },
  coverageDirectory: "../../coverage/libs/services",
};
