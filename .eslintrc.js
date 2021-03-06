module.exports = {
  root: true,
  env: {
    node: true,
  },
  'extends': [
    'plugin:vue/essential',
    '@vue/standard',
    'standard'
  ],
  rules: {
    'space-before-function-paren': 'off'
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
}
