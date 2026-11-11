module.exports = {
  displayName: "utils",
  testEnvironment: "node",
  transform: { "^.+\\.(t|j)sx?$": ["@swc/jest", { swcrc: false }] },
  moduleFileExtensions: ["ts", "tsx", "js"],
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  coverageDirectory: "../../coverage/libs/utils",
};
