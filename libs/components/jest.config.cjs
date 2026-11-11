module.exports = {
  displayName: "components",
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      { swcrc: false, jsc: { transform: { react: { runtime: "automatic" } } } },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  testMatch: ["<rootDir>/src/**/*.spec.ts", "<rootDir>/src/**/*.spec.tsx"],
  moduleNameMapper: {
    "^@utils$": "<rootDir>/../utils/src/index.ts",
    "^@utils/(.*)$": "<rootDir>/../utils/src/lib/$1",
    "^@models$": "<rootDir>/../models/src/index.ts",
    "^@dtos$": "<rootDir>/../dtos/src/index.ts",
    "^@enums$": "<rootDir>/../enums/src/index.ts",
  },
  coverageDirectory: "../../coverage/libs/components",
};
