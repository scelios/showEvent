module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'ts', 'vue', 'json'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },

  moduleNameMapper: {
    '^vue$': '@vue/runtime-dom',
    '^@vue/test-utils$': '<rootDir>/node_modules/@vue/test-utils/dist/vue-test-utils.cjs.js',
  
    // your components are here, so this is correct if you use @/components/...
    '^@/(.*)$': '<rootDir>/pkg/linkedressources/$1',
  
    '^@shell/.*$': '<rootDir>/__mocks__/shellStub.js',
    '^@components/.*$': '<rootDir>/__mocks__/shellStub.js',
  },

  testMatch: ['**/tests/unit/**/*.test.js'],
};