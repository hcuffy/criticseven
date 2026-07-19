module.exports = {
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  testMatch: ['<rootDir>/server/**/*.test.{js,jsx,ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: ['<rootDir>/node_modules/']
}
