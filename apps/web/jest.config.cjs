module.exports = {
  displayName: "web",
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
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@utils$": "<rootDir>/../../libs/utils/src/index.ts",
    "^@utils/(.*)$": "<rootDir>/../../libs/utils/src/lib/$1",
    "^@components$": "<rootDir>/../../libs/components/src/index.ts",
    "^@components/(.*)$": "<rootDir>/../../libs/components/src/lib/$1",
    "^@models$": "<rootDir>/../../libs/models/src/index.ts",
    "^@models/(.*)$": "<rootDir>/../../libs/models/src/lib/$1",
    "^@dtos$": "<rootDir>/../../libs/dtos/src/index.ts",
    "^@dtos/(.*)$": "<rootDir>/../../libs/dtos/src/lib/$1",
    "^@services$": "<rootDir>/../../libs/services/src/index.ts",
    "^@services/(.*)$": "<rootDir>/../../libs/services/src/lib/$1",
    "^@assets$": "<rootDir>/../../libs/assets/src/index.ts",
    "^@enums$": "<rootDir>/../../libs/enums/src/index.ts",
  },
  coverageDirectory: "../../coverage/apps/web",
};
