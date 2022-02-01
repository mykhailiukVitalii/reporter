module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    mocha: true,
  },
  extends: ['airbnb-base', 'prettier'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'max-len': ['error', { code: 120 }],
    'arrow-parens': 0,
    'no-underscore-dangle': 0,
    'class-methods-use-this': 0,
    'no-restricted-syntax': 0,
    quotes: 0,
    'no-console': 0,
    'no-continue': 0,
    'no-use-before-define': 0,
    'object-curly-newline': 0,
    'consistent-return': 0,
    'no-param-reassign': 0,
    'operator-linebreak': 0,
    'prefer-destructuring': 0,
    'no-plusplus': 0,
    camelcase: 0,
  },
};
