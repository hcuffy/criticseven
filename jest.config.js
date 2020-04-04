/* eslint-disable indent */
module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testMatch: ['<rootDir>/server/**/*.test.{js,jsx}'],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  transformIgnorePatterns: ['<rootDir>/node_modules/']
}
